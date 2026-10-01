---
title: "Engineering metrics that matter: DORA, SPACE, and the ones in between"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Staff engineering
categories: [Staff Engineering, Metrics, Leadership]
---

Every engineering organization measures something. Most measure the wrong things, confidently, on beautiful dashboards nobody acts on. Velocity is up; the engineers say everything is on fire; the executives say the numbers look good. Same screen, different reality.

This note is about measuring engineering work so it survives contact with reality: what DORA actually tells you and what it hides, what SPACE adds, the unglamorous metrics in between that drive real decisions — and how to measure without creating the perverse incentives that turn every metric into a lie within two quarters.

## Why most engineering dashboards lie

Three failure modes, usually all present at once.

**Vanity metrics.** Numbers chosen because they go up and to the right, not because they inform a decision: lines of code, commits per developer, story points completed. They measure activity in units that are trivially gameable. A vanity dashboard is a morale document, not a management tool.

**Gaming.** The moment a metric becomes a target, it stops being a measure — Goodhart's law, operating on a timescale of weeks. Measure PRs merged per engineer and you get smaller, more numerous PRs, multiplying review overhead. Measure story points and you get point inflation. The gaming isn't malice; it's rational behavior under the incentive you created.

**Measurement without theory.** Collecting metrics with no model of what drives what. "Deployment frequency dropped" — is that bad? Maybe the team ships careful releases of a stable system; maybe they're stuck. The metric alone can't tell you. You need a theory of what good looks like before numbers mean anything. Metrics without theory produce panic or complacency, at random.

The test for any metric on your dashboard: **what decision would change if this number moved 20% either way?** If you can't answer, it's decoration. Remove it.

## DORA's four keys, explained properly

The DORA metrics — from the DevOps Research and Assessment program — are the closest thing the industry has to validated engineering metrics. They correlate with organizational performance in the research. But they're widely misunderstood, so here's what each measures and where each lies.

**Deployment frequency.** How often the team ships to production. Measures batch size and pipeline friction — teams deploying daily have, almost by necessity, automated pipelines and small changes. Hides: whether the deployments were *good*. A team can ship broken code ten times a day.

**Lead time for changes.** Commit to production. Measures pipeline efficiency and process friction — review queues, manual approvals, slow staging. Usually the metric with the most actionable signal: when lead time is long, the causes are concrete and fixable. Hides: everything before the commit — unclear requirements, the week the ticket sat unassigned. One-hour lead time on the wrong thing is still slow.

**Change failure rate.** Percentage of deployments needing remediation. Measures the quality of the change process — testing, review, canarying. This is what keeps deployment frequency honest: speed without quality shows up here. Hides: the definition of "failure" is squishy and varies by team, killing cross-team comparability; and it misses failures not tied to a deploy — latent bugs, capacity cliffs.

**Mean time to restore (MTTR).** Failure to recovery. Measures operational maturity — detection, diagnosis, rollback, on-call effectiveness. Note: time to *restore*, not to *fix*; it rewards getting healthy again (rollback, failover), not root-causing under pressure. Hides: it can reward fast mitigation of frequent failures over prevention — 5-minute MTTR with a daily outage looks fine and is actually in trouble.

The four keys work as a system: frequency and lead time measure *throughput*, failure rate and MTTR measure *stability* — and the research finding is that the two aren't traded off. High performers are high on both. **Speed and stability are not opposites**: the practices enabling speed (small batches, automation, fast feedback) are the practices enabling stability.

Use DORA for teams shipping services continuously. Don't force it onto platform teams building internal tools or long-cycle embedded work — you'll get meaningless numbers or pressure to reshape the work to fit the metric.

## SPACE: the complement

DORA measures the delivery system. SPACE — from the ACM-published framework by Forsgren and colleagues — measures developer productivity across five dimensions. The argument: productivity is multidimensional, and any single metric distorts. Use SPACE to fill what DORA misses.

**S — Satisfaction and well-being.** How fulfilled and supported developers feel, measured through surveys. The canary dimension — satisfaction drops before delivery metrics do, because burned-out engineers keep shipping until they quit.

**P — Performance.** Outcomes, not output. Did the feature move the business metric? Hardest to measure well because it requires connecting engineering work to defined outcomes — which is why most teams skip it, and why most teams can't say whether they're *effective* versus merely *busy*.

**A — Activity.** Countable outputs: commits, PRs, deploys. Useful diagnostically — a sudden drop in review activity might mean the team is stuck — but the most gameable dimension. Never a target. Activity answers "what happened," never "was it good."

