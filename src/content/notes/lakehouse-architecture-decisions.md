---
title: "Lakehouse architecture: the decisions that actually matter"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Data engineering
categories: [Data Engineering, Lakehouse, Architecture]
---

The lakehouse pitch is seductive: one storage layer — cheap object storage — with warehouse-grade reliability and query performance on top. ACID transactions, schema enforcement, time travel, all on Parquet files in a bucket you control. The pitch is mostly true now. But the format decision (Delta, Iceberg, Hudi) that dominates every evaluation is maybe the fourth most important decision. The ones that actually determine whether the lakehouse works are about table layout, governance, the serving layer, and who owns what. Get those wrong and you have an expensive data swamp with ACID transactions.

## What the lakehouse actually buys you

**Decoupled storage and compute, with transactions.** Object storage holds the data; any engine reads it; the table format adds atomic commits, snapshot isolation, and schema evolution on top of immutable files. You stop paying a warehouse vendor's storage markup, you stop being locked to one engine, and concurrent writers stop corrupting each other's output. That is the whole value proposition, and it is real.

**What it does not buy you:** governance, data quality, sane table design, or a serving story. The lakehouse gives you a transactional file format. Everything above the files — who can write, what "correct" means, how analysts actually query — is still your architecture to build. Teams that buy the format and skip the architecture end up with a well-transactioned mess.

## The format decision, honestly assessed

Delta Lake, Apache Iceberg, Apache Hudi: all three give you ACID on object storage, time travel, schema evolution, and partition evolution. The differences that matter in practice:

**Iceberg's momentum is the story.** The broadest engine support (Spark, Trino, Flink, Snowflake, BigQuery, Athena — engines teams actually run), partition evolution without rewriting data, and hidden partitioning that stops users from having to know the physical layout. The ecosystem bet most teams are making, and the safest default for a new build.

