---
title: "Data quality engineering"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Data engineering
categories: [Data Engineering, Data Quality, Testing]
---

Every data team has a story about the dashboard that was wrong for three weeks before anyone noticed. The numbers looked plausible — that is the insidious part. Nobody's pipeline failed, no alert fired, the tables updated on schedule. The data was just wrong: a source system changed a status code, an upstream team renamed a column and backfilled it with nulls, a timezone assumption shifted during daylight saving. The pipeline did exactly what it was told. It was told the wrong thing.

Data quality engineering is the discipline of making "the data is right" a property you can assert, measure, and defend — the way backend engineers treat correctness, not the way analysts treat a quarterly audit. It is not a tool purchase. It is a set of checks, ownership lines, SLAs, and incident habits that turn silent corruption into loud, actionable failure.

## The real problem: silent corruption

Pipeline failures are loud. A job crashes, a partition is missing, an alert fires, someone fixes it. Silent corruption is the opposite: the pipeline succeeds and the data is wrong. This happens far more often than pipeline failures, and it is far more expensive, because bad data compounds. Every downstream model, dashboard, and ML feature built on a corrupted table inherits the corruption, and the blast radius grows with every day it goes undetected.

Consider a service that emits order events into a warehouse. One day the mobile team ships a release where the `currency` field defaults to USD instead of the transaction currency. The pipeline keeps running. Revenue dashboards now overstate international revenue. The error is invisible at the row level — every row looks fine — and only visible in aggregate, where it looks like a great quarter. By the time finance reconciles, weeks of downstream tables need backfilling, and nobody can say with confidence which decisions were made on bad numbers.

The uncomfortable truth: most data teams detect quality problems through human eyeballs. An analyst notices a chart looks odd. A stakeholder asks why the numbers changed. This is detection by luck, and it scales terribly. Quality engineering replaces luck with instrumentation.

## The four check families

Every quality problem I have seen falls into one of four families. A serious quality program checks all four, because each family catches failures the others miss.

**Freshness: did the data arrive on time?** A table that usually lands by 6 AM and lands at 2 PM is a problem even if every row is perfect — downstream consumers built schedules and expectations around it. Freshness checks compare the latest partition or max event timestamp against an expectation, with a threshold. The threshold needs slack for normal variance (weekends, holidays, upstream delays) without so much slack that it never fires. Measure from the source's event time where possible, not from when your job ran; a job that runs on time but processes stale data is not fresh.

**Volume: did the expected amount arrive?** Row counts, bytes, event rates. Volume checks catch the partial loads that freshness checks miss — the job that succeeded but only ingested 10% of the data because an upstream API paginated differently. Compare against a rolling baseline (same hour last week, trailing 7-day median) rather than a fixed number, because real data has seasonality. Set the band wide enough to avoid alert fatigue and narrow enough to catch a halved feed.

**Schema: did the shape change?** New columns, dropped columns, type changes, nullability flips, renamed fields. Schema checks are the cheapest quality check to implement and among the highest value, because upstream schema changes are the most common cause of silent corruption. In a dbt project, schema tests and contract enforcement cover this; in streaming, a schema registry with compatibility rules covers it. The key decision is whether a schema change should block ingestion or just alert — blocking is safer for typed downstream consumers, alerting is safer when you cannot control the producer.

**Content: is the data itself sane?** This is the family that requires domain knowledge. Null rates on columns that should be populated. Distribution shifts — the average order value moved three standard deviations overnight. Referential integrity — every `user_id` in the events table exists in the users table. Business invariants — no negative prices, no future-dated transactions, refunds that reference real orders. Content checks are where quality engineering becomes genuinely engineering: you are encoding what "correct" means for your domain in executable form.

## Hard rules vs anomaly detection

Within content checks there is a fundamental fork: hard rules versus statistical anomaly detection. Both have a place, and confusing their roles is a common failure.

**Hard rules** assert known invariants: `price >= 0`, `status IN ('pending','paid','shipped','cancelled')`, `event_time <= now()`. They are deterministic, cheap, explainable, and they catch exactly the failure modes you anticipated. Their limitation is obvious: they cannot catch what you did not think of. A hard rule on price being non-negative will not notice that all prices suddenly became exactly zero — which satisfies the rule while being catastrophically wrong.

