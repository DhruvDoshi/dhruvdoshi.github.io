---
title: Elastic support for OpenTelemetry and managed OTLP ingestion
author: Dhruv Doshi
date: 2026-07-15
reviewed: 2026-07-28
status: published
topic: Observability
categories: [Elastic, OpenTelemetry, OTLP, Observability]
---

Elastic supports OpenTelemetry through managed OTLP ingestion, the Elastic Distribution of OpenTelemetry, and standard SDK or collector pipelines. Organisations can send traces, metrics, and logs while preserving OpenTelemetry semantic conventions and resource attributes.

## Managed OTLP endpoint

Elastic Cloud provides a [managed OTLP endpoint](https://www.elastic.co/docs/solutions/observability/get-started/quickstart-elastic-cloud-otel-endpoint) for Elastic Serverless and Elastic Cloud Hosted. OpenTelemetry SDKs or collectors can send OTLP with API-key authorization, while Elastic operates ingestion, processing, scaling, and storage.

The managed endpoint stores OpenTelemetry data without requiring an application-specific Elastic exporter. This provides a direct standards-based path for workloads that do not need an organisation-operated gateway.

## Elastic Distribution of OpenTelemetry

EDOT packages collectors, SDK options, and configuration for Elastic environments while remaining based on upstream OpenTelemetry. It is useful for Kubernetes, host metrics, application instrumentation, and pipelines that need local processing before export.

An upstream collector is still a valid choice when the organisation has its own distribution, release process, or multi-vendor routing requirements. Evaluate support boundaries: an Elastic distribution may provide tested integration and faster access to Elastic features, while an upstream distribution may reduce vendor-specific operating assumptions.

## Preserve schema and query behavior

Use OpenTelemetry semantic conventions consistently and test how resource and event attributes appear in Elastic data views. Stable service, environment, version, deployment, host, cloud, and Kubernetes attributes enable correlation without rewriting instrumentation.

High-cardinality fields can increase storage and query cost. Keep metric attributes bounded and choose index, retention, and data-tier policy according to signal value. Security and audit logs may need different lifecycle and access controls from application traces.

## Authenticate and route safely

Store Elastic API keys at the collector or workload-secret boundary, scope them to the required destination, and rotate them. Prefer regional gateways when traffic requires classification, redaction, buffering, or multiple destinations. Use TLS and restrict local receivers to intended networks or workload identities.

## Verify end-to-end behavior

Send representative traces, metrics, logs, exemplars, and resource attributes through the proposed path. Confirm timestamp handling, span relationships, log severity, metric temporality, histogram queries, service correlation, ingest latency, partial failure, and retention.

Monitor collector health and Elastic intake together. A healthy collector exporter does not prove that indexed data is complete or queryable. Maintain golden telemetry fixtures and run them after distribution, pipeline, or backend upgrades.

Elastic’s OpenTelemetry support can preserve a portable instrumentation boundary while providing Elastic-native storage and analysis. The architecture remains vendor-neutral when semantic ownership, processing policy, and the ability to route elsewhere stay outside the backend.
