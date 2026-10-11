---
title: "SLO burn rate alerting"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: SRE
categories: [SRE, Observability, Alerting]
---

Most alerting answers the wrong question. It asks "is the error rate high right now?" when the question that matters is "are we consuming our error budget fast enough that the SLO is at risk?" A service can sustain a terrifying-looking error spike for ten minutes and still be fine for the month, while a modest but persistent elevation quietly burns through the budget with nobody paged. Burn rate alerting fixes the question. The multiwindow, multi-burn-rate approach from the Google SRE workbook is the best-known formulation of it, and it remains the best default for any team serious about SLOs.

This note covers the mechanics — burn rate math, fast-burn versus slow-burn windows, how to choose thresholds — and the harder parts: connecting burn rate to paging policy, avoiding alert fatigue, and the failure modes that make burn-rate alerts lie.

## The real problem: alerting on symptoms instead of the budget

The traditional setup alerts on raw signals: error rate above X%, latency p99 above Y milliseconds, CPU above Z%. These alerts have two failure modes, and every on-call engineer knows both intimately. They fire during incidents that do not matter — a brief spike that self-resolves, a deploy that blips — training the team to ignore them. And they stay silent during the incidents that do matter — the slow bleed that never crosses a threshold in any single minute but accumulates into an SLO breach over days.

The root cause is that raw thresholds have no notion of the SLO. An error rate of 1% is catastrophic for a service with a 99.99% SLO (budget: 0.01%) and irrelevant for a service with a 99% SLO (budget: 1%). The same alert threshold cannot serve both, and tuning per-service thresholds by gut feel is how you get alert configurations that nobody understands and everybody fears touching.

Burn rate reframes the alert around the budget. The burn rate is the ratio of the current error rate to the budgeted error rate:

```
burn rate = (observed error ratio) / (budgeted error ratio)
```

A burn rate of 1 means you are consuming budget exactly as fast as the SLO allows — you will exhaust the 30-day budget in exactly 30 days. A burn rate of 10 means you will exhaust it in 3 days. A burn rate of 0.5 means you are fine. Every alert threshold becomes a statement about time-to-exhaustion, which is the thing humans actually need to know: "at this rate, the budget is gone in N hours."

## The math, concretely

Take a service with a 99.9% availability SLO over a 30-day window. The budgeted error ratio is 0.1% (0.001). The total budget is 0.001 × (all requests in 30 days), but it is easier to think in time: at burn rate 1, the budget lasts the full 30 days (720 hours).

Now suppose the service starts erroring at 1% — ten times the budgeted rate. Burn rate = 0.01 / 0.001 = 10. Time to exhaust the full budget at this rate: 720 hours / 10 = 72 hours. If instead it errors at 10%, burn rate = 100, and the budget is gone in 7.2 hours.

This gives you a principled way to set alert thresholds. The SRE workbook's widely used starting point:

| Alert | Burn rate | Exhaustion time | Window pair | Response |
|---|---|---|---|---|
| Fast burn (page) | 14.4 | 2 days | 1h long, 5m short | Page immediately |
| Slow burn (ticket) | 6 | 5 days | 6h long, 30m short | Ticket, investigate within a day |
| Slowest (ticket) | 1–3 | 10–30 days | 3d long, 6h short | Track, review in planning |

The fast-burn alert at 14.4× means: if this continues, the entire 30-day budget is gone in 2 days. That is page-worthy for most services — it is a genuine emergency, not a blip. The slow-burn alert at 6× means the budget is gone in 5 days if it continues: serious, needs investigation, but not a 3 AM page. The third tier catches the slow bleed that never trips either of the first two.

These numbers are starting points, not scripture. A service with a 99.99% SLO has a much smaller budget, and the same burn rates exhaust it much faster in absolute terms — which is correct, because a four-nines service genuinely is in more trouble at 10× burn. The framework scales with the SLO automatically, which is exactly why it beats fixed thresholds.

## Multiwindow: why two windows per alert

A single-window burn rate alert has a reset problem. Suppose you alert when the 1-hour burn rate exceeds 14.4. An incident starts, the alert fires, the team mitigates after 30 minutes — but the 1-hour window still contains the bad 30 minutes, so the alert keeps firing for another half hour after the incident is over. Worse, a brief 5-minute spike can push the 1-hour average over the threshold, paging someone for something that already resolved.

