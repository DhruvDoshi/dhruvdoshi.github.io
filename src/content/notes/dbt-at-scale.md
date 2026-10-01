---
title: "dbt at scale"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Data engineering
categories: [Data Engineering, Analytics, Data Quality]
---

dbt projects do not fail at 50 models. They fail at 300, when the DAG no longer fits on a screen, a single `ref` chain takes forty minutes to rebuild, and nobody remembers whether `stg_orders` is safe to touch or load-bearing infrastructure that twelve marts silently depend on. The collapse is not technical. It is organizational: the project kept the habits of a small analytics team while the dependency graph, the user base, and the blast radius of every change grew up around it.

Scale changes what dbt is for. Below a hundred models, dbt is a nicer way to write SQL with version control. Above a few hundred, dbt is a production build system for data, and it demands the discipline of one: layering contracts, hermetic builds, meaningful tests, CI that actually gates merges, and a runtime strategy that does not rebuild the world on every commit. This note is about that transition.

## The real problem: DAG sprawl

A dbt DAG grows in two dimensions. Breadth: more source tables, more marts, more teams contributing. Depth: longer `ref` chains, because every new mart prefers to build on an existing model rather than go back to staging. Both are natural. Both become liabilities without deliberate structure.

The symptoms are predictable. Runtime grows roughly with the total number of models times their average build cost, so a full nightly `dbt build` that took twenty minutes at 80 models takes two hours at 400, and suddenly the warehouse is still churning when the morning analysts arrive. The critical path gets longer because chains deepen: a change to a staging model fans out to dozens of downstream models, and you discover this by watching a CI run rebuild everything. Ownership dissolves because anyone can add a model anywhere; the directory structure says `models/marts/finance/`, but the SQL inside reads from `marketing` staging models with no agreement. And refactors become terrifying, because there is no way to answer the question "who consumes this column" without grepping through a hundred files.

None of this is a dbt limitation. It is what happens when a build system is used without build-system hygiene. The fix is not a bigger warehouse. It is treating the DAG as a designed artifact with interfaces between its parts.

## Layering discipline: the contract that keeps DAGs honest

The single highest-leverage decision in a large dbt project is enforcing a layered DAG with explicit contracts about which layer may reference which. The conventional shape is well known:

```
                    ┌──────────────────────┐
                    │        MARTS         │  one model per business entity
                    │  (facts + dims)      │  owned by domain teams
                    └─────────┬────────────┘
                              │ ref
                    ┌─────────┴────────────┐
                    │     INTERMEDIATE     │  joins, cleans, business logic
                    │  (one domain only)   │  never referenced across domains
                    └─────────┬────────────┘
                              │ ref
                    ┌─────────┴────────────┐
                    │       STAGING        │  1:1 with sources, light touch
                    │  (thin, typed)       │  no joins, no business logic
                    └─────────┬────────────┘
                              │ source()
                    ┌─────────┴────────────┐
                    │       SOURCES        │  raw tables as landed
                    └──────────────────────┘
```

The rules that make this work are stricter than most teams start with, and the strictness is the point:

- **Staging models are 1:1 with sources.** One staging model per source table. Rename columns, cast types, handle timezone normalization. No joins, no filtering beyond obvious garbage, no business logic. If two source tables are joined, that join is business logic and belongs in intermediate.
- **Intermediate models live inside one domain and are private to it.** The `marts/finance` directory may only `ref` staging models and `models/intermediate/finance/*`. It may never `ref` an intermediate model from another domain. Cross-domain reads happen only through marts or through a shared/exposure layer with an explicit owner. This is what stops the DAG from becoming a hairball: every cross-domain dependency is a deliberate, reviewable contract.
- **Marts are the public interface.** A mart model is the only thing BI tools, reverse-ETL, and other teams' dbt projects may read. Intermediate and staging models are implementation details. This gives you the freedom to refactor internals as long as mart contracts hold.

Where this breaks down in practice: teams put "a quick join" in staging because it is convenient, then a second team builds on that staging model, and the business logic is now load-bearing and untested. The remedy is social, not technical: PR reviewers reject cross-layer violations the way they would reject a circular import. If your project is big enough that manual review cannot hold the line, enforce it mechanically — dbt's `model.config` with access levels (`private`, `protected`, `public`) exists precisely for this, and CI checks can fail a build that references a `private` model from outside its group.

