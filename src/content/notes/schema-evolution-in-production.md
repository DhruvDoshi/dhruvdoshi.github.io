---
title: Plan schema evolution as a production migration
author: Dhruv Doshi
date: 2025-02-01
reviewed: 2026-07-28
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

## Analyse reads and writes separately

List every application version, worker, export, replica, report, and recovery tool that reads or writes the structure. A writer adding a new enum value can break an older reader even when the column itself is unchanged. A rollback may restore old code that cannot parse data already written by the new release.

Use feature flags to separate deployment from behavior change. Deploy compatibility code first, observe that all instances can read both forms, then enable new writes gradually. Keep the flag and old read path until rollback risk has passed.

## Plan large-table operations

Estimate row count, table size, write rate, index build time, log generation, replica capacity, and free storage. Prefer online or concurrent operations supported by the engine, but understand their remaining locks and failure behavior. Set conservative statement and lock timeouts so a migration fails rather than blocking production traffic indefinitely.

For backfills, choose batch size from production measurements. Pause on elevated latency or replica lag. Record a durable high-water mark and make each batch safe to repeat. Validate continuously instead of waiting until the final row.

## Handle removal as a release

Before dropping old structure, prove that no supported code reads or writes it. Search application source, queries, dashboards, ETL, audit tools, and restore scripts. Disable access or add monitoring before deletion to reveal hidden consumers. Take a recoverable backup appropriate to the data and test restoration of the affected object.

## Migration checklist

Document compatibility matrix, lock behavior, capacity estimate, staged rollout, backfill controls, validation queries, rollback boundary, monitoring, owner, and cleanup date. Run the sequence in an environment with representative data volume; functional test fixtures alone cannot expose production migration risk.