The multiwindow fix: each alert uses a **long window** (for the threshold decision) and a **short window** (as a reset/confirmation condition). The alert fires only when *both* windows exceed the burn rate threshold. The short window ensures the problem is still ongoing — it resets quickly when the incident ends. The long window ensures the problem is significant — a 5-minute blip cannot move the 1-hour average enough to fire.

In PromQL, the canonical pattern for a fast-burn page looks like this:

```promql
# Burn rate over the last 1h AND the last 5m both exceed 14.4
(
  sum(rate(http_requests_failed_total[1h]))
  /
  sum(rate(http_requests_total[1h]))
) / 0.001 > 14.4
and
(
  sum(rate(http_requests_failed_total[5m]))
  /
  sum(rate(http_requests_total[5m]))
) / 0.001 > 14.4
```

(Here `0.001` is the budgeted error ratio for a 99.9% SLO — parameterize it per service.) The `and` is doing the important work: the 5-minute window confirms the burn is still happening *now*, while the 1-hour window confirms it is big enough to matter. When the incident resolves, the 5-minute burn drops below threshold within minutes and the alert clears — no more alert hangover.

For the slow-burn ticket, the same structure with 6-hour and 30-minute windows and a threshold of 6. For the slowest tier, 3-day and 6-hour windows with a threshold around 1–3, routed to a tracking ticket or a dashboard rather than a human's immediate attention.

A practical note on implementation: compute burn rate as a **recording rule** and alert on the recorded series. Evaluating `rate()` over 3-day windows in every alert evaluation is expensive and slow; a recording rule evaluated every minute or two gives you a cheap, stable series to alert on. It also gives you a graphable burn-rate history, which is invaluable during incidents — "when did the burn start, and is it accelerating?"

## Choosing burn rates and windows for your services

The workbook's table is a starting point. Here is how to reason about deviations:

**Tighter SLOs need the same burn rates, not tighter ones.** This is the framework's best property: because burn rate is relative to the budget, a 99.99% service and a 99% service can share the same alert definitions. The 14.4× page means "budget gone in 2 days" for both. Do not invent per-service thresholds unless you have a reason — uniformity is what makes the alerts understandable at 3 AM.

**Adjust the response, not just the threshold.** The more useful customization is per-service routing: which alerts page, which ticket, and what the runbook says. A 14.4× burn on the checkout path pages; the same burn on an internal admin tool might ticket. The burn rate tells you the severity relative to the SLO; the service's criticality tells you the response.

**Window lengths encode your incident shapes.** The 1h/5m fast-burn pair assumes incidents worth paging develop over tens of minutes. If your service has failure modes that go from fine to catastrophic in two minutes (a bad deploy that 500s everything), the 5-minute confirmation window is fine but consider whether the long window should be shorter — or whether you need a separate deploy-health check outside the SLO framework. Conversely, low-traffic services need longer windows: with ten requests a minute, a 5-minute window is noise. Scale windows to traffic, or better, alert on burn rate computed over a minimum event count.

**Low-traffic services need special handling.** Burn rate on tiny denominators is statistically meaningless — two errors out of ten requests is a 20% error ratio and a terrifying burn rate, but it is two errors. Options: set a minimum request volume for the alert to fire, lengthen the windows, or fall back to absolute error counts for very low-traffic services. Do not let the framework page someone over two failed requests.

## Connecting burn rate to error budgets and paging policy

Burn-rate alerts in isolation are just better thresholds. Their real power comes from the policy around them: the explicit connection between budget consumption and human response.

The policy should state, per service tier:

