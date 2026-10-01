---
title: "Feature stores: when your ML platform needs one"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Machine learning
categories: [Machine Learning, MLOps, Data Engineering]
---

Every ML team eventually hits the same wall: the model that worked in the notebook fails in production, and the root cause is features. Training used one definition of "user's 30-day transaction count," serving uses another. The training pipeline computed features in batch last Tuesday; the serving path computes them live with different edge-case handling. The model isn't wrong — it's answering a different question than the one it was asked. A feature store exists to make this class of failure structurally impossible: one definition of each feature, computed once, served consistently to training and inference.

That is the pitch. The reality is that a feature store is significant platform machinery, and most teams adopt it either too early (paying the tax before they have the problem) or too late (after the skew incidents pile up). This note is about telling the difference.

## The problem, stated precisely: training-serving skew

**Skew is the silent model killer.** A model learns the relationship between features and labels as they existed in training. If serving computes any feature differently — different time window, different null handling, different join logic, stale data — the model's inputs shift and its predictions degrade. Not with an error. With quietly worse decisions: worse recommendations, worse fraud catches, worse pricing. Skew doesn't page you; it erodes.

**The three sources of skew.** Logic skew: two implementations of the same feature (notebook vs serving code) that diverge. Time skew: training features computed as-of the label timestamp, serving features computed as-of now — the classic leakage-in-reverse. Freshness skew: training on yesterday's batch features while serving needs this-minute values. A feature store addresses all three with one mechanism: the feature definition is code, versioned once, executed by the platform for both paths.

**Point-in-time correctness is the hard requirement.** For training, each row needs feature values as they were at the event time — not as they are now. Joining today's user attributes onto last month's events leaks the future into training and inflates offline metrics that collapse online. The feature store's offline store must support as-of joins: for each training example, the feature values effective at that timestamp. If your "feature store" can't do point-in-time joins, it's a key-value cache with marketing.

## What a feature store actually is

**Three components, not one.** A registry (feature definitions as versioned code — the transformation logic, the schema, the owner, the SLAs), an offline store (historical feature values in the lake/warehouse for training, supporting point-in-time joins), and an online store (low-latency key-value serving for inference, typically fed by streaming or batch materialization from the offline store). The registry is the contract; the two stores are the execution.

**The transformation layer is where the work lives.** Features are defined as transformations over raw data — SQL, DataFrames, or stream definitions — and the platform executes them on schedule (batch) or continuously (streaming). This is the part teams underestimate: writing the transformations is easy; operating them with monitoring, backfills, and SLA enforcement is the platform.

**Feature serving is a latency SLA.** The online store exists because inference can't wait for a warehouse query: p99 in the tens of milliseconds, high availability, multi-region if the serving is. This is a serving database with the same operational bar as any production datastore — replication, failover, capacity planning — except its contents are derived and rebuildable, which changes the disaster-recovery math favorably.

```
                    ┌─────────────────────┐
  raw data ────────▶│ feature definitions  │ (registry: versioned code)
  (lake/warehouse/  │ batch + streaming    │
   streams)         │ transformations      │
                    └────────┬────────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
   ┌─────────────────────┐       ┌─────────────────────┐
   │ offline store       │       │ online store        │
   │ (lake tables)       │──────▶│ (low-latency KV)    │
   │ point-in-time joins │materialization│ p99 ms serving    │
   │ for training        │       │ for inference       │
   └─────────────────────┘       └─────────────────────┘
```

## When you need one: the honest triggers

**Trigger 1: more than a handful of models in production.** One model, one team: the feature logic lives in the training pipeline and the serving code, and keeping two implementations in sync is manageable — barely. Five models sharing features across three teams: every feature change needs coordination across implementations, and skew incidents become routine. The feature store pays off when features are shared assets, not per-model code.

**Trigger 2: you need online inference with fresh features.** Batch-only ML (nightly scoring, churn models, LTV) can live on warehouse tables with disciplined pipelines — a feature store adds little. The moment inference needs features fresher than the batch cycle — fraud scoring on live transactions, recommendations on current session behavior — you need the online store, the streaming materialization, and the consistency machinery. That's a feature store-shaped problem.

**Trigger 3: regulatory or audit pressure on model inputs.** When someone — a regulator, an auditor, your own risk team — asks "exactly what inputs produced this decision, and can you reproduce it," you need versioned feature definitions, immutable historical values, and point-in-time reconstruction. A feature store gives you this structurally; ad-hoc pipelines give you a forensic project.

**Trigger 4: feature reuse across teams is actually happening.** Not "wouldn't it be nice" — happening. When the fraud team's velocity features would obviously help the credit team, but sharing means copy-pasting pipeline code with its bugs, the registry's discovery and reuse story earns its keep.

**The anti-triggers — when you don't need one.** Fewer than three production models. Batch-only scoring with daily freshness tolerance. A single team that owns training and serving end-to-end (they can keep two implementations honest with tests). An ML effort that's still finding product-market fit — the feature store is platform investment, and platform investment before product fit is premature optimization at the organizational level.

Verdict: the feature store is justified by shared features, online freshness requirements, or audit pressure — real, current, named instances of these, not anticipated ones. "We'll need it eventually" is how you get a platform nobody uses.

## Build vs buy vs assemble

