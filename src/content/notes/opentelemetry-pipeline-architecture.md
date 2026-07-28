---
title: OpenTelemetry pipeline architecture for vendor-neutral observability
author: Dhruv Doshi
date: 2026-04-15
reviewed: 2026-07-28
status: published
topic: Observability
categories: [OpenTelemetry, OTLP, Collector, Observability]
---

OpenTelemetry standardises how applications produce and transmit traces, metrics, and logs. It does not make every backend identical, and it does not operate the telemetry path automatically. Vendor neutrality comes from controlling instrumentation, semantic contracts, routing, and export boundaries.

## Separate API, SDK, protocol, and collector

The API is what application and library code calls. The SDK records, samples, processes, and exports signals. OTLP is the protocol used to transmit OpenTelemetry data. The Collector is a separate service that receives, processes, and exports telemetry.

Keeping application code on OpenTelemetry APIs and semantic conventions reduces vendor coupling. Sending OTLP through a controlled collector tier keeps credentials, retries, filtering, enrichment, and destination choice outside each workload.

The [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/) is explicitly designed as a vendor-agnostic receiver, processor, and exporter. A pipeline connects those components for each signal.

## Use agent and gateway tiers deliberately

An agent collector runs close to a workload or host. It can receive local OTLP, collect host data, add trusted resource attributes, and offload the application quickly. A gateway tier aggregates many agents, applies central policy, performs tail sampling, and routes to one or more destinations.

Not every environment needs both. Serverless or managed platforms may export directly. Large estates benefit from separating local collection from regional or institutional routing. Define failure behavior and capacity for each tier.

## Make semantics a contract

Standardise service name, namespace, version, environment, region, owner, data class, and deployment identity. Adopt upstream semantic conventions before creating local attributes. Version organisational extensions and reject high-cardinality metric attributes such as request or customer identifiers.

Logs should preserve event time, severity, body, trace correlation, source identity, and schema. Traces need stable operation names and correct context propagation. Metrics need unit, temporality, aggregation intent, and bounded dimensions.

## Route without losing control

A central pipeline can send operational metrics to one backend, regulated logs to a regional store, sampled traces to several analysis systems, and an audit copy to durable storage. Routing policy should be based on declared attributes with tested defaults. Unknown classifications should fail visibly rather than fall into an unrestricted destination.

Use memory limiting, batching, queued retry, and backpressure controls. Collector queues are not automatically durable; if loss is unacceptable, place a durable transport or storage boundary in the path. Monitor accepted, refused, dropped, and failed-export counts plus queue size and processing latency.

## Understand backend compatibility

Microsoft Azure Monitor, AWS CloudWatch and X-Ray, Splunk Observability Cloud, Datadog, Dynatrace, and Elastic all provide supported OpenTelemetry paths, but the paths differ. Some accept native OTLP endpoints; some recommend a vendor distribution or agent for enrichment; signal coverage, protocol, authentication, metadata, and product-feature parity vary.

Therefore the portability contract should be “standards-based instrumentation with controlled translation,” not “all data looks identical everywhere.” Test a representative dataset against each destination and preserve raw semantic meaning before applying vendor-specific mapping.

## Production checklist

Validate SDK lifecycle, context propagation, collector availability, TLS and authentication, resource identity, sensitive-data removal, cardinality, sampling, retry, destination limits, cost, and pipeline self-observability. Test destination loss and configuration rollback. A vendor-neutral platform is credible when teams can change routing centrally without reinstrumenting every application.
