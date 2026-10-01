---
title: "Feature flag governance: flags as inventory, not litter"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Platform architecture
categories: [Platform Architecture, Feature Flags, Release Engineering]
---

Every sufficiently mature codebase contains a graveyard of feature flags: `new_checkout_flow_v2_final`, `enable_thing_temp`, `johns_experiment_do_not_delete`. Each was created for a good reason. Each was supposed to be temporary. And each is now load-bearing in ways nobody fully understands, because removing any of them requires an archaeology expedition through years of git history.

Feature flags are among the most powerful tools in release engineering — and one of the fastest ways to accumulate invisible technical debt. Unlike most debt, flags don't slow you down gradually; they slow you down all at once, years later, when the flag system is so tangled that every release needs a flag audit and every cleanup is high-risk.

The fix is governance: treating flags as inventory with owners, lifecycles, and expiry dates, not as litter that accumulates wherever developers drop it.

## Flag taxonomy: different flags, different lifecycles

The first governance failure is treating all flags as the same thing. Four types, four lifecycles:

**Release flags** gate new functionality during rollout — decouple deployment from release. The code ships dark; the flag ramps 1%, 10%, 100%. Lifecycle: days to weeks. A release flag still in the codebase after rollout completes is debt, full stop.

**Experiment flags** back A/B tests. They live as long as the experiment plus analysis: weeks to a few months. The distinctive risk is the *losing variant* — the experiment concludes, variant B wins, and variant A's code path stays forever because nobody owned cleanup. Every experiment needs a pre-committed cleanup owner and date before launch.

**Ops flags and kill switches** control operational behavior: circuit breakers, degradation modes, emergency shutoffs. These save you at 3 AM when a downstream dependency melts. Lifecycle: long-lived by design. But long-lived is not unowned — each needs an owner, a runbook entry for when to flip it, and periodic review confirming it still does what the runbook says.

**Permission / entitlement flags** gate by plan, role, or tenant. Lifecycle: the life of the entitlement, potentially years. Some are genuinely permanent — but they still need owners and review, because entitlements change and flags that no longer match the pricing page are bugs.

Why the taxonomy matters: each type has a different expected lifespan, owner profile, and cleanup trigger. A system that treats a kill switch like a release flag deletes your 3 AM safety net; one that treats a release flag like a permission flag lets it rot for years. Name the type at creation and let the type drive the lifecycle policy.

## Lifecycle discipline: create, rollout, cleanup

Every flag moves through a defined lifecycle with time bounds:

1. **Create** — born with a name, a type, an owner, a creation date, and an expiry or review date. No flag is created without these. This is the highest-leverage governance rule: everything downstream depends on metadata captured at birth.
2. **Rollout** — the flag is actively changed: percentages ramped, targeting adjusted. Changes are logged (who, when, what, why).
3. **Cleanup** — the purpose is complete. Flag references are removed, dead branches deleted, then the flag is retired from the flag system. Cleanup is a scheduled work item, not an aspiration.