**Managed feature stores** (the cloud vendors' offerings, Databricks' feature serving, Snowflake's ML feature layer) buy you integration with the stack you're already on and someone else's operational burden. The cost is the usual: less control over the serving path, pricing coupled to the vendor, and feature definitions expressed in the vendor's idioms.

**Open-source platforms** (Feast is the standard reference) give you the registry and the materialization machinery with your choice of offline store (your lake) and online store (your Redis/DynamoDB). You own the operations — the online store's availability, the batch jobs' reliability, the upgrades. Feast-shaped tooling is genuinely good at the core problem; the operational surface is what you're signing up for.

**Assembled from parts** — versioned transformation code in the lake, a scheduled materialization job to Redis, a thin serving API — is what most teams actually run before they admit they have a feature store. It's pragmatic and it works until the triggers above hit. The honest version of this path: name it as the proto-feature-store it is, keep the transformation definitions versioned and single-sourced, and migrate deliberately when the triggers fire rather than accumulating five incompatible variants.

**Rule of thumb:** assemble until two of the four triggers are true, then buy or adopt open-source rather than building the registry and serving machinery yourself. The transformation logic is your IP; the materialization and serving infrastructure is not where your leverage is.

## The design decisions inside

**Batch vs streaming features is a per-feature decision.** Not every feature needs streaming freshness. User lifetime aggregates: batch daily is fine. Transaction velocity in the last 10 minutes: streaming. The feature store should support both computation modes against the same definition — this is the "one definition, two executions" promise — but each feature's freshness SLA should be set deliberately, because streaming features cost an order of magnitude more to operate than batch ones.

**Online-offline consistency needs a mechanism, not a hope.** The online store is materialized from the offline computation; the two can diverge during backfills, failed materializations, or schema changes. Monitor the divergence: sample keys, compare online values against offline recomputation, alert on drift. The consistency check is the feature store's equivalent of a reconciliation job — unglamorous and load-bearing.

**Backfills are normal operations.** A bug in a transformation means recomputing history and rematerializing the online store — for every feature, potentially terabytes. The backfill path needs to be designed, tested, and fast enough to matter: partitioned recomputation, incremental materialization, and a serving cutover that doesn't flap. If backfills are manual heroics, the transformation testing wasn't good enough.

**Feature monitoring is model monitoring's prerequisite.** Track feature distributions, null rates, and freshness per feature — not just pipeline success. A pipeline that succeeds while emitting nulls for a key feature is worse than one that fails loudly. Distribution-shift detection on the top features catches the upstream data changes that silently degrade models: the upstream team renamed a field, the mobile app changed its event schema, the partner feed went stale.

**TTL and retention per feature.** Online store entries need TTLs derived from the feature's semantics — a session feature expires with the session; a user attribute persists. Offline history needs retention for point-in-time training — measured in the model's retraining horizon, not forever. Unbounded feature history is a cost problem wearing a completeness costume.

**Feature naming and namespacing prevent collisions.** As the registry grows, two teams will independently define `user_transaction_count_30d` with different windows. Enforce namespaced naming (`fraud.user_txn_count_30d`) and a uniqueness check at registration time. Renaming a widely-consumed feature later is a migration; getting the namespace right on day one is free.

**Deprecation needs a process, not just a flag.** Marking a feature deprecated in the registry means nothing if three models still consume it. Deprecation requires: announcing the replacement, a migration window with both versions materialized, consumption monitoring to confirm zero readers, and only then removal. Without the process, "deprecated" features live forever and the registry fills with tombstones nobody trusts.

**Access control on features.** Features encode business logic and sometimes PII-adjacent signals. Who can define, who can read, which features flow to which models — the registry needs ownership and access metadata, or the feature store becomes an ungoverned window into every data domain.

## The organizational shape

**A feature store needs a platform owner.** Not a committee, not "the ML teams collectively" — a named team or engineer responsible for the registry's health, the materialization SLAs, and the serving availability. Shared infrastructure without an owner degrades into everyone's problem and nobody's priority. This is the most common reason feature store initiatives stall: the technology works, the ownership doesn't.

**Feature definitions need review like code.** A bad transformation poisons every model that consumes the feature. Registry changes need the same review rigor as production code — tests on the transformation logic, validation of the output distribution, staged rollout for widely-consumed features. The blast radius of a feature definition is every downstream model; treat it accordingly.

**Discovery beats mandates.** Teams adopt the feature store when finding and reusing a feature is easier than rebuilding it. Invest in search, documentation, and examples — the registry's UX is the adoption strategy. Mandating usage before the UX earns it produces shadow pipelines and resentment.

## Evaluation: proving the features are worth it

**Offline evaluation needs the point-in-time guarantee.** Every model evaluation, every A/B test analysis, every regulatory reproduction depends on training data built from as-of feature values. Build the evaluation harness against the offline store's point-in-time API from the start — bolting it on later means re-deriving history you may not have retained.

**Feature importance is a maintenance signal.** Track which features actually drive model performance. Features that contribute nothing are operational cost without value — deprecate them. Features that dominate are single points of failure — harden their pipelines. The feature store should make this analysis easy; if it doesn't, teams keep zombie features forever.

**Shadow mode for feature changes.** New feature versions should serve in shadow — computed and logged but not used for decisions — until their behavior is understood. The feature store's versioning makes this natural: v2 materializes alongside v1, models consume v1, analysis compares. Skipping shadow mode for a widely-used feature is how you discover at 2 AM that the new definition has a null-handling bug.

## Closing

A feature store is the right answer when features are shared across models and teams, when inference needs freshness the batch cycle can't provide, or when someone with authority needs to reproduce exactly what the model saw. Until those triggers are real, disciplined pipelines on the warehouse — versioned transformation code, point-in-time joins done carefully, tests on the logic — get you most of the value at a fraction of the operational cost. The worst outcome is the middle: a feature store adopted on anticipation, underused, unowned, while the real feature logic lives in five notebooks nobody versioned. Match the machinery to the problem you actually have.
