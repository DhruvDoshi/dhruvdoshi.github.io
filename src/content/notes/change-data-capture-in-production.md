---
title: "Change data capture in production: log-based vs the alternatives"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Data engineering
categories: [Data Engineering, CDC, Architecture]
---

Almost every data platform eventually needs to get rows out of a production database without breaking it. The analytical store needs fresh data, the search index needs updates, the cache needs invalidation, the warehouse needs a feed that doesn't arrive at 2 AM as a giant batch. Change data capture is how you do this continuously — but "CDC" covers at least four fundamentally different mechanisms, and choosing wrong costs you months. The decision is really about what you are allowed to touch on the source database, how much latency you can tolerate, and what kind of operational pain you are willing to own.

## What CDC is actually for

CDC captures row-level changes — inserts, updates, deletes — from a source system and delivers them to downstream consumers as an event stream. The key distinction from polling or batch exports: CDC gives you the change itself, in order, with enough fidelity to reconstruct state downstream. You get before/after row images, the operation type, and a commit ordering you can trust.

**The use cases cluster.** Cache and search invalidation: keep an Elasticsearch index or a Redis cache in sync with the source of truth without application code that must remember to update both (it never does reliably). Operational analytics: feed a warehouse with fifteen-minute freshness instead of nightly dumps. Microservice data fan-out: one service owns the write, others maintain read models — the transactional outbox pattern is CDC scoped to one service. Cross-region replication of derived data, audit logging, and ML feature freshness round out the common list.

**CDC is not replication.** Replication keeps an identical copy of the database for failover; CDC is selective and transformative — different consumers take different tables, reshape rows, and join with other streams. Teams that treat a CDC pipeline like replication build a system where a schema change in one table breaks everything downstream. CDC is a data-integration mechanism with consumers who have independent opinions about the data.

## The four approaches

### 1. Query-based: timestamps and triggers

The oldest approach. Either poll for rows where `updated_at` changed since the last poll, or put triggers on the tables that write changes to a side table you then poll.

**It is simple and it is a trap.** Query-based CDC needs nothing special on the database and no new infrastructure — a cron job and a timestamp column. That is its entire appeal. The costs are everywhere else: polling frequency sets your latency floor, and frequent polling on busy tables degrades the production database you were trying not to break. `updated_at` must be maintained by every write path — miss one (a backfill script, a hotfix console session) and rows silently vanish from the feed. Deletes are invisible unless you do soft deletes everywhere. There is no ordering guarantee across rows, no before-image, and the initial snapshot races with live changes: rows modified during the snapshot get captured twice or never, depending on timing.

**Triggers are worse than polling in disguise.** They capture deletes and don't need `updated_at` discipline, but they run inside your production transactions — a bug in trigger logic slows or fails the business write path. Schema changes require trigger redeploys, and the change-capture table grows into a cleanup problem. Triggers couple the capture mechanism to every write on the table, which is exactly the coupling CDC is supposed to avoid.

Verdict: query-based CDC is a prototype mechanism. It has a place for low-volume tables where an hour of latency is fine and nobody's availability depends on it. If it becomes load-bearing, migrate off it before the first incident teaches you why.

### 2. Log-based: read the write-ahead log

Log-based CDC reads the database's own write-ahead log (WAL) — Postgres's logical replication slots, MySQL's binlog — and turns committed row changes into events. This is the approach that dominates production CDC, for structural reasons.

**The log is the only source of truth about what committed, in what order.** Application writes, backfill scripts, console hotfixes, migration tools — everything that commits lands in the WAL identically. No `updated_at` discipline, no missed write paths. Deletes appear naturally. You get the committed order for free, including the transaction boundaries that let consumers apply changes atomically.

**It does not touch the write path.** Logical decoding reads the WAL after the fact; the production transaction is already committed. The failure modes of CDC do not become failure modes of the business write path. This decoupling is the whole point — compare with triggers, where capture shares the transaction.

