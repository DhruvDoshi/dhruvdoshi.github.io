---
title: Dynatrace support for OpenTelemetry and native OTLP
author: Dhruv Doshi
date: 2026-07-01
reviewed: 2026-07-28
status: published
topic: Observability
categories: [Dynatrace, OpenTelemetry, OTLP, Observability]
---

Dynatrace supports OpenTelemetry through native OTLP API endpoints, the upstream OpenTelemetry Collector, and a Dynatrace collector distribution. It also supports mixed environments where OpenTelemetry instrumentation and Dynatrace OneAgent capabilities coexist.

## Choose among three ingestion paths

Dynatrace’s [OpenTelemetry documentation](https://docs.dynatrace.com/docs/ingest-from/opentelemetry) identifies three principal approaches:

- direct OTLP export for simple environments without central processing;
- a standard OpenTelemetry Collector when an organisation already operates upstream collectors;
- the Dynatrace OTel Collector for a supported distribution and Dynatrace-oriented configuration.

The choice affects who owns scaling, processing, enrichment, configuration, and upgrade support. A regional gateway is usually preferable when telemetry needs redaction, sampling, routing, or protocol conversion.

## Account for protocol details

Dynatrace’s native OTLP endpoints accept standard signal paths for traces, metrics, and logs. The [OTLP endpoint reference](https://docs.dynatrace.com/docs/ingest-from/opentelemetry/otlp-api) documents HTTP/protobuf export, API-token authorization, signal-specific scopes, endpoint formats, and current limitations. A collector can receive OTLP over gRPC internally and export OTLP/HTTP to Dynatrace.

Do not assume a successful HTTP response means every record was accepted. Observe partial-success responses and backend ingest metrics, and validate rejected or transformed data.

## Preserve semantic meaning

Dynatrace maps OpenTelemetry semantic conventions into its semantic model. Use current upstream attributes for service, cloud, messaging, database, HTTP, and deployment identity. Apply vendor-specific attributes additively only where they improve a required topology or analysis feature.

Metric temporality and histogram representation need particular testing. Backend mapping may not support every aggregation form identically. Validate the queries and objectives that depend on those metrics before migration.

## Design the production gateway

Configure batching and compression, memory limits, queued retry, authentication, TLS, sensitive-data processing, and a bounded failure policy. Monitor incoming records, dropped data, request size, exporter failures, queue saturation, and end-to-end latency.

Use distinct tokens and endpoints by environment and tenant. Restrict ingest scopes to the required signals. When routing to both Dynatrace and another backend, measure the additional collector capacity and do not assume both exporters fail or recover at the same rate.

## Verify the integration

Build a repeatable fixture that emits successful and failed spans, correlated logs, counters, histograms, and the resource attributes used to identify a service. Check the fixture after every collector, semantic-convention, or backend upgrade. Verify not only ingestion but also the service topology, error classification, units, aggregation, dashboard queries, and alert conditions.

During migration, compare OpenTelemetry data with any OneAgent-derived view and document which features depend on proprietary enrichment. This prevents an accidental promise that an open ingestion path and a vendor-specific agent produce identical context. It also makes later portability decisions measurable: teams know which capabilities move with OTLP and which require a replacement design.

Dynatrace provides first-class OpenTelemetry ingestion while retaining proprietary enrichment and analytics. A sound architecture uses the open path deliberately and documents where Dynatrace-specific behavior is required for the desired operational experience.
