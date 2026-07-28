---
title: Datadog support for OpenTelemetry and OTLP ingestion
author: Dhruv Doshi
date: 2026-06-15
reviewed: 2026-07-28
status: published
topic: Observability
categories: [Datadog, OpenTelemetry, OTLP, Observability]
---

Datadog accepts OpenTelemetry data through several integration paths, but the resulting product capabilities are not identical. A design should choose explicitly between the Datadog Agent, an OpenTelemetry Collector with Datadog components, and direct OTLP intake.

## Agent and collector paths

The Datadog Agent can receive OTLP traces and metrics over gRPC or HTTP, and current supported Agent versions also receive OTLP logs. This allows applications to use OpenTelemetry SDKs while retaining local Datadog enrichment and integration.

An upstream collector with the Datadog exporter—or Datadog’s collector distribution—creates a more explicit pipeline boundary. It is appropriate when teams require central processors, multi-destination routing, or an existing collector operating model.

Datadog also provides [direct OTLP intake endpoints](https://docs.datadoghq.com/opentelemetry/setup/otlp_ingest/) for environments where a collector or agent is impractical. Datadog currently recommends the Agent or Collector for production workloads because they provide metadata enrichment, normalization, and centralized sampling; direct intake has documented limits and feature differences.

## Understand product compatibility

OTLP ingestion does not automatically enable every Datadog feature. Some proprietary security, profiling, runtime, or ingestion capabilities rely on Datadog-specific instrumentation or local Agent behavior. Review the current feature-compatibility matrix for each signal and language rather than assuming parity.

Keep the application on OpenTelemetry APIs where portability is required. Add Datadog-specific instrumentation only for a named capability whose value justifies the coupling.

## Configure identity and mapping

Set stable `service.name`, environment, version, deployment, host, container, and cloud resource attributes. Confirm how they map to Datadog service, host, unified service tagging, and infrastructure views. Missing host metadata can affect infrastructure correlation even when OTLP intake succeeds.

Use API keys only at the exporter or Agent boundary and load them from a protected secret mechanism. Applications should send to a local trusted endpoint where possible rather than sharing backend credentials.

## Validate limits and failure behavior

Direct OTLP endpoints enforce payload-size limits that vary by signal. Batching, compression, and flush behavior need to stay within those limits. Monitor exporter rejections, partial success, throttling, queue capacity, and dropped telemetry.

Test metric types and temporality, histogram mapping, log severity, trace sampling, resource correlation, and redaction. Compare backend results with a representative golden signal set after every Agent, collector, or exporter upgrade.

Datadog has meaningful OpenTelemetry interoperability, but vendor neutrality still comes from owning the signal contract and routing boundary. The backend can enrich and analyse standard telemetry without becoming the only place the organisation knows how that telemetry is produced.
