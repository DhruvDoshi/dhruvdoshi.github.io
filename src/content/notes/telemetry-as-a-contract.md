---
title: Treat telemetry as a production contract
author: Dhruv Doshi
date: 2026-09-01
status: scheduled
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
