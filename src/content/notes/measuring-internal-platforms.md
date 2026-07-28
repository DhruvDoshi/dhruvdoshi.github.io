---
title: Measure whether an internal platform creates leverage
author: Dhruv Doshi
date: 2026-07-01
reviewed: 2026-07-28
status: published
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

## Define the eligible population

Adoption rates are meaningless without a denominator. Identify which teams and workload types the platform is designed to serve, which are in migration, and which legitimately require another path. Report first use, sustained use, and abandonment separately. Mandatory registration should not be counted as successful product adoption.

Measure time to first successful outcome for a new user and for an experienced team. Include waiting, approvals, failed attempts, and support time. A workflow may be fast once configured while onboarding remains the dominant cost.

## Use leading and lagging signals

Leading signals include documentation success, workflow completion, provisioning time, support demand, upgrade adoption, and repeated exceptions. Lagging outcomes include delivery performance, reliability, security incidents, and total operating cost. Use both: leading signals help the platform team act quickly, while lagging outcomes check whether local improvements matter to the organisation.

Avoid claiming direct causation from a platform change without accounting for team, product, and process differences. Compare cohorts, observe before and after, and combine quantitative evidence with user research.

## Measure cognitive load

Ask teams which decisions they still need to understand, which failures they can diagnose, and which platform abstractions leak during operation. A platform that hides everything during normal use but becomes opaque in an incident can increase risk. Track whether ownership and escalation are clear at the point of failure.

## Scorecard checklist

A useful platform scorecard includes eligible and active users, journey completion, elapsed and active time, workflow reliability, objective performance, support and exception themes, upgrade lag, unit cost, security and reliability outcomes, and qualitative evidence. Every metric should map to a decision. Retire vanity measures that remain green while users continue to build around the platform.
