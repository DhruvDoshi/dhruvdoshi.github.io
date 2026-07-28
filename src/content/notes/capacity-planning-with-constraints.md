---
title: Capacity planning begins with constraints
author: Dhruv Doshi
date: 2025-06-01
status: published
topic: Observability
categories: [Capacity Planning, Performance, Reliability]
---

Capacity planning is not forecasting one traffic number and adding a fixed percentage. It is identifying which resource limits the user outcome, how demand approaches that limit, and how quickly the system can respond.

## Model demand in useful units

Requests per second may be insufficient when requests have different cost. Include dimensions such as payload size, records scanned, concurrent sessions, event fan-out, model tokens, or storage growth. Separate steady demand from bursts and scheduled work.

Use historical distributions, product events, seasonal patterns, and known launches. Forecasts should be ranges with assumptions, not a single precise value. Record which assumptions would invalidate the plan.

## Find the limiting resource

Map each demand unit to CPU, memory, connections, queue depth, I/O, network, third-party quota, and human operational load. The first exhausted dependency determines effective capacity. Managed services still have quotas, scaling rates, partition limits, and regional constraints.

Load tests should reproduce representative mixes and data sizes. Measure user-visible latency and error behavior while increasing load gradually. A test that stops before saturation cannot show the failure mode or recovery behavior.

## Preserve headroom

Headroom covers traffic variance, node loss, failover, deployments, rebalancing, and forecast error. Define it per constrained resource. Autoscaling reduces provisioning time only if metrics, limits, quotas, and downstream dependencies can support the added instances.

The [Google SRE discussion of handling overload](https://sre.google/sre-book/handling-overload/) explains load shedding, request prioritisation, and graceful behavior as capacity protections. Those controls should be designed before saturation.

## Connect capacity to action

Create thresholds with lead time: when to tune, scale, repartition, request quota, or change architecture. Assign owners and account for the time needed to purchase or approve capacity. Monitor forecast error and update the model after launches and incidents.

Test reduced-capacity states, including zone loss and dependency throttling. A system sized only for normal conditions may fail exactly when redundancy is needed.

Capacity planning is an operating loop: measure demand, identify constraints, validate behavior, preserve recovery margin, and revisit assumptions. The output is not a spreadsheet. It is enough time and evidence to act before users discover the limit.