One more layering decision matters at scale: **when to split the project.** A single dbt project with 600 models and six teams is a monorepo with all the coordination costs that implies. The alternative is multiple dbt projects, one per domain, with cross-project dependencies resolved through a registry of published artifacts or through reading another project's marts as sources. The trade-off is real: one project gives you a single `dbt build`, global lineage, and one CI pipeline; multiple projects give you independent deploys, separate permissions, and no queue behind another team's broken model. My rule of thumb: split when teams start needing to deploy on different cadences or when a single team's bad merge routinely blocks everyone else's. Before that point, one project with strict layering and group ownership is simpler.

## Stateful vs stateless runs: stop rebuilding the world

A stateless run — `dbt build` with no prior state — rebuilds everything its selectors touch. At 400 models, this is how you get a two-hour nightly job and a CI pipeline that developers stop waiting for. A stateful run compares the current project against a previous successful state (the `manifest.json` from the last production run) and builds only what changed or what depends on what changed.

dbt's state selection (`--select state:modified+`, `--select state:modified`) is the mechanism, but the workflow around it is what matters:

1. After every successful production run, persist the artifacts (`manifest.json`, `run_results.json`) somewhere durable — an S3 bucket or GCS path versioned by run.
2. In CI, download the latest production artifacts and run `dbt build --select state:modified+ --defer --state ./artifacts`. The `+` includes downstream dependents; `--defer` lets CI reference production versions of unmodified upstream models instead of building them, which keeps CI fast and means tests run against realistic data.
3. On merge, the production job runs `dbt build --select state:modified+` against the real warehouse, and the artifacts get refreshed.

The trade-off with `--defer` deserves honesty. Deferred runs in CI do not rebuild upstream models, which means a CI run can pass while the full production chain would fail — for example, if a staging model change alters a column type that a deferred upstream mart assumed. Mitigate this with a periodic full-refresh run (weekly, off-peak) that builds everything statelessly and catches exactly these drift failures. The weekly full build is your consistency backstop; the stateful runs are your speed. Do not skip the backstop.

There is a second statefulness decision: **incremental models.** `materialized='incremental'` is how large fact tables stay affordable, and dbt's incremental strategies (merge, delete+insert, microbatch) each carry trade-offs. Merge is the safest for late-arriving data but the most expensive. Delete+insert is cheaper and correct when your grain and lookback window are well defined. Microbatch (event-time batching) is the most efficient for append-heavy event data but punishes you if your event-time column is unreliable. Choose the strategy from the data's arrival characteristics, not from habit — and always test incremental logic with the `is_incremental()` branch exercised, because untested incremental branches are where silent data loss hides.

## Tests as contracts, not decoration

In a small project, dbt tests catch typos. At scale, they are the only thing standing between a refactor and a broken board deck. The shift is from "tests that document" to "tests as contracts": each mart model carries a set of guarantees that downstream consumers can rely on, and CI refuses to merge anything that violates them.

The test portfolio that actually earns its keep:

- **Uniqueness and not-null on every primary key, on every mart.** This is non-negotiable. A duplicated primary key in a fact table silently double-counts revenue in every downstream aggregation, and it is the most common catastrophic failure mode I see in analytics.
- **Accepted values on every status/enum column.** Source systems add new enum values without telling anyone. `accepted_values` on an order-status column is how you find out in CI instead of in a quarterly review.
- **Relationships (foreign keys) at the mart boundary.** Not everywhere — full referential integrity testing on every intermediate model is expensive and slow — but at the mart layer, where one team's output becomes another team's input.
- **Custom data tests for business invariants.** The generic tests catch structural problems; the business invariants catch semantic ones. "No order may have a negative total." "Every active subscription has exactly one current plan row." These are the tests that encode what the business believes to be true, and they belong next to the model they guard.
- **Unit tests for transformation logic.** dbt's unit testing lets you feed mocked inputs to a model and assert outputs. Use it for the gnarly logic — the revenue recognition rules, the attribution model, the sessionization. Do not unit-test trivial selects; the maintenance cost exceeds the value.

The anti-pattern is test maximalism: hundreds of `not_null` tests on intermediate columns that nobody consumes, CI that takes longer than the build itself, and a team that starts ignoring failures because "those tests always fail." Every test has a maintenance cost. Budget it. A test suite where failures are rare and always meaningful beats a comprehensive suite that everyone has learned to ignore.