**C — Communication and collaboration.** Review turnaround, cross-team dependencies, knowledge sharing. Much of what feels like "slow engineering" is slow communication — the PR waiting three days for review. This is where staff engineers usually have the most leverage.

**E — Efficiency and flow.** Time from idea to production, uninterrupted focus time, dev-environment friction. An engineer interrupted every 30 minutes isn't 50% less productive; the research says the cost is far higher.

Practical use: pick one or two dimensions where you have a hypothesis. "I think our problem is flow — let's measure uninterrupted time and build reliability." SPACE is a menu, not a mandate; measuring all five at once produces a dashboard nobody reads.

## The metrics in between that drive decisions

Frameworks aside, the metrics that change what you do Monday morning are usually more specific:

**Review turnaround time.** PR opened to first meaningful review, and to merge. The highest-leverage flow metric most teams ignore. Four-hour turnaround with two-day lead time means a review problem, not a pipeline problem — and the fix is social (review SLAs, rotation), not technical. Measure the distribution: the p90 PR waiting a week is where the pain lives.

**Build reliability.** Percentage of CI runs passing first try, excluding genuine test failures — how much flakiness is infrastructure vs. real signal. Flaky builds tax every engineer daily and erode trust until engineers ignore red builds, at which point your quality gate is decorative. Track quarantined tests explicitly: each is a known lie in your suite.

**Incident learning rate.** Not incident count — count punishes the best detection. The learning rate: what fraction of incidents produce a *systemic* fix, and how fast does it ship? Ten incidents with ten systemic fixes beats two incidents with two "we'll monitor it" action items. This reframes incidents from failures to investments.

**Time to first feedback.** For a new engineer: how long to their first meaningful production contribution. Long times signal onboarding friction, over-complex architecture, or process gates — and predict both satisfaction and retention.

**Rework rate.** Fraction of merged work substantially reworked within 30 days. High rework means building the wrong thing or building without enough understanding — a proxy for requirements quality that product and engineering can examine together without arguing about fault.

**On-call burden.** Pages per shift, percentage actionable, operational vs. project time. Unmeasured on-call burden burns out your best engineers while velocity looks fine. The "actionable" qualifier matters: non-actionable pages train engineers to ignore the pager, which is how real pages get missed.

## Leading vs lagging indicators

DORA metrics are mostly lagging: they report after the fact. Good for accountability and trends; bad for intervention — by the time frequency drops, causes are weeks old.

Leading indicators predict where lagging ones head: **review queue depth** predicts lead time. **Build flakiness** predicts lead time and failure rate — engineers who can't trust CI either wait longer or stop trusting the gate. **Satisfaction trends** predict attrition with a 2–3 quarter lag. **On-call actionable-page rate** predicts burnout and the "no deploys on Friday" culture that tanks frequency.

Run the operating cadence on leading indicators (weekly: queue depths, flakiness) and quarterly reviews on lagging ones (DORA trends). Reacting weekly to MTTR noise produces thrash; reviewing queue depth quarterly produces wallpaper.

## Goodhart's law in practice

Everyone quotes "when a measure becomes a target, it ceases to be a good measure." Few design against it:

**Target: deployment frequency.** The team splits every change into five micro-deploys. Frequency rises; meaningful batch size is unchanged; review overhead quintuples. The metric improved; the system got worse.

**Target: lead time.** Reviews become rubber stamps, or friction moves into "pre-commit" phases the metric doesn't capture — the week of Slack threads before the commit. Lead time drops; quality drops faster.

**Target: story points.** Points inflate within two quarters; historical data corrupts. Treat this as a law of nature: never attach performance consequences to story points.

**Target: MTTR.** The team masters 90-second rollbacks and stops investing in prevention, because prevention doesn't move the metric. MTTR looks excellent; outage rate climbs. Customers get *more* downtime, recovered faster — not the trade anyone wanted.

Defenses, in order of effectiveness:

1. **Never tie a metric to performance evaluation or compensation.** The moment it affects a review, gaming becomes rational and the metric becomes fiction. Metrics inform conversations; they don't decide ratings.
2. **Measure in balanced sets.** DORA's keys constrain each other — you can't game frequency without failure rate noticing. Every target needs a counter-metric.
3. **Prefer team-owned metrics over imposed ones.** A team tracking its own review turnaround uses it honestly; a team with it imposed as a target games it. The difference is whether "why did this move" is asked without accusation.
4. **Sunset metrics.** Every metric has a half-life. Quarterly, kill metrics that no longer drive decisions. Green for a year means solved (celebrate, remove) or gamed (investigate, replace).

## Team-level vs org-level metrics

