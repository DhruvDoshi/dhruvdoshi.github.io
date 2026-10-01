---
title: Zero-downtime database migrations at scale
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Platform architecture
categories: [Platform Architecture, Databases, Migrations]
---

Most migration guides describe a single `ALTER TABLE` on a dev database and call it a strategy. In production, migrations are a concurrency problem: old code and new code run against the same database while data keeps flowing. Zero-downtime migration is the discipline of making every change survive that overlap — less about clever tooling, more about an ordering discipline you refuse to violate.

## The core constraint: two versions of code run simultaneously

Every rolling deploy has a window — sometimes seconds, sometimes hours if you're doing canary analysis or progressive rollouts — where N-1 code and N code both hit the same database. Your migration must be safe for both. This single constraint drives everything else in this note.

A schema change is "backward compatible" only if **both the old and the new application code can run against the new schema**, and **both can run against the old schema** if a rollback reverses the code. That second clause is the one people forget. A migration that passes the first test but breaks rollback has quietly turned your rollback button into a bomb.

Backward compatibility, concretely:

- Adding a nullable column: safe. Old code ignores it; new code reads it.
- Adding a column with a NOT NULL constraint and no default: unsafe. Old code inserts rows without that column and fails.
- Adding a column with NOT NULL plus a database default: safe on PostgreSQL (metadata-only since PG11), and usually safe elsewhere — but know what your database does under the hood, because older PG versions rewrite the whole table.
- Dropping a column: unsafe if any running code still references it. It is only safe in the final phase of an expand-contract cycle.
- Renaming a column: unsafe, always. Renames are not one step; they are a multi-deploy sequence.
- Adding an index: safe if built concurrently. Unsafe if it takes a write lock for minutes on a hot table.
- Adding a new table: always safe. Nothing references it yet.
- Adding a foreign key: the constraint check can lock and scan; do it in phases.

The practical rule: if you can describe the change without using the word "instead of" or "rather than," it is probably additive and safe. Replacements — renamed, retyped, re-scoped — are never one step.

## The expand–contract pattern

Expand–contract (expand/migrate/contract) is the canonical zero-downtime migration pattern, and it deserves to be canonical because it directly encodes the two-versions constraint into three deploy phases.

**Phase 1 — Expand.** Change the schema in a purely additive way. New columns, new tables, new nullable fields. The new code ships in this phase but must not depend on the new structures yet, or must handle their absence gracefully. Deploy: code first or schema first? For additive changes, schema first is fine and often preferable — old code ignores unknown columns, and the new code is already written to tolerate missing data.

**Phase 2 — Migrate.** Move the data. Backfill the new column from the old one, dual-write from the application (write to old and new), or both. This phase is where the system exists in a hybrid state: old reads still use the old column, new reads can use the new one, writes go to both. This phase runs for as long as you need — it is a steady state, not a transition. You do not proceed until the data is fully consistent and you've verified it (row counts, checksums, spot checks).

**Phase 3 — Contract.** Once no old code remains anywhere — including queued workers, cron jobs, and that one forgotten batch job — remove the old structures. Drop the old column, remove the compatibility shims, stop dual-writing.

### A worked example: renaming `username` to `display_name`

Say the `users` table has `username VARCHAR(50)` and you want it renamed to `display_name`. A direct rename takes a lock and breaks old code mid-deploy. The expand–contract version:

**Deploy 1 (expand).**

```sql
ALTER TABLE users ADD COLUMN display_name VARCHAR(50);
```

Application code in Deploy 1 writes to both columns on every user create/update, but still reads from `username`. It must handle `display_name` being NULL for old rows (falls back to `username`).

**Between deploys (migrate).** Run a backfill job:

```
UPDATE users SET display_name = username
WHERE id BETWEEN ? AND ? AND display_name IS NULL;
```

Batched, throttled, resumable (more on this below). It runs while Deploy 1 code is live. Dual-writes keep new rows consistent.

**Deploy 2 (switch reads).** Application code now reads from `display_name`, writes to both. You can only do this after verifying the backfill is complete — check that `SELECT COUNT(*) FROM users WHERE display_name IS NULL` returns zero, or at least only rows you expect.

**Deploy 3 (contract).** Stop writing to `username`, drop the column:

```sql
ALTER TABLE users DROP COLUMN username;
```

Note the Deploy 2 / Deploy 3 boundary is where teams get burned: "Deploy 3 is safe because the code no longer reads username" is only true if *all* running code is Deploy 3 or later. Scheduled jobs, long-running workers, and delayed retries can still execute old code paths. Gate the contract phase on code-version verification, not on the calendar.

