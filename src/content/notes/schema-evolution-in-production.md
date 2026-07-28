---
title: Plan schema evolution as a production migration
author: Dhruv Doshi
date: 2025-02-01
status: published
topic: Distributed systems
categories: [Database, Schema Evolution, Reliability]
---

Database schema changes are distributed-system changes. Application instances, background jobs, replicas, analytical consumers, and rollback versions rarely update at the same instant. A safe migration keeps mixed versions compatible during the transition.

## Expand before you contract

For a rename or representation change:

1. Add the new structure without removing the old one.
2. Deploy code that can read both and writes the chosen transition form.
3. Backfill historical data in bounded batches.
4. Verify parity and move readers to the new structure.
5. Stop old writes, observe, then remove the old structure later.

Each phase should be independently deployable and reversible. The exact dual-read or dual-write strategy depends on transaction boundaries and performance, but the compatibility window must be explicit.

## Understand the database operation

An apparently simple `ALTER TABLE` can lock a large relation, rewrite data, expand a transaction log, saturate replicas, or exhaust storage. Behavior varies by database engine and version. Use the vendor’s current documentation, test with representative size and load, and define cancellation and recovery before production execution.

For PostgreSQL, the official [`ALTER TABLE` documentation](https://www.postgresql.org/docs/current/sql-altertable.html) describes lock levels and operation behavior. It should be consulted for the deployed version rather than relying on a generic migration recipe.

## Backfill as a workload

Backfills need rate limits, checkpoints, idempotency, observability, and pause controls. Process stable key ranges rather than relying on offsets in a changing table. Monitor query latency, lock waits, replica lag, storage, error rate, and remaining rows.

Validate semantic correctness, not only non-null counts. Sample records, compare old and new reads, and reconcile totals where the transformation supports it.

## Preserve rollback

Application rollback is unsafe once a new version writes data an old version cannot understand. State the rollback boundary for every phase. Sometimes forward repair is safer than code rollback; operators should know that before an incident.

Remove old columns, indexes, triggers, and compatibility code only after all consumers and restore procedures have moved. A delayed cleanup is acceptable when it has an owner and date.

Schema evolution succeeds when no single deployment must be perfectly timed. Compatibility creates the room to observe, correct, and proceed safely.