- **What burn rate pages, and what the page means.** "A fast-burn page means the 30-day budget is exhausting in under 2 days at current rate. The paged engineer is expected to acknowledge within 15 minutes and either mitigate or escalate." The page carries its own severity justification — no more "is this page real?"
- **What happens when the budget is exhausted.** This is the part most teams skip. If the budget is gone and the SLO is breached, what changes? The standard answer: feature work freezes and all engineering effort goes to reliability until the budget recovers. If breaching the SLO changes nothing, the SLO is decorative and the alerts are nagging. The budget policy is what gives burn-rate alerts their authority.
- **Ticket-tier response expectations.** Slow-burn tickets need SLAs too — "investigated within one business day" — or they rot in the backlog. A slow burn that nobody investigates is just a slower way to breach.
- **Alert-to-runbook linkage.** Every burn-rate alert should link to a runbook that starts with "how to tell whether this is real" (check the burn-rate graph, check for deploys, check dependencies) and "how to stop the burn" (the service's known mitigation levers). The alert tells you the budget is burning; the runbook tells you where the fire extinguisher is.

There is also a cultural point. Burn-rate alerting only works if the team trusts the alerts, and trust comes from the alerts being right. Every false page should be treated as a bug in the alert configuration — tune the windows, adjust the minimum-volume guard, fix the recording rule — not as an accepted cost of on-call. The goal is a pager that is silent for months and then, when it fires, everyone moves fast because they know it means something.

## Anti-patterns: how burn-rate alerting goes wrong

**Single-window burn alerts.** Alerting on a 1-hour burn rate without the short-window confirmation gives you the reset problem: pages that outlive the incident and blips that page. The multiwindow structure is not optional polish; it is what makes the alerts usable.

**Burn rate without an SLO.** Computing burn rate against an invented or aspirational budget produces alerts that nobody believes. The budget has to be a real commitment — agreed with stakeholders, tracked on a dashboard, tied to the freeze policy. If the SLO is fiction, the burn rate is numerology.

**Alerting on budget consumption instead of burn rate.** "Page when 50% of the monthly budget is consumed" sounds reasonable and fails in practice: a service can burn 50% of its budget in a single bad day early in the month and then run clean, or burn it steadily with no incident at all. Consumption tells you where you are; burn rate tells you where you are headed. Alert on the derivative.

**Ignoring the denominator.** Burn rate on request-ratio SLOs breaks when traffic drops to near zero — every error is a huge ratio. The minimum-volume guard is not an edge case; for internal tools, batch jobs, and off-peak hours, it is the normal case.

**Latency SLOs shoehorned into error budgets.** The burn-rate math works naturally for ratio-based SLOs (availability, error rate). For latency SLOs — "99% of requests under 300ms" — you can define "bad events" as slow requests and apply the same framework, which works fine. But do not mix latency and availability into one burn rate; they have different budgets, different failure modes, and different mitigations. Separate alerts, separate runbooks.

**Set-and-forget.** SLOs change, traffic patterns change, services get more or less critical. Burn-rate alerts need periodic review — quarterly is a good cadence — asking: did the pages this quarter correspond to real budget risk? Did any real budget risk go unpaged? Tune from the evidence.

**Paging on the slowest tier.** The 3-day-window alert exists to catch slow bleeds for planning, not to wake people up. Routing it to the pager guarantees it will be muted, and the mute will eventually cover the fast-burn alert too. Severity routing is load-bearing: page only for fast burn, ticket for slow burn, track the rest.

## How to start, and what good looks like

If your team currently alerts on raw thresholds, migrating to burn-rate alerting is a contained project:

1. **Pick one service with a real SLO.** You need an SLO with a defined window (30 days is standard), a budgeted error ratio, and stakeholder agreement that it matters. Without this, start by writing the SLO — the alerting conversation will force the clarity.
2. **Implement the recording rules.** Burn rate over 1h, 5m, 6h, 30m, 3d, 6h windows, computed from your request metrics (OpenTelemetry-instrumented services already emit what you need). Graph them for a week before alerting on them — you want to see what normal burn looks like, including deploys and traffic dips.
3. **Wire the three tiers.** Fast burn (14.4×, 1h/5m) to the pager with a runbook link. Slow burn (6×, 6h/30m) to the ticket queue with a one-day investigation SLA. Slowest tier (1–3×, 3d/6h) to a dashboard and a weekly review.
4. **Add the minimum-volume guard** before the first page, not after the first false one. Learn from everyone's history here.
5. **Write the budget policy.** What happens at exhaustion — the feature freeze, the review, the recovery criteria. Get stakeholder sign-off. This is the document that makes the alerts matter.
6. **Review after one quarter.** Count pages, classify true versus false, check whether any budget risk went unalerted, tune windows and thresholds from the evidence.

What good looks like at steady state: the pager is quiet — weeks of silence punctuated by pages that everyone takes seriously, because every page means the error budget is genuinely exhausting in days, and the runbook tells the responder exactly how to confirm and mitigate. Slow burns become tickets that get investigated within a day, and the slowest tier feeds a weekly reliability review where the team spots trends before they become incidents. The SLO dashboard shows budget consumption over the rolling window next to the burn-rate history, and anyone — engineer, manager, stakeholder — can read the service's reliability story at a glance. Feature freezes after budget exhaustion are rare, because the slow-burn tier catches problems early enough to fix them in normal working hours. And when someone proposes a new alert threshold, the team's first question is "what burn rate does that correspond to?" — because the organization now thinks in budgets, not in raw error percentages. That shared vocabulary is the real product of burn-rate alerting: fewer, better pages, and a team that trusts its pager.