**The price is operational.** Logical replication slots are the sharpest edge: a slot pins WAL on the primary until the consumer acknowledges it. If your CDC connector stops consuming — connector crash, network partition, a deploy gone wrong — WAL accumulates on disk until the primary fills its disk and stops accepting writes. This is the canonical CDC outage, and I have seen it more than once: the data pipeline takes down the production database. Mitigations are mandatory, not optional: alert on replication-slot lag in bytes, set WAL retention with a bounded disk budget (Postgres 13+ `max_slot_wal_keep_size`), and treat slot lag as a P1 metric, not a data-team curiosity.

**Schema changes need a story.** Logical decoding emits row data according to the current table definition; an `ALTER TABLE` mid-stream changes the shape of events. Debezium — the industry-standard log-based capture engine, which most teams deploy even if they haven't evaluated it directly — handles this with schema history topics and emits schema-change events, but consumers still need to cope with mixed-shape data during rollouts. The common failure: expanding a column or adding a non-null column without a default breaks consumers that deserialize strictly. Column additions should always ship with defaults; renames are effectively two changes (add + drop) and need a migration window, not a flag day.

**Snapshots are part of the design, not an afterthought.** Every consumer eventually needs the full current state plus the live stream — a new read model, a rebuilt index, recovery after a long outage. Log-based capture needs an initial consistent snapshot and then a stream positioned after it. The naive version (dump the table, start the stream, hope nothing raced) loses or duplicates rows. The correct versions use a consistent snapshot point — Postgres `pg_export_snapshot()` or Debezium's locking-free incremental snapshots — and the connector coordinates the handoff. Test the snapshot path before you need it; it is the path most teams exercise for the first time during an incident.

Verdict: log-based is the default choice for any production database that supports it. The WAL is authoritative, the write path is untouched, and the operational cost is a known quantity: monitor slot lag, bound retention, and design the snapshot path deliberately.

### 3. The transactional outbox

The outbox pattern is log-based CDC scoped to one service: the application writes business rows and outbox rows in the same local transaction, and a relay publishes outbox rows to the broker. It solves the dual-write problem — update the database and publish an event atomically — which is the microservices flavor of CDC.

**Use the outbox when the event is a business fact, not a row change.** CDC on the raw table emits every column update; the outbox emits a deliberate `OrderShipped` event the service designed. This is a meaningful difference: downstream consumers of outbox events are insulated from the table's internal churn. The outbox is how a service publishes its public contract reliably; table-level CDC is how you mirror state.

**The relay is a small CDC problem you now own.** The outbox table must be relayed to the broker — by polling, by a CDC connector reading the outbox table (log-based CDC eating its own dogfood), or by database-native mechanisms like Postgres's `LISTEN`/`NOTIFY` (fine at low volume, a well-known scaling trap). The relay needs exactly the outbox's own reliability: at-least-once delivery with idempotent consumers, ordered per aggregate key, and a dead-letter path for poison messages.

**Outbox tables need lifecycle management.** Published rows must be deleted or archived, or the outbox becomes the fastest-growing table in the database. The deletion itself must be careful — delete only after the broker acknowledged, and make the cleanup idempotent so a crash mid-cleanup doesn't lose events.

Verdict: the outbox is the right answer when a service owns the write and must publish reliably. It is not a substitute for table-level CDC when you need arbitrary downstream mirrors — use both, for different consumers.

### 4. Storage-level and vendor mechanisms

Some databases expose change feeds natively: Cosmos DB's change feed, DynamoDB Streams, Spanner's change streams, Bigtable's change streams. These are log-based in spirit with the operational burden shifted to the vendor.

**Use them when you're already committed to the database.** They are the path of least resistance inside their ecosystems — no slot to manage, no connector to run. The trade-offs are lock-in (the feed's semantics, ordering guarantees, and retention are the vendor's design, not yours) and retention limits measured in hours, not days: a downstream outage longer than the retention window means a full rebuild, not a catch-up.

**Don't build a CDC layer over a database that already has one.** Teams on DynamoDB sometimes deploy their own polling because "we'll need to move off DynamoDB someday." The someday-migration tax is real and permanent; the migration itself is hypothetical. Take the native feed.

## Comparing the approaches