## Ordering rules: code before schema, or schema before code?

There are exactly two orderings, and the correct one depends on the change:

**Schema before code** — for additive, backward-compatible changes. Add the column, then ship code that uses it. Old code running against the new schema must work (this is the backward-compatibility check). Rollback of the code is safe because the schema change is additive.

**Code before schema** — almost never for DDL, but the *logic* ordering matters: the code that dual-writes must be live before the backfill runs, and the code that stops reading the old column must be fully rolled out before the column is dropped. The contract phase is where "code before schema" effectively happens: code stops using the old thing, then the schema removes it.

The rule of thumb: **expand phases are schema-then-code; contract phases are code-then-schema.** Write this on the team wiki. It prevents most migration incidents.

## Data backfills at scale

Backfills fail for three reasons: they lock too much, they can't be stopped and resumed, and they aren't idempotent. A backfill that can't be killed safely is not a backfill, it's a bet.

Requirements for a backfill that survives production:

1. **Batched.** Fixed batch sizes, keyed on an indexed column — not OFFSET/LIMIT, which degrades as the offset grows. Use keyset pagination: `WHERE id > last_id ORDER BY id LIMIT 1000`.
2. **Throttled.** Sleep between batches, or rate-limit writes. A backfill that saturates the primary's I/O is just a self-inflicted outage with extra steps.
3. **Resumable.** Persist the cursor (last processed key) somewhere durable. When the job restarts, it picks up where it left off.
4. **Idempotent.** Re-running a batch must produce the same result. This means the write condition must be explicit: `SET display_name = username WHERE display_name IS NULL`, never a blind overwrite.

Pseudocode:

```
cursor = load_checkpoint() or START
batch_size = 1000
while True:
    rows = SELECT id, username, display_name FROM users
           WHERE id > cursor AND display_name IS NULL
           ORDER BY id LIMIT batch_size
    if rows.empty: break
    for row in rows:
        UPDATE users SET display_name = username
        WHERE id = row.id AND display_name IS NULL
    cursor = rows.last.id
    save_checkpoint(cursor)
    sleep(throttle_delay)
```

Notes on this shape: the per-row `WHERE display_name IS NULL` is the idempotency guard — if the job crashes mid-batch and re-runs it, rows already written are skipped. The checkpoint makes it resumable. The sleep makes it polite. The keyset pagination keeps every query fast regardless of progress.

For very large tables, consider doing the backfill in the background *before* the expand deploy that needs it — a column can exist for weeks before code reads it. There is no rule that says expand and migrate must be the same deploy.

## Renaming columns and tables without downtime

Renames are the expand–contract example from above, generalized:

- **Column rename:** add new column, dual-write, backfill, switch reads, stop writing to old, drop old. Three or more deploys. There is no shortcut. If someone proposes `ALTER TABLE ... RENAME COLUMN` during a rolling deploy, they are proposing downtime or breakage — the old code references the old name.
- **Table rename:** create the new table, dual-write or replicate to it, backfill, switch reads over multiple deploys, then retire the old table. Views or synonyms can bridge the gap, but they add a layer future readers will trip over — prefer the explicit multi-deploy sequence.
- **Cold tables skip the ceremony:** for rarely-queried reference or admin tables, expand–contract is overkill. Rename during a low-traffic window with a brief lock. Zero-downtime is a spectrum — spend the complexity budget where the traffic is.

## Changing column types and constraints

- **Widening a type** (`VARCHAR(50)` → `VARCHAR(255)`, `INT` → `BIGINT`): usually safe, but check what your engine does under the hood — `INT` → `BIGINT` on PostgreSQL rewrites the table. For big tables, use the expand–contract variant (add a new column, backfill, switch).
- **Narrowing a type**: never safe in one step — data may not fit. Treat it as a rename-class change: add new column, backfill with explicit truncation rules, switch, drop.
- **Adding NOT NULL to an existing column:** backfill nulls via batched updates first, then apply the constraint. On PostgreSQL you can add the CHECK as `NOT VALID` (no table scan), backfill, then `VALIDATE CONSTRAINT`.
- **Adding UNIQUE:** build a unique index concurrently first (this also validates uniqueness), then add the constraint using the index. A non-concurrent unique build on a hot table is a write outage.

## Index creation without locking

On PostgreSQL: `CREATE INDEX CONCURRENTLY`. It does not take a write lock, at the cost of being slower and not running inside a transaction block. Most migration frameworks need an explicit opt-out of their default transaction wrapping for concurrent index builds — know where that flag lives in your tooling.