**Delta Lake's strength is its ecosystem gravity.** If the organization's compute is already Spark-centric — Databricks or open-source Spark — Delta is the path of least resistance, with mature streaming (Delta's change data feed, Auto Loader patterns) and deep tooling. Outside that gravity well, its engine support is narrower than Iceberg's.

**Hudi's niche is upserts at streaming scale.** Fine-grained record-level updates, efficient incremental pulls, strong streaming primitives. If the workload is high-volume CDC ingestion with heavy update traffic, Hudi deserves evaluation. For most analytical workloads, its complexity premium isn't justified.

**Rule of thumb:** default to Iceberg for engine neutrality; choose Delta when the compute estate is already Spark/Databricks; evaluate Hudi only for update-heavy streaming ingestion. And whatever you choose — the format is a 10-year decision. Migrating table formats later means rewriting every table, so pick the one whose ecosystem trajectory you believe in, not the one with the best benchmark on a slide.

**Don't build on the format's bleeding edge.** Features like deletion vectors, liquid clustering, and variant types are genuinely useful — and genuinely new. Let them bake for a year in someone else's production before they carry your financial reporting. The stable core (ACID commits, snapshots, schema evolution) is where the value is; the new features are where the bugs are.

## Table layout: the decision that determines performance

**Partitioning is physical design, and it still matters.** The lakehouse didn't abolish partition pruning — it just made bad partitioning survivable. The rules haven't changed: partition by what queries filter on (date, region), keep partition counts in the thousands not millions, and size files for the engine reading them (hundreds of MB for scan-heavy analytics, smaller for point lookups).

**Hidden partitioning (Iceberg) changes the contract.** Users write `WHERE event_date = '2026-09-30'` and the engine maps it to the physical partition — no more `dt=2026-09-30` directory conventions leaking into every query. This decouples the logical schema from the physical layout, which means you can evolve partitioning later without rewriting queries. It is one of Iceberg's genuinely structural advantages: partition evolution becomes a metadata operation instead of a migration project.

**The small-files problem is the lakehouse's chronic illness.** Streaming ingestion writes thousands of tiny files; every query pays the per-file overhead in listing, opening, and planning. Compaction is not optional maintenance — it is part of the architecture. Decide up front: scheduled compaction jobs (simple, predictable), auto-compaction in the writer, or format-native optimization. Monitor file counts and average file size per table as first-class metrics, with alerts. A table with a million 2KB files is a query-performance incident that built up over months.

**Clustering and sort order are the second-order lever.** For tables with selective filters on non-partition columns, Z-ordering or sort keys turn full scans into prunes. Apply it to the large fact tables where query patterns are known — not everywhere, because clustering has a write-time cost and a maintenance burden. Measure before and after; clustering that nobody measured is superstition.

Verdict: table layout is a design activity with ongoing maintenance, not a one-time config. Budget compaction and layout tuning as permanent operational work, like index maintenance in a warehouse.

## The medallion pattern: useful scaffold, dangerous dogma

Bronze (raw), Silver (cleaned), Gold (business-ready) — the medallion architecture gives every lakehouse a starting shape. As a scaffold it is excellent: raw ingestion lands in Bronze with full fidelity, Silver applies cleaning and conforming, Gold serves curated marts.

**Where it becomes dogma:** teams that force every dataset through all three layers whether it needs it or not. A reference table that arrives clean doesn't need a Silver pass; a Gold table nobody queries is write amplification. The layers are a naming convention for data maturity, not a mandatory pipeline topology.

**The real question medallion answers is: where does raw land, and is it immutable?** Bronze-as-immutable-raw is the decision that matters: every downstream layer can be rebuilt from Bronze, and every data-quality argument can be settled by looking at what actually arrived. If Bronze is mutable or lossy, the whole rebuild story collapses. Make Bronze append-only with retention measured in years, and the rest of the pattern can flex.

## Governance: the layer the format doesn't provide

**The catalog is the lakehouse's control plane.** Which catalog — and who can write to it — determines your governance posture more than the format does. Options range from managed (Glue, Databricks Unity Catalog) to open (REST catalogs, Nessie for Git-like branching). The catalog decision is a governance decision: it is where access control, table discovery, and lineage attach.

**Access control must be column- and row-aware.** Table-level grants are insufficient the moment PII shares a table with non-PII — which is every table. Decide whether enforcement lives in the catalog/engine (Unity Catalog-style, engine-enforced) or in views and table design (PII split into separate tables or columns masked at write). Engine-enforced is more flexible; table-design is more portable across engines. Pick one deliberately — the common failure is assuming the warehouse's grants carry over to the lakehouse's other engines, and discovering the gap during an audit.

**Lineage and data contracts attach here.** Which pipeline wrote this table, what its schema contract is, who owns it — the catalog is where this metadata lives or it lives nowhere. A lakehouse without enforced ownership metadata becomes a swamp with perfect ACID properties: every table transactional, nobody responsible.

**Retention and deletion are architectural, not legal-afterthought.** GDPR/CCPA deletion requests against immutable Parquet files are a design problem: partition-level deletes, DDM (dynamic data masking) as a stopgap, or per-subject partitioning for the tables that need hard deletion. Decide the deletion mechanism per data domain before the first request arrives — retrofitting deletion into a lakehouse designed without it is a rewrite.

## The serving layer: the lakehouse is not a serving database

**Analytical queries and serving queries are different workloads.** The lakehouse is excellent at the former: full-table scans, aggregations, exploratory SQL. It is bad at the latter: millisecond point lookups, high-concurrency dashboards, feature serving for ML. Every lakehouse architecture needs a serving story, and "query the lake directly" is not one for latency-sensitive consumers.

**The standard pattern: lake as system of record, specialized stores for serving.** Aggregate in the lake, serve from the right store: a key-value store for point lookups, a search index for text, a feature store for ML, a caching layer for dashboards. The lakehouse replaces the warehouse's storage, not the serving tier's databases. Teams that skip this end up with analysts running 200-concurrent-user dashboards against object storage and wondering why everything is slow.

**Freshness tiers, stated explicitly.** Not everything needs the same latency: the fraud model needs minutes, the executive dashboard needs hours, the regulatory report needs days. Define freshness SLAs per consumer and design the pipeline tiers to match — streaming ingestion for the hot path, batch for the rest. One pipeline trying to serve all freshness tiers serves none of them well.

## Ingestion: the unglamorous foundation

**Batch ingestion is still most ingestion.** Files landing in object storage on a schedule, loaded into Bronze — S3-to-table pipelines are the bulk of real lakehouses. Make them idempotent (re-runnable without duplication), partition-aware (land in the right partition, don't scan to find it), and validated at the boundary (schema checks on arrival, quarantine the bad files, alert — don't silently drop).

**Streaming ingestion needs the small-files answer on day one.** Kafka-to-lake pipelines (whether via Flink, Spark Structured Streaming, or managed connectors) must include compaction in the design, not as a later optimization. Decide the file-sizing strategy — target file size, time-based or size-based rolling — before the first topic is connected.

**CDC ingestion is the hardest ingestion.** Database change streams into the lake bring ordering, schema evolution, and delete handling — the full CDC problem set. Treat CDC-to-lake as its own project with its own design review, not as "just another source."

## Cost: the reason you chose the lakehouse

**Storage is cheap; compute and API calls are not.** Object storage at cents per GB-month is the headline, but the real cost drivers are compute (who's running the queries, and are the clusters right-sized) and request costs (LIST/GET on millions of small files adds up — another reason compaction is financial, not just performance). The small-files problem is a cost problem too.

**Chargeback changes behavior.** The lakehouse makes it easy to give every team their own tables and pipelines — and hard to see the bill. Tag resources by team and pipeline, publish the costs, and watch table sprawl collapse under its own economics. The teams that treat the lake as free infinite storage build the swamp; the ones that see the bill build the architecture.

**Compaction, clustering, and retention are cost controls.** Every uncompacted table, every retained-forever Bronze partition nobody will ever rebuild from, every unclustered full scan is money. The FinOps review of the lakehouse should look at file counts, scan volumes, and retention policies — not just the storage bill.

## Migration: warehouse to lakehouse without a flag day

**Don't migrate; strangle.** Run the lakehouse alongside the warehouse, migrate workloads one by one starting with the cheapest to move (new workloads first, then batch ETL, then the hairy stuff last), and keep the warehouse until its remaining workloads justify its cost. A flag-day migration of a production warehouse is how careers end.

**The BI layer is the long pole.** Dashboards, dbt models, and analyst queries are coupled to the warehouse's SQL dialect and performance characteristics. Budget the semantic-layer migration — metric definitions, dashboard rewiring, analyst retraining — as the bulk of the work. The table migration is the easy part; the human migration is the project.

**Dual-write or dual-read during transition.** Either write to both and compare, or read from the new with fallback to the old. Either way, reconciliation queries that diff old vs new outputs are the migration's safety net — build them before cutover, run them for weeks after.

## Decision framework

1. **Format:** Iceberg by default for engine neutrality; Delta inside Spark/Databricks gravity; Hudi for update-heavy streaming. A 10-year decision — choose the trajectory.
2. **Catalog:** the governance control plane. Decide access-control granularity (column/row) and enforcement point before the first PII table lands.
3. **Bronze immutability:** append-only raw with multi-year retention. Everything rebuilds from here.
4. **Table layout:** partition by query filters, hidden partitioning where available, compaction as permanent operations, clustering measured not assumed.
5. **Serving:** the lake is the system of record, not the serving tier. Name the serving stores per consumer.
6. **Freshness tiers:** per-consumer SLAs, pipeline tiers to match.
7. **Cost:** tag everything, publish bills, treat compaction and retention as cost controls.

## Closing

The lakehouse delivers on its core promise — transactional, engine-neutral analytics on cheap storage — and the format wars are mostly settled enough to decide and move on. What separates the lakehouses that work from the expensive swamps is everything around the format: immutable Bronze, deliberate table layout with compaction as operations, a catalog that actually governs, a serving tier that isn't the lake, and cost visibility that keeps the sprawl honest. The format is the foundation. The architecture is the building.
