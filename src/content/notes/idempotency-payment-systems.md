---
title: "Idempotency keys are non-negotiable in payment systems"
author: Dhruv Dhruv
date: 2026-10-11
reviewed: 2026-10-11
status: published
topic: Backend architecture
categories: [Backend, Payments, Reliability]
---

If you take one thing from this note: in any system that moves money or points, every write path needs an idempotency key, enforced by a database unique constraint. Not a check in application code. Not a "we'll dedupe later" job. A unique constraint on the key, checked inside the same transaction as the write. Everything else is decoration.

I learned this building a multi-tenant loyalty platform with four POS integrations (Square, Clover, Toast, Lighthouse). Transactions arrive via webhooks and polling. Webhooks get retried by providers. Poll jobs overlap. Cron workers run concurrently. Every one of those paths can deliver the same transaction twice, and without idempotency, "twice" means the customer gets credited twice.

## The key format

The idempotency key for a transaction needs to be deterministic — computable from the event itself, without a database lookup — and globally unique across all your sources:

```
{provider}:{merchantId}:{providerTxnId}
```

For example: `square:loc_9Xk2:pay_7f3a1c`. This is stable: the same payment event from Square always produces the same key, whether it arrives via webhook, via the poll fallback, or gets replayed during a reconciliation run. That stability is the entire point. A random UUID generated at insert time is useless for idempotency — it cannot be recomputed by a second delivery of the same event.

The format also carries the tenant boundary. If two merchants somehow receive the same provider transaction ID (it happens with test data and sandbox accounts), the merchant segment keeps them from colliding.

## The database is the real guarantee

Application-level "check then insert" is not idempotency. Two concurrent workers can both check, both find nothing, and both insert. The pattern that actually works:

```sql
CREATE TABLE idempotency_keys (
  key TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

And the write path, in one transaction:

```typescript
await db.transaction(async (tx) => {
  // 1. Claim the key. If it exists, this is a duplicate.
  const [claim] = await tx
    .insert(idempotencyKeys)
    .values({ key, tenantId })
    .onConflictDoNothing()
    .returning();
  if (!claim) return { outcome: "duplicate" };

  // 2. Only now do the real work: insert transaction, credit wallet.
  await tx.insert(transactions).values({ ... });
  await tx.update(wallets).set({ balance: sql`balance + ${points}` });
});
```

`onConflictDoNothing` on the primary key is the atomic claim. The database serializes concurrent inserts on the same key; exactly one wins. Everything downstream — the transaction record, the wallet credit, the ledger entry — happens only after the claim succeeds, inside the same transaction. If the transaction rolls back, the key claim rolls back with it, and a retry can safely re-attempt. This is the whole pattern. There is no step three.

A common mistake: inserting the idempotency key *after* doing the work, or in a separate transaction. Then a crash between the credit and the key insert produces a duplicate on retry. The key insert must come first, in the same transaction.

## 30-day TTL

Idempotency keys accumulate. Every transaction leaves one behind, and in a busy system that table grows without bound. Set a TTL and enforce it:

```sql
-- Purge keys older than 30 days; duplicates after 30 days are a non-issue
DELETE FROM idempotency_keys WHERE created_at < now() - INTERVAL '30 days';
```

Thirty days covers the retry windows of every provider I worked with — Square and Clover retry webhooks for hours to days, not weeks. Run the purge as a scheduled job. If your provider has a documented maximum retry window, set the TTL comfortably above it. The trade-off is real: too short and a late redelivery double-credits; too long and the table bloats. Thirty days was the right number for POS webhooks.

## What happens without them

The failure mode is not theoretical. Before the key table was in place, the platform had a webhook endpoint that stored raw payloads and processed them asynchronously. Square retried a webhook during a brief outage. The retry was processed as a new event. The customer was credited twice for one purchase. The merchant's points liability doubled on that transaction, and because the ledger is append-only (correctly), the fix was a manual compensating entry, not a delete.

The insidious part: nothing errored. Both deliveries returned 200. The bug was invisible until someone reconciled the merchant's liability against actual sales. In a loyalty system, double-credits are silent money creation. In a payment system, they are silent money movement. Both are the kind of bug that erodes trust in the platform itself, not just in one transaction.

## The checklist

For every path that writes something of value:

1. **Deterministic key format** — computable from the event, stable across redelivery.
2. **Unique constraint in the database** — the claim must be atomic.
3. **Key claimed first, in the same transaction** as the work it guards.
4. **TTL with a scheduled purge** — bounded growth, aligned to provider retry windows.
5. **Cover every ingestion path** — webhooks, polling, manual replays, migrations. A backfill script that bypasses idempotency will re-credit everything it touches.

Idempotency is not a feature. It is a precondition for correctness in any system where the same event can arrive more than once — which is every system that talks to the real world.
