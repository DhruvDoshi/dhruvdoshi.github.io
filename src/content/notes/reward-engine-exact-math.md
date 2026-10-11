---
title: "Floating point has no place in financial math"
author: Dhruv Dhruv
date: 2026-10-11
reviewed: 2026-10-11
status: published
topic: Backend architecture
categories: [Backend, Fintech, Correctness]
---

`0.1 + 0.2 = 0.30000000000000004`. Everyone knows this. Almost everyone still ships financial math in floating point anyway, usually with a `toFixed(2)` on the end and a quiet hope the rounding hides the damage. It does not. It moves it somewhere you find later, in a reconciliation report, at the worst possible time.

I rebuilt a loyalty platform's reward engine to replace float math with exact rational arithmetic. This is what I found and what I changed.

## The bug that float math causes

The original engine computed points like this:

```typescript
const points = Number((amount * earnRate).toPrecision(12));
```

`toPrecision(12)` looks careful. It is a rounding operation applied at an arbitrary point in the computation, and it does two kinds of damage:

**Accumulation.** A merchant does 10,000 transactions a month. Each one rounds to 12 significant digits. The errors are not symmetric — they bias in whatever direction the binary representation leans for typical amounts and rates. Over a month, the merchant's points liability drifts from what the raw transaction data says. Pennies at first. Then dollars.

**Boundary flips.** Earn rules have thresholds: "earn only above $5", "max 100 points per transaction". A float computation landing at 4.999999999999 instead of 5.0 flips the eligibility decision. Threshold-adjacent amounts are common in retail — a $4.99 coffee, a $99.99 item — and float error clusters exactly where it hurts most: at decision boundaries.

The worst part: both failure modes are silent. No exception, no log line. The engine returns a number, the number is slightly wrong, and the wrongness compounds.

## Exact rational math

The fix is to never let a non-integer exist in the computation. Represent every amount and rate as a rational number — numerator and denominator — and do the arithmetic with BigInt:

```typescript
// Amounts in cents (integers), rates as rational fractions
type Rational = { num: bigint; den: bigint };

function mul(a: Rational, b: Rational): Rational {
  return reduce({ num: a.num * b.num, den: a.den * b.den });
}

// Points = floor(amount_cents * earnNum / earnDen / 100)
function computePoints(amountCents: bigint, earnRate: Rational): bigint {
  const raw = mul({ num: amountCents, den: 1n }, earnRate);
  return raw.num / (raw.den * 100n); // BigInt division truncates
}
```

The rules:

- **Store money as integers** (cents), always. The database column is an integer, not a decimal, not a float.
- **Store rates as rational pairs** (numerator, denominator), not as 0.05. "5 points per dollar" is `{ num: 5n, den: 1n }`. "1 point per $3" is `{ num: 1n, den: 3n }` — exactly representable as a rational, impossible as a float.
- **One rounding, at the end, explicit.** The only rounding in the pipeline is the final floor when converting to whole points — a deliberate business rule (documented, tested), not an accident of binary representation.
- **Deterministic.** Same inputs, same outputs, every time. Float arithmetic can vary across platforms in edge cases; integer arithmetic cannot. Determinism matters because the reconciliation job recomputes historical awards and compares them to the ledger.

## Rule versioning: the other half

Exact math is necessary but not sufficient. The engine also needs to answer: *which rule applied to this transaction?* Merchants change earn rates. If the engine always uses the current rule, recomputing a January transaction in March gives a different answer than what was credited — and reconciliation breaks again.

The fix: every rule change creates a new version. The transaction stores the rule version that was active when it was processed.

```sql
CREATE TABLE reward_rules (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  version INT NOT NULL,
  effective_from TIMESTAMPTZ NOT NULL,
  earn_num BIGINT NOT NULL,
  earn_den BIGINT NOT NULL,
  min_spend_cents INT,
  max_points_per_txn INT,
  UNIQUE (tenant_id, version)
);
```

The engine selects the rule with `effective_from <= transaction_at` — the latest such version, not "the current rule". A future-dated rule must not affect today's transactions or deactivate today's rule early. I found a bug where activating a new rule deactivated *all* of a tenant's rules including a scheduled future one; the fix was scoping deactivation to rules whose effective date had passed.

This also gives you an audit trail for free: when a merchant asks "why did this customer get 47 points in February?", you pull the transaction, read its rule version, and show the exact rate that applied. No guessing.

## Redemption eligibility edge cases

The eligibility check — "does this wallet have enough points?" — must compare integers, never floats. And the debit must happen inside a database transaction with a row lock:

```typescript
await db.transaction(async (tx) => {
  const [wallet] = await tx
    .select()
    .from(wallets)
    .where(eq(wallets.id, walletId))
    .for("update"); // row lock: concurrent redemptions serialize here

  if (wallet.balance < pointsToRedeem) throw new InsufficientPointsError();
  await tx.update(wallets).set({ balance: wallet.balance - pointsToRedeem });
  await tx.insert(walletLedger).values({ /* debit entry */ });
});
```

Without the row lock, two concurrent redemptions can both read the same balance, both pass the check, and both debit — driving the balance negative. The lock serializes them: the second waits, re-reads the updated balance, and fails correctly.

## The principle

Money is discrete. Cents are integers, points are integers, and every operation on them should be integer arithmetic with explicit, documented rounding at exactly one place in the pipeline. The moment a float enters a financial computation, you have introduced error you cannot bound, at boundaries you cannot predict, in a system where the errors compound silently. BigInt is slightly more verbose. Correctness is worth the verbosity.