**Anomaly detection** watches for statistical deviations: the null rate on `email` jumped from 2% to 40%, the daily active user count dropped 30% versus the trailing baseline, the distribution of `country_code` shifted. It catches the failures you did not anticipate, which is most of them. Its limitations are cost and noise. Statistical models need tuning, baselines need maintenance, and every holiday, marketing campaign, and product launch looks like an anomaly to a naive detector. Anomaly detection that pages people will be muted within a month; anomaly detection that feeds a triage queue can be genuinely useful.

The practical synthesis: hard rules for the invariants you know, running as blocking checks in the pipeline; anomaly detection for everything else, running as non-blocking monitors that feed a dashboard and a triage rotation. Promote an anomaly to a hard rule once you understand it — "we now know that null rates above 15% on this column always mean a broken producer" — and retire anomaly monitors that have never found anything. The boundary between the two should move over time as you learn.

## SLAs for data: quality as a service commitment

If data is a product, it needs service-level objectives the way any service does. Data SLAs (or data SLOs, if you prefer the SRE vocabulary) make quality expectations explicit and, crucially, make violations visible to the people who can act.

A data SLA has the same anatomy as any SLA: a metric, a target, a measurement window, and a consequence. "95% of daily partitions for `orders` land by 7 AM local time, measured over a rolling 30 days; a miss triggers a page to the owning team." "Order totals reconcile with the payment provider's control totals within 0.1% daily; a breach opens an incident." The control-total pattern deserves emphasis: reconciling against an independent source of truth (the payment provider's numbers, the source system's own counts) is the strongest content check available, because it does not depend on the same pipeline being correct.

Two cautions. First, SLAs need owners and teeth, or they are theater. An SLA that is breached monthly with no consequence teaches everyone that SLAs are decorative. Second, do not SLA everything. Pick the datasets that drive decisions — the revenue tables, the tables feeding production ML models, the tables regulators care about — and leave the exploratory scratch tables alone. An SLA program covering five critical datasets beats a decorative program covering five hundred.

## Who owns quality

This is where most quality initiatives die. The pipeline team says quality is the producer's problem; the producer says they just emit events; the analysts say they just read tables; and the bad data sits in the middle, owned by everyone and fixed by no one.

The ownership model that works: **the producer owns the data's correctness, the platform owns the quality infrastructure, and the consumer owns validating their assumptions.** Concretely:

- The team that owns a source system or ingestion pipeline is accountable for schema stability, documented semantics, and notifying consumers of changes. This is the data-contracts idea: the producer's obligations are explicit.
- The data platform team provides the machinery — the check frameworks, the anomaly detection, the SLA dashboards, the incident tooling — and sets the standard for what "checked" means. They do not write every check; they make writing checks cheap.
- The team that owns a derived dataset owns the quality of that dataset's outputs, including validating its inputs. A mart owner cannot shrug and blame staging; if their mart depends on a staging table, they own checks on the properties they depend on.

In practice this means quality checks live as close to the data's owner as possible, and the platform team's job is leverage: templates, libraries, and CI integration that make the right thing the easy thing. A platform team that writes all the checks becomes a bottleneck and, worse, writes checks without domain knowledge — which is how you get a thousand generic null checks and zero business invariants.

## Incident response for bad data

Bad data is an incident, and it deserves an incident process — not the panicked Slack thread and the "can someone look at this" that most teams default to. The shape of a data incident differs from a service incident in ways that matter:

**Detection and triage.** The incident starts when a check fires or a human reports suspicious data. First question: is the data actually wrong, or is the check wrong? (Checks have false positives; verify before declaring.) Second question: what is the blast radius — which downstream tables, dashboards, and models consumed the bad data, and during which window? Lineage is not a nice-to-have here; it is the triage tool.

**Containment.** For a service incident, containment means stopping the bleeding — roll back, fail over. For a data incident, containment means stopping the spread: quarantine the bad partitions, mark affected tables so downstream consumers know not to trust them, and if the pipeline is still writing bad data, halt it. The instinct to "fix it fast and reprocess" before understanding the scope is how you overwrite the evidence you need for root cause.