Different altitudes, different questions. **Team-level** metrics answer "are we healthy, where's our friction?" — review turnaround, build reliability, on-call burden. Diagnostic, reviewed weekly, acted on directly. **Not comparable across teams**: a platform team and a mobile team have different work shapes; comparing them produces meaningless rankings or pressure to homogenize what shouldn't be.

**Org-level** metrics answer "are we improving, where do we invest?" — DORA trends by value stream, satisfaction trends, attrition. Strategic, reviewed quarterly. Aggregate carefully: averages hide the struggling team, so look at distributions.

The failure mode is crossing the streams: managing teams on org metrics ("your frequency is below median") or judging the org on team metrics ("PRs merged is up, so we're healthy"). When an exec asks for team-level numbers, offer the org trend plus a dig-in — not raw team figures, which invite exactly the wrong comparison.

## Qualitative data as first-class evidence

Surveys, retros, and one-on-one themes are data, not anecdotes — if collected systematically. A quarterly developer survey with consistent questions produces trend lines as real as any dashboard, measuring what dashboards can't: friction, confusion, morale.

Apply quantitative rigor: same questions each quarter, anonymous, high participation (below ~70% response, results skew to the loudest voices) — and **close the loop**. Every survey must produce visible actions, communicated back: "you said review turnaround was the top friction; here's what we're doing." A survey producing no action is worse than none; it teaches the org feedback goes nowhere.

Retro output is metric input: tag action items by theme, track recurrence. The theme appearing three quarters running *is* a metric — just not on a dashboard yet. The most important signals ("we're afraid to touch the payments service") appear in retros first; they never appear in DORA.

## Presenting metrics to executives without lying

**Trends, not snapshots.** Four to eight quarters with annotations ("CI migration," "reorg"). Trends tell the story; snapshots start arguments. **Distributions, not averages.** "Average lead time 2 days" hides the team at 9 days — show the spread. **Context with every number**: one sentence on what it means, why it moved, what's being done. A number without interpretation gets interpreted by the most anxious person in the room. **Pair lagging metrics with the leading work**: "failure rate ticked up; here's the flaky-test quarantine program addressing it." Metrics with action read as management; alone they read as bragging or alarming. **Never present a metric you couldn't defend under questioning** — how it's measured, its blind spots, why it matters. Get caught presenting a number you don't understand and every future number gets discounted.

## When the numbers are bad

Bad numbers are information, not indictment. **Blameless framing, publicly**: "failure rate doubled" is followed by "let's understand the system that produced this," never "whose deploys broke." The moment bad metrics trigger blame, gaming starts and the signal dies permanently. **Systemic diagnosis**: bad metrics have systemic causes — flaky suites, collapsed review culture, architectural coupling. Ask what about the process makes this outcome *likely*. **One intervention at a time**: pick the highest-leverage fix, watch the leading indicators. Changing five things teaches nothing. **Give it time**: most interventions take a quarter to reach lagging metrics; reacting to weekly noise produces thrash.

And when the numbers are bad because the *measurement* is bad — wrong metric for the work, corrupt data, drifted definitions — say so, fix the instrument, and don't punish the team for it.

## Anti-patterns

**Individual productivity scores.** Ranking engineers by commits, PRs, or vendor "productivity scores" destroys collaboration (why help a teammate when it doesn't count?) and measures the most legible work, not the most valuable. The engineer who unblocked three teams by fixing the build looks unproductive on every individual metric. Never do this.

**Lines of code.** As productivity, incentivizes verbosity; as quality, means nothing. The best change is often a deletion. LOC survives because it's easy to count.

**Story points as performance.** Points are a team planning tool; the moment they're a management performance tool, they become fiction.

**Dashboard without decisions.** Metrics nobody looks at except quarterly, all green or explained away. If a metric never triggers a conversation, delete it. Dashboard space is attention space.

**Comparing teams on DORA.** The stateless-API team shipping twelve times daily vs. the regulated-firmware team shipping twice a quarter — ranking them on frequency is managerial malpractice. Benchmark against own history and realistic peers, never the org average.

**Measuring everything, acting on nothing.** Twenty instrumented metrics and no review ritual is surveillance, not management. Every metric needs an owner, a cadence, and a defined response when it moves.

## Closing

Measure the system, not the people. Use DORA for delivery performance, SPACE for the human reality around it, and the unglamorous in-between metrics — review turnaround, build reliability, incident learning — for Monday-morning decisions. Leading indicators weekly, lagging quarterly. Never tie a metric to a review. Treat surveys and retros as data. And keep asking the question that keeps every dashboard honest: what decision would change if this number moved?
