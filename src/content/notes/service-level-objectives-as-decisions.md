---
title: Service-level objectives are decision tools
author: Dhruv Doshi
date: 2022-10-01
reviewed: 2026-07-28
status: published
topic: Observability
categories: [SRE, SLO, Reliability]
---

A service-level objective is not a decorative percentage on a dashboard. It is an agreement about the reliability users need and a mechanism for deciding how engineering capacity should be spent.

## Measure a user outcome

Choose a service-level indicator at the point where the user experiences success or failure. For an API, that may be the proportion of valid requests completed correctly within a latency threshold. For a data pipeline, it may be records available by an agreed deadline. Infrastructure availability alone rarely describes the whole experience.

Define the population precisely: which requests count, which exclusions are legitimate, where measurement occurs, and how missing telemetry behaves. A ratio without those rules will be interpreted differently during every incident.

## Set the objective from consequences

The objective should reflect the cost of failure to users and the cost of delivering additional reliability. More nines are not automatically better. They increase redundancy, testing, operational, and coordination requirements. The [Google SRE Workbook](https://sre.google/workbook/implementing-slos/) recommends starting from what users need and iterating as evidence improves.

An error budget translates the objective into allowable unreliability. If a 30-day target is 99.9%, the budget is roughly 43 minutes, but time alone may not capture a request-based indicator. Track budget consumption in the same unit as the SLI.

## Connect the budget to action

Agree on policy before the budget is exhausted. Rapid burn may page the on-call team. Sustained burn may pause risky releases, prioritise reliability work, or trigger an architectural review. Healthy budget may support normal delivery rather than justify consuming unreliability intentionally.

Use multiple burn-rate windows so a brief severe event and a slow persistent regression are both visible. Alerts should correspond to a meaningful threat to the objective, not every small fluctuation.

## Review the model

An SLO can be met while users are unhappy if the indicator misses an important journey. It can also be impossible because the dependency contract does not support it. Review objectives after incidents, major product changes, and shifts in traffic or user expectations.

The point is not to make reliability mathematically impressive. It is to make the trade between feature delivery and operational risk explicit, shared, and grounded in the experience the system exists to provide.

## Build the indicator carefully

For a request-based service, a common SLI is:

`good valid requests / total valid requests`

“Good” may require both a successful result and completion below a latency threshold. “Valid” might exclude malformed client requests but should not exclude server failures, dependency failures, or slow responses merely because they are inconvenient. Write exclusions so an independent reviewer can reproduce the calculation.

For a multi-step journey, measure the completed outcome where possible. A checkout service can return successful API responses while payment confirmation never reaches the user. Synthetic journeys, business events, or client-side signals may represent that experience better than server availability alone.

## Use burn rate instead of remaining minutes alone

Burn rate compares current error consumption with the rate permitted by the objective. A burn rate of 1 consumes budget exactly at the sustainable rate; a burn rate of 10 consumes it ten times faster. Pair a short window with a longer confirmation window to detect severe incidents quickly without paging on a single transient sample.

Set notification and paging thresholds from the fraction of budget at risk. A ticket might be appropriate for gradual degradation; a page should require a condition that needs immediate human action.

## Handle dependencies explicitly

A service cannot sustainably promise more than its critical dependencies unless it adds caching, redundancy, graceful degradation, or another form of insulation. Map dependency objectives to the user journey and identify where budgets compound. Do not simply copy a provider’s availability number into the product commitment.

## Review checklist

Confirm that the SLI represents a user outcome, source data is independently verifiable, exclusions are narrow, the objective has product agreement, alert policy maps to error-budget risk, and remediation authority is clear. Review whether teams actually make different release or investment decisions because the SLO exists. If not, it is reporting, not reliability management.
