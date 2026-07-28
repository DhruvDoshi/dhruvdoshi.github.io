---
title: Service-level objectives are decision tools
author: Dhruv Doshi
date: 2026-09-16
status: scheduled
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