Severity discipline matters too. dbt tests can `warn` or `error`. Use `error` for contract violations that must block a merge (primary key uniqueness on marts, accepted values on financial enums). Use `warn` for early-warning signals that deserve attention but should not block a deploy (a volume check that occasionally trips on holidays). A warning that nobody triages is worse than no warning — it trains the team that the pipeline is noisy.

## CI for data: gating merges on something real

Application CI runs unit tests in seconds. Data CI cannot be that fast, but it can be that serious. A CI pipeline for a large dbt project should do four things:

1. **Build and test only what changed** (`state:modified+` with `--defer`), so developers get feedback in minutes, not hours.
2. **Run the full test suite against the changed models**, including the custom business-invariant tests. Structural tests alone are not enough.
3. **Check the things linters catch**: SQL style, naming conventions, that every model has a description and every column in a mart is documented, that no model references a private model outside its group.
4. **Produce a diff of the DAG** — which models changed, what downstream is affected — and post it on the PR. This turns code review from "looks fine to me" into an informed conversation about blast radius.

What CI should not do is run a full production-scale build on every PR. That is too slow and too expensive, and teams route around it. The stateful approach gives you fast, meaningful CI; the weekly full build gives you completeness. Also consider running CI against a production-like schema with sampled or cloned data (most warehouses support zero-copy clones) rather than a tiny fixture dataset — data bugs are data-dependent, and a test suite that only runs against ten hand-written rows catches the bugs you already thought of.

## The cost of refactors: make them boring

Refactoring a 400-model DAG is not a weekend project; it is a migration, and migrations need the same care as any production change. The practices that keep refactors survivable:

- **Deprecation, not deletion.** When renaming or restructuring a model, keep the old model as a thin view over the new one for a bounded period, announce the deprecation with a date, and track who still reads the old path. dbt's deprecation warnings in model configs exist for this. Deleting a model that three dashboards read is how you learn about downstream consumers the hard way.
- **Column-level lineage before column changes.** Before renaming or dropping a column in a mart, you need the full consumer list. dbt's manifest and the catalog give you model-level lineage; column-level lineage needs either a lineage tool or disciplined `exposures` definitions. If you do not know who reads a column, you cannot safely change it.
- **Backfill with intent.** Changing an incremental model's logic usually requires a `--full-refresh` of that model and everything downstream. Plan the backfill window, estimate the warehouse cost, and run it off-peak. A full refresh of a deep chain during business hours is a self-inflicted outage for every analyst downstream.
- **One refactor at a time.** Do not restructure the staging layer and change the grain of a fact table in the same release. Serializing refactors feels slow; interleaving them is how you get failures you cannot attribute.

## How to start, and what good looks like

If you are inheriting a dbt project that has already collapsed into a hairball, do not attempt a big-bang rewrite. Start with measurement and one enforceable boundary:

1. **Map the DAG and find the god models.** Render the lineage graph, sort models by number of downstream dependents, and look at the top ten. Those are your load-bearing walls. Document them, test their contracts first, and put them under the strictest review.
2. **Freeze the layering going forward.** Adopt the staging/intermediate/marts discipline for all new models and enforce it in PR review. Grandfather existing violations but forbid new ones; over a few months the clean portion grows.
3. **Stand up stateful CI.** Persist production artifacts, switch CI to `state:modified+` with `--defer`, and watch developer feedback time drop. This is usually the fastest win available.
4. **Write the business-invariant tests for your five most important marts.** Not fifty models — five. Get the team used to the idea that merging means proving the invariants still hold.
5. **Schedule the weekly full build.** Stateless, off-peak, with alerts on failure. This is your drift detector.

What good looks like at steady state: a developer can open a PR touching three models, get CI feedback in under fifteen minutes showing exactly which downstream models are affected and whether their contracts hold, and merge with confidence. The nightly production run finishes before analysts arrive because only changed models and their dependents rebuild. Refactors happen continuously in small, deprecated steps rather than in terrifying quarterly migrations. The DAG diagram is still large, but it is legible — layers are visible, cross-domain reads are deliberate, and every mart has an owner and a contract. That is dbt at scale: not a bigger project, but a project with the discipline of a production system.