Time bounds: release flags get an expiry at creation (planned full-rollout date plus a few weeks' buffer); experiment flags get the experiment end date plus analysis time; ops flags get a quarterly review date; permission flags get an annual review against the entitlement model.

What makes time bounds real is **expiry with teeth**: when a flag passes expiry, something happens automatically. Minimum: the owner gets nagged and the flag lands on a stale-flag report. Better: CI fails or deploys block until the flag is cleaned up or its expiry explicitly extended with a reason. Unenforced expiry dates are decorative.

## Naming conventions that scale

Flag names are a user interface — for engineers reading code, operators flipping flags at 3 AM, auditors reviewing who enabled what. A convention that scales is scannable, greppable, and encodes minimum metadata. A pattern that works:

```
<team>.<type>.<feature>-<variant>
```

`payments.release.instant-payouts`, `search.experiment.ranking-v3`, `platform.ops.disable-legacy-webhooks`, `billing.permission.usage-based-tiers`. The team prefix names the owner at a glance; the type sets lifecycle expectations; the whole thing is greppable.

Enforce the rules: lowercase with one separator (pick dots or hyphens, enforce in CI), no lying version numbers (`v2_final` is a confession of failure — name the feature, not its iteration history), no personal names (`johns_experiment` informs nobody), and a max length readable in dashboards. Enforce at creation with a linter or CI check on the flag manifest — conventions enforced at creation cost nothing; conventions enforced in code review cost reviewer attention forever.

## Targeting and rollout strategies

**Percentage rollouts** are the default: 1%, 5%, 25%, 50%, 100%. The subtlety is stickiness — the same user must get the same variant on every evaluation, or users flicker between experiences. Sticky bucketing hashes a stable identifier (user ID, not session ID, not random) into buckets. Non-sticky bucketing makes your percentages fiction and your experiment results garbage.

**Attribute-based targeting** gates by plan tier, geography, tenant, internal-vs-external — how you do dogfooding, betas, and per-tenant enterprise rollouts. Targeting attributes must come from a stable, well-defined context, not ad-hoc request fields that change meaning between services.

**Ordered rollout stages** combine these: internal → beta → 1% → 10% → 50% → 100%, each stage a decision gate with explicit advance criteria (error rates nominal, no new alerts). Write the stages down before the rollout starts. "We'll ramp when it looks good" is how 5% becomes permanent.

**Kill switches** need granularity: a switch flippable only globally is a blunt instrument. The 3 AM scenario is rarely "everything is broken" — it's one tenant's traffic melting one downstream. Design kill switches flippable per-tenant, per-region, or per-dependency, matching the granularity of your actual failures.

And the invariant: **evaluation must be deterministic for a given context.** Same user, same attributes, same flag state → same decision, every time, in every service. Hash, don't roll dice.

## The tech-debt math of stale flags

Stale flags cost real money, and the costs compound. Price them so cleanup can compete with feature work:

**Cognitive load.** Every flag is a branch the reader must hold in mind. Three flags, eight behaviors; five flags, thirty-two. Review slows, onboarding hardens, and nobody fully understands any path. The dominant cost, and the hardest to measure — hence the proxy metrics below.

**Testing burden.** Each flag doubles the theoretical test matrix. Teams test the combinations they remember, so forgotten flags create untested code paths with full production traffic.

**Incident risk.** Stale flags show up in incidents disproportionately: the author moved on, the context is gone, and someone flips a flag whose behavior nobody fully understands. Every flag-flip incident review should ask whether staleness contributed.

**Cleanup cost growth.** Removing a flag is cheap right after rollout — context fresh, author available, tests current. Two years later it requires reconstructing all of that. Deferring cleanup is borrowing at a terrible interest rate.

The product conversation: "this flag costs roughly half a day of engineering confusion per quarter plus incident risk; cleanup costs one day now." You don't need precise numbers — you need the cost visible in the same currency as feature work.

## Ownership and accountability

Every flag has exactly one owner — a person, not a team. Teams don't clean up flags; people do. The owner keeps metadata current, drives rollout to completion, schedules cleanup before expiry, and answers for the flag in incident reviews.

When the owner leaves, ownership must transfer explicitly — detecting owner departure and reassigning is one of the highest-value automations a platform team can build. Flags owned by ghosts never get cleaned up.

Accountability needs visibility: a per-team dashboard of flag counts by type, flags past expiry, and time-to-cleanup trends, shown where teams already see health metrics. Nobody fixes what nobody sees.

## Flag evaluation performance

Flags are evaluated constantly — potentially per request, per service. **Server-side evaluation** (SDK evaluates locally against periodically fetched state) gives rich targeting and instant updates; mitigate the flag-service dependency with local caching and polling, and document the unreachable-service behavior *before* 3 AM discovers it. **Client-side evaluation** (browser/mobile) cuts server load but exposes logic to the client — fine for UI gating, never for authorization or pricing. The client is attacker-controlled.

Cache flag *state*, not *decisions* — cached decisions go stale exactly when freshness matters most (the kill switch you just flipped). Latency budget: sub-millisecond for local evaluation against cached state. If flag evaluation shows up in latency profiles, the architecture is wrong — synchronous per-request calls to the flag service, or targeting rules doing something expensive like per-request database lookups. Fix the architecture, not the budget.

## Flags in CI/CD: not a substitute for deployment discipline

Say it plainly: **flags do not replace good deployment practices.** They complement them.

A flag lets you deploy dark and release gradually. It doesn't let you skip testing the dark code — untested code behind a flag is still untested, plus the new failure mode of flag misconfiguration. It doesn't let you skip canary analysis — the flag rollout *is* the canary and needs the same monitoring and rollback criteria. And "we can always turn it off" is true only if the flag was tested, the off path was tested, and someone watches the rollout.

The discipline: flagged code gets the same CI, the same tests (both flag states for paths that matter), the same review bar as unflagged code. The flag changes the *release* risk profile, not the *code quality* bar.

## Auditing and compliance

"Who enabled what, when, for whom" is a control in regulated industries. The flag system must log every state change — flag, old value, new value, who, when — and require the *reason* at flip time. Five seconds of free text is the difference between an audit trail and a mystery.

Access control should be proportional: environment-scoped permissions, approval workflows for production kill-switch changes. Approval on every flag change recreates the ticket queue; approval on production kill switches is basic prudence. For audit-sensitive flags (entitlements, billing, access control), keep immutable history and export it as part of regular compliance evidence.

## Kill switches vs feature flags: different tools

They look similar — booleans that change behavior — but differ on every axis that matters:

| | Feature flag | Kill switch |
|---|---|---|
| Purpose | Gradual rollout, experimentation | Emergency shutoff, degradation |
| Flip frequency | Often during rollout, then never | Rarely, under pressure |
| Targeting | Fine-grained (%, attributes) | Global or coarse |
| Off-path testing | Nice to have | Mandatory — the off path is the point |
| Lifetime | Temporary (except permission flags) | Long-lived by design |
| Who flips | Engineers, PMs | On-call, incident commander |

The critical difference: **an untested kill-switch off path is not a safety device, it is a hope.** Kill switches need chaos-style validation — flip them in staging regularly, in production during game days, verify the degraded behavior works. And keep them visually distinct in the dashboard; the 3 AM operator shouldn't have to read carefully to distinguish the experiment from the circuit breaker.

## Removing flags safely: the two-step

Flag removal looks trivial and breaks production non-obviously. Two steps, deployed separately:

**Step 1: Remove the references, keep the flag.** Delete the branching logic, leaving the winning behavior unconditional. Deploy with full rollout treatment — this deploy changes code paths.

**Step 2: Remove the flag.** Once step 1 is fully deployed *everywhere* — including long-tail services and old mobile versions still in the wild — delete the flag from the flag system. No code changes; safe only if step 1 is truly complete.

Why two steps: deleting the flag while code references it makes the SDK return a default that may not be the behavior you want. The two-step makes each change independently safe and rollbackable. CI should enforce the ordering — fail PRs that delete a flag definition while references remain. For mobile, "fully deployed" may mean waiting months for old app versions to decay; plan mobile cleanup on mobile timelines.

## Metrics on flag health

- **Total flags by type and team** — trending up forever is the smell.
- **Stale-flag count** (past expiry/review) — the primary governance metric; target zero, owner per team.
- **Time-to-cleanup** (rollout completion → removal) — tells you whether lifecycle discipline is real.
- **Flag age distribution** — flags older than 6/12/24 months are the ones nobody will ever clean up voluntarily.
- **Flip frequency** — constantly-flipped flags are misused as config or covering for an operational problem that deserves a real fix.

Review monthly per team, quarterly org-wide. Not a shaming exercise — a prioritization input for next sprint's cleanups.

## Anti-patterns

**Flag nesting.** `if (flagA) { if (flagB) { ... } }` — combinatorial explosion, untestable, unreadable. If you need nested conditions, the feature decomposition is wrong; restructure so each flag gates an independent capability.

**Flags as config.** Timeouts and thresholds in the flag system because the UI is nice. Flags are for *behavioral branching with a lifecycle*; config is for *values that change*. Misuse fills the system with permanent entries and teaches the org that flags are permanent. Use a config system for config.

**Permanent "temporary" flags.** The 2022 release flag kept "in case we need to roll back." You will not roll back a 2022 change with a flag — the rollback window is weeks, not years. After that it's untested code paths and cognitive load.

**500 flags nobody owns.** The end state of no governance: no owners, no expiries, no documentation, cleanup impossible because nobody can authorize removal. Requires a dedicated "flag bankruptcy" project — always more expensive than the governance would have been.

**Flags in hot paths without local evaluation.** Synchronous per-request calls to the flag service: a single point of failure and a latency tax on everything. Evaluate locally against cached state. Always.

**Testing only the flag-on path.** The off path is production behavior for everyone outside the rollout — it deserves the same coverage.

## Closing

Feature flags are inventory, not litter. Inventory gets counted, owned, and retired. The governance isn't heavy: name flags well, type them at creation, give each an owner and an expiry, enforce the lifecycle in CI, measure staleness, remove in two steps. None of this slows down shipping — it speeds it up, because the flag system stays trustworthy instead of becoming the thing everyone fears touching.

Start with metadata-at-creation and the stale-flag dashboard. Every flag born with an owner and an expiry, every team seeing its stale count — those two alone change the trajectory. The rest is refinement.