On MySQL/InnoDB: online DDL handles most index additions without full locks, but "online" still has phases with brief exclusive locks at the start and end. Monitor for lock wait timeouts during the build.

General guidance:

- Build indexes concurrently/always online, never in the default transaction.
- Prefer building during off-peak if the table is huge — concurrent doesn't mean free.
- Verify the index is actually used before dropping the old one (check the query plan; `EXPLAIN` is part of the migration, not an afterthought).
- Dropping an index is safe; it only affects the planner. But if you drop it because "we don't need it," someone else's slow query will find you.

## Migration tooling posture

Versioned migrations (Flyway, Liquibase, Alembic, Prisma Migrate, golang-migrate — pick your poison) are table stakes. The posture that matters:

- **One migrator at a time.** Migrations run from exactly one place: the deploy pipeline, or a dedicated migrator job — never from application startup on every replica. App-boot migrations cause lock contention between replicas racing to acquire the migration lock, and they couple schema changes to code rollout in exactly the wrong way.
- **Locking.** Your migration tool must take an advisory lock so two migrators can't run concurrently. If your tool doesn't do this, build it yourself.
- **Rollbacks that actually work.** Most teams' "rollback" is untested fiction. Two honest options: (a) write and test down-migrations, or (b) admit you don't have rollbacks and make every migration forward-fixable. Option (b) is legitimate *if it's a conscious decision* — forward-only migrations plus expand–contract means you rarely need to roll back schema. What is not legitimate is claiming you have rollbacks when you have untested `down` scripts that nobody has run since 2022.
- **Separate schema migrations from data migrations.** DDL runs in the deploy pipeline; backfills run as separate jobs with their own monitoring, throttling, and kill switches. Mixing them means a slow backfill blocks your deploy pipeline, or a deploy timeout kills your backfill mid-batch.
- **Dry-run against a production-like dataset.** A migration that takes 40ms on 10k rows can take 40 minutes on 100M rows. Run it against a restored snapshot before it runs against production.

## Monitoring migrations in production

Treat a migration deploy like any other risky change: watch lock waits and long-running transactions during DDL (a migration stuck waiting on a lock blocks everything behind it), track replication lag on DDL and large backfills (lag on read replicas *is* user-visible degradation), and alert on the backfill job itself — throughput, error rate, and checkpoint staleness. A backfill that silently stopped is worse than one that failed loudly. After the contract phase, check slow query logs for references to dropped structures for a full deploy cycle before declaring victory.

## When downtime is honestly acceptable

Zero-downtime is a goal, not a religion. Downtime is acceptable when:

- The blast radius is genuinely tiny: internal admin tools, batch pipelines with no interactive consumers, or products with agreed maintenance windows in the contract.
- The cost of expand–contract exceeds the cost of the outage. Renaming a column in a cold reference table via a 30-second maintenance window is better engineering than a three-deploy dance nobody will review carefully.
- You are pre-product-market-fit and every deploy is already effectively a maintenance window. But note this expires: the habits you build now become the constraints you live with later.

How to decide: estimate the cost of the outage (users affected × duration × severity) against the cost of the multi-deploy sequence (engineering time, review burden, risk of a half-finished contract phase lingering for months — which is its own risk). If the outage costs less and is communicable, take the outage, announce it, and do it in the window. The mistake is not choosing downtime; the mistake is choosing it by default out of laziness rather than by calculation.

## Anti-patterns

- **The big-bang migration weekend.** Fifty migrations, one deploy, Saturday at 2 AM, a war room full of tired people. It fails because the blast radius is everything and rollback is "restore from backup," which is a 4-hour RTO masquerading as a plan.
- **Untested rollbacks.** A `down` migration that has never been executed is documentation, not capability.
- **Migration that also backfills in the same deploy.** Your deploy pipeline now has the runtime characteristics of your data volume. Timeouts kill it mid-batch; restarts double-write. Keep DDL and data movement on separate tracks with separate lifecycles.
- **Renaming in place during rolling deploys.** Covered above; it breaks old code mid-rollout.
- **Application-boot migrations on every replica.** Lock contention, coupled lifecycles, and a schema change that rolls out at the speed of your slowest pod.
- **Non-concurrent index builds on hot tables.** A write lock that lasts as long as the table is large.
- **The abandoned contract phase.** Expand and migrate done; contract never happens because "it works fine." Six months later nobody remembers which column is canonical, dual-writes are load-bearing, and the next migration has to reason about both. Finish the sequence or don't start it.