**Communication.** Data incidents have a wider stakeholder surface than service incidents. The dashboard consumers, the finance team closing the quarter, the ML team whose features just shifted — they all need to know what is wrong, what is affected, and when it will be fixed. A status page or incident channel with regular updates beats a dozen side conversations. Be explicit about which data is trustworthy and which is not; "the numbers for Tuesday are under investigation" is more useful than silence.

**Remediation and backfill.** Once the root cause is fixed, the corrupted window needs reprocessing. Backfills are themselves risky operations — they rewrite history that people may have already acted on — so they need the same care as any production change: a plan, a window, verification that the backfilled data matches expectations, and communication to everyone downstream. Document what was backfilled and why; six months later, someone will ask why Tuesday's numbers changed.

**Postmortem.** Data postmortems should answer one question above all: why did detection take as long as it did? The root cause of the corruption matters, but the detection gap is the systemic failure. Every postmortem should produce at least one new check or SLA — the incident is tuition, and the check is what you bought with it.

## Anti-patterns: how quality programs fail

**The dashboard nobody watches.** A team builds an impressive quality dashboard with hundreds of checks and green lights. Nobody looks at it except during demos. Checks without routing — without an owner, an alert path, and a response expectation — are documentation, not engineering. If a check fires and nobody is paged or ticketed, delete the check.

**Alerting on everything.** The team wires every check to a Slack channel or a pager. Within weeks, the channel is noise and the pager is muted. Quality alerting needs the same severity discipline as any alerting: page for contract violations on critical datasets, ticket for warnings, dashboard for informational. Alert fatigue in data quality is terminal, because the whole point is that someone pays attention.

**Quality as a gate with no owner.** A team adds blocking quality gates to the pipeline — the job fails if checks fail. Then a check fails spuriously at 3 AM, the pipeline is blocked, downstream SLAs breach, and someone disables the gate "temporarily." Blocking gates are correct for critical invariants, but every blocking check needs an owner who can triage it at 3 AM and a documented override process for when the check is wrong. A gate nobody can override in an emergency will be deleted in an emergency.

**Testing the pipeline, not the data.** Unit tests on transformation code are good; they are not data quality. A perfectly tested Spark job can still produce wrong data if the input semantics changed. Quality engineering tests the data itself, in production, continuously — not just the code that moves it.

**The one-time audit.** A team runs a big data-quality assessment, produces a report with 200 findings, and declares victory. Six months later the findings have all regressed because nothing was instrumented. Audits are a starting point for building checks, not a substitute for them.

## How to start, and what good looks like

Do not start by buying a data observability platform or writing a thousand checks. Start with the blast radius:

1. **Identify your five most decision-critical datasets.** The ones where wrong data costs real money or real trust. Everything else waits.
2. **For each, write down the invariants.** Freshness expectation, volume baseline, schema contract, and the three to five business rules that must always hold. This is a document first, code second — and writing it will surface disagreements about what "correct" means, which is half the value.
3. **Instrument the four families** on those five datasets: a freshness check, a volume check, schema enforcement at the boundary, and the business-invariant content checks as pipeline gates.
4. **Assign owners and alert paths.** Every check has a named owner and a severity. Warnings go to a triage queue with a weekly review; errors page.
5. **Run one incident drill.** Pick a historical bad-data event and walk through detection, containment, communication, and backfill. You will find the gaps in lineage, runbooks, and ownership before a real incident finds them for you.

What good looks like at steady state: bad data is caught by checks, not by humans squinting at dashboards. Every critical dataset has documented SLAs with real alerting behind them. When an incident happens, lineage answers the blast-radius question in minutes, affected partitions are quarantined before downstream consumers act on them, and the postmortem produces a new check. Producers notify consumers of schema changes before they ship, because the contract requires it and the CI enforces it. The quality dashboard is boring — mostly green, occasionally amber, red only when something genuinely broke. Boring is the goal. Data quality engineering succeeds when nobody has a story about the dashboard that was wrong for three weeks, because that story stopped happening.
