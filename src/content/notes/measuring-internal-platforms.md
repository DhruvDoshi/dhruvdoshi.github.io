---
title: Measure whether an internal platform creates leverage
author: Dhruv Doshi
date: 2027-07-16
status: scheduled
topic: Platform architecture
categories: [Platform Engineering, Metrics, Developer Experience]
---

An internal platform can look successful while moving work from one team to another. Repository count, portal visits, and cluster utilisation show activity, but they do not prove that product delivery is faster, safer, or easier.

## Use a balanced model

Measure four connected areas:

1. **User outcomes:** time to create, deploy, observe, and recover a service.
2. **Adoption and retention:** voluntary use by eligible teams and continued use after first contact.
3. **Reliability and support:** platform objectives, failed workflows, support demand, and time to restore.
4. **Organisational economics:** duplicated work removed, operating cost, upgrade effort, and team capacity returned to product work.

Segment measures by service type and team maturity. An average can hide a path that works for simple services and fails for regulated or data-intensive ones.

## Follow complete journeys

Instrument the developer workflow from request to production outcome. A self-service form that completes in seconds is not fast if an approval waits three days behind it. Measure elapsed time, active effort, handoffs, retries, and failure reasons.

Combine telemetry with interviews and observation. Developers may work around the platform in ways that usage analytics cannot see. Repeated support questions can reveal an unclear contract; silent abandonment may be worse than high ticket volume.

The [DORA research program](https://dora.dev/research/) provides validated measures for software-delivery performance. Platform teams can use those outcomes while carefully testing contribution: many product, process, and organisational factors affect delivery metrics.

## Define guardrails

Optimising provisioning speed must not weaken security or reliability. Pair speed and adoption with policy compliance, change-failure rate, service objectives, and incident evidence. Track cost per useful workload rather than total spend alone.

Publish platform objectives and status so teams can judge whether the dependency is trustworthy. Treat platform incidents as product incidents with reviews and follow-up.

## Make metrics actionable

Every measure needs an owner, decision, and review cadence. Remove metrics that never change a priority. Set hypotheses for platform investments and compare the result with the baseline.

The platform creates leverage when teams spend less effort on undifferentiated infrastructure while operating services more safely. Measurement should make that transfer of time, risk, and responsibility visible.
