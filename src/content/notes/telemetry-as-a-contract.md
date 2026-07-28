---
title: Treat telemetry as a production contract
author: Dhruv Doshi
date: 2022-08-01
reviewed: 2026-07-28
status: published
topic: Observability
categories: [OpenTelemetry, Observability, Platform Engineering]
---

Telemetry is often added after a service is built: a few logs, default metrics, and traces sampled when something fails. At scale, that creates inconsistent names, missing context, uncontrolled cost, and dashboards that cannot answer operational questions. A better approach treats telemetry as an interface with owners and compatibility rules.

## Define the questions first

Begin with the decisions operators must make:

- Is the service meeting its user-facing objective?
- Which dependency or release changed the failure rate?
- Can a request be followed across trust and service boundaries?
- Which tenant, region, or operation is affected?
- Is telemetry loss hiding a production problem?

Signals should exist because they answer one of these questions. Collection without a use case produces volume, not observability.

## Standardise the envelope

Use consistent resource attributes for service identity, environment, version, region, and ownership. Define span names at stable operation boundaries rather than including unbounded identifiers. Logs should carry trace and span identifiers where available. Metrics need explicit units, aggregation intent, and cardinality limits.

The [OpenTelemetry semantic conventions](https://opentelemetry.io/docs/specs/semconv/) provide shared names for common operations and resources. Adopt them before inventing local vocabulary, then document the organisation-specific attributes that remain.

## Put governance in the pipeline

Validate telemetry during development and delivery. Tests can assert that critical spans exist, attributes avoid sensitive data, metric labels remain bounded, and schema changes are compatible. Collectors can enforce redaction, routing, sampling, and export policy centrally, but they cannot repair missing application context.

Version the contract. A renamed metric or attribute can break alerts, service-level indicators, cost reports, and incident tooling even when the application itself remains healthy. Deprecate names, observe consumer migration, and remove them deliberately.

## Operate the telemetry system

The telemetry pipeline is production infrastructure. Measure dropped spans, exporter failures, queue saturation, ingestion latency, and cost by signal and service. Define behavior during downstream failure: buffer within a bound, reduce sampling, or discard lower-value data before critical signals.

Telemetry becomes useful when teams can rely on its meaning. A vendor-neutral collection layer helps, but the deeper win is organisational: every service emits a predictable operational story, and every platform component preserves that story from process to query.

## Control cardinality and cost

Metric dimensions such as customer ID, request ID, URL, or error message can create an effectively unbounded number of time series. That increases ingestion cost and may make queries or alerts unusable. Define an allowlist of bounded dimensions and move high-cardinality investigation context into traces or structured logs.

Sampling is also a contract. Head sampling makes an early decision before the full trace is known; tail sampling can preserve errors or slow traces after observing the completed path but requires buffering and additional collector capacity. Document which traffic can be discarded and which signals—security decisions, critical transactions, or objective calculations—must remain complete.

## Protect data at collection

Telemetry can contain credentials, personal information, query text, or document contents. Classify attributes before release, redact as close to the source as possible, and enforce additional controls in the collector. Apply retention, residency, and access policy by data class rather than assuming every observability user should see every field.

Trace propagation across an external boundary needs an explicit trust decision. Accepting arbitrary baggage or trace identifiers can leak information or corrupt internal analysis. Validate permitted fields and create a new internal context when the boundary requires it.

## Test the failure path

Exercise collector loss, exporter throttling, unavailable backends, malformed payloads, and sudden cardinality growth. Application availability should not normally depend on synchronous telemetry export. Use bounded queues and define whether the process drops, spills, or reduces data when the pipeline is unhealthy.

## Review checklist

For each production service, verify stable resource identity, semantic operation names, trace-log correlation, bounded metric attributes, sensitive-data controls, schema ownership, pipeline health monitoring, and a documented sampling policy. Then take a real operational question—such as “which release increased checkout latency?”—and prove the signals can answer it without a custom forensic project.