| Dimension | Query-based | Log-based | Outbox | Vendor change feed |
|---|---|---|---|---|
| Latency | Poll interval (minutes) | Seconds | Seconds | Seconds |
| Write-path impact | Poll load; triggers share the txn | None (reads WAL) | One extra table write in txn | None |
| Captures all write paths | No (needs `updated_at` discipline) | Yes | Only service-mediated writes | Yes |
| Deletes | No (unless soft-delete) | Yes | Designed per event | Yes |
| Ordering | None | Commit order | Per aggregate key | Vendor-defined |
| Operational risk | DB load from polling | Slot lag can fill primary disk | Relay + cleanup ownership | Retention window (hours) |
| Schema changes | Manual | Needs a story | Service-controlled | Vendor-handled |

**The selection rule:** if the database supports log-based capture and you need row-level fidelity — use log-based. If the event is a designed business fact owned by a service — use the outbox. If the database has a native feed and you're staying on it — use the feed. Query-based is for prototypes and low-stakes tables.

## Running Debezium (or any log-based connector) in production

Most teams end up running Debezium on Kafka Connect whether or not they evaluated alternatives, because it is the mature log-based engine with connectors for the databases that matter. The deployment details decide whether it is boring or terrifying.

**Kafka Connect as the runtime.** Run Connect in distributed mode with at least three workers — a single worker is a single point of failure for every pipeline. Connector configs, offsets, and status live in Kafka topics, so a worker restart resumes where it left off. Give Connect its own Kafka cluster or at least its own topic namespace; mixing CDC topics with application traffic makes capacity reasoning miserable.

**Offset and schema topics are infrastructure.** Debezium stores offsets in a Kafka topic and database schema history in another. Lose the schema history topic and the connector cannot decode WAL after a restart — it has to re-snapshot. These topics need replication, retention configured deliberately (schema history effectively forever), and monitoring like any other critical state.

**Tombstones and deletes need a downstream contract.** A delete in the source becomes a tombstone event (key with null value) in Kafka. Log compaction on the CDC topic then removes the key — but only if consumers and topic config agree on the semantics. Decide up front: do consumers apply hard deletes, soft deletes, or ignore them? The wrong default here corrupts read models silently.

**Exactly-once is a consumer-side property.** Debezium delivers at-least-once across restarts; duplicates are normal. Consumers must be idempotent — keyed upserts into the target keyed by the source primary key are the standard pattern. Anyone promising exactly-once end-to-end without idempotent consumers is selling something.

## The consumer side: what teams get wrong

**Schema registry from day one.** CDC events need a schema contract between the connector and consumers — Avro or Protobuf with a registry, compatibility checks on evolution. JSON without a schema works until the first column rename, at which point every consumer breaks in a different way and nobody can say what the event shape was last Tuesday.

**Backfill and replay are normal operations.** Consumers must handle "here is the full table again" without manual intervention — a new consumer bootstrapping, a corrupted read model, a retention-window overrun. If your consumer cannot rebuild from a snapshot plus the stream, it will be rebuilt by hand during an incident.

**Monitor the pipeline as a pipeline.** Lag per connector, per table, per consumer; event throughput; error and dead-letter rates; schema-compatibility violations. The metric that matters most is end-to-end lag from commit to consumer-visible — everything else is diagnostic.

## Decision framework

1. **Can you touch the source database's replication config?** If yes and you need row fidelity: log-based. If no (managed DB without logical replication, or a database someone else owns): query-based with eyes open, or a vendor feed if one exists.
2. **Is the change a business event or a row mirror?** Business event owned by a service: outbox. Row mirror for analytics/search/cache: log-based table capture.
3. **Who owns the operational burden?** Log-based on your own Postgres means you own slots, snapshots, and connector uptime. On a managed service with native feeds, the vendor owns most of it — at the cost of lock-in and short retention.
4. **How will you do the first snapshot?** If you cannot answer this before going live, you are not ready.

## Closing

Log-based CDC wins the default because the WAL is the one artifact that records exactly what committed, in order, from every write path — and reading it doesn't touch the write path. The outbox wins when the event is a designed business fact rather than a row mirror. Everything else is a special case or a prototype. Whatever you choose, the operational contract is the same: bounded lag with alerts, a tested snapshot path, idempotent consumers, and a schema registry from day one. The capture mechanism is the easy part; the pipeline around it is the product.
