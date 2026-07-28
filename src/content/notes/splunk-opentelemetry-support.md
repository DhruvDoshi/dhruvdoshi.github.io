---
title: Splunk support for OpenTelemetry collection and OTLP
author: Dhruv Doshi
date: 2026-06-01
reviewed: 2026-07-28
status: published
topic: Observability
categories: [Splunk, OpenTelemetry, OTLP, Observability]
---

Splunk supports OpenTelemetry through the Splunk Distribution of the OpenTelemetry Collector, standard OTLP ingestion paths, and integrations with Splunk Observability Cloud and Splunk platform products. The main architectural decision is whether to use upstream components, Splunk’s supported distribution, or a layered combination.

## The Splunk collector distribution

Splunk’s distribution packages upstream collector components with default configuration, deployment tooling, receivers, processors, exporters, and Splunk-specific integrations. It can run in agent mode near hosts or workloads and gateway mode as an aggregation tier.

The distribution exposes standard OTLP receivers over gRPC and HTTP and can receive other formats needed during migration. This makes it possible to standardise application instrumentation before every legacy signal source has moved.

## OTLP inside the pipeline

Splunk documents an [OTLP exporter](https://help.splunk.com/en/splunk-observability-cloud/manage-data/splunk-distribution-of-the-opentelemetry-collector/get-started-with-the-splunk-distribution-of-the-opentelemetry-collector/collector-components/exporters/otlp-exporter) for traces, metrics, and logs. OTLP is useful both from applications to collectors and between agent and gateway tiers.

For production, configure TLS, authentication, batching, queued retry, memory limiting, and health endpoints. Expose receivers only on intended interfaces. A default collector configuration is a starting point, not an enterprise security boundary.

## Preserve resource identity

Apply OpenTelemetry semantic conventions for service identity and add deployment, environment, cloud, Kubernetes, and host attributes through trusted resource detectors. Splunk-specific enrichment may improve backend experiences, but portable attributes should remain intact so the same signal can be routed elsewhere.

Do not put unbounded values such as user or request identifiers into metric dimensions. Test how log severity, metric temporality, span status, and resource attributes appear after backend mapping.

## Size for failure conditions

Collector demand changes with receiver mix, enabled processors, batch size, cardinality, sampling, and export latency. Benchmark the actual configuration. Monitor accepted and refused records, queue utilisation, memory limiter action, dropped data, and failed exports.

An outage in Splunk Observability Cloud should not synchronously block instrumented applications. Use local offload, bounded retry, and an explicit data-loss policy. Add durable transport when particular audit or security events cannot be lost.

## Maintain a vendor-neutral boundary

Keep reusable receiver and processing policy separate from the final Splunk exporter where practical. Version the distribution, upstream component set, and configuration. Test upgrades against representative signal fixtures.

## Migration checklist

Capture a small golden dataset containing normal requests, errors, high-cardinality attributes, exemplars, and correlated logs. Send it through the proposed collector topology and compare the resulting Splunk fields, service identity, timestamps, units, and trace relationships with the source data. This catches semantic loss that a simple connectivity test cannot reveal.

Roll out by workload class rather than changing every producer at once. Define the owner of agent configuration, gateway capacity, Splunk access tokens, schema changes, and rollback. Record any Splunk-only processors or attributes as explicit dependencies so a future routing decision is based on evidence instead of an assumption of perfect portability.

Splunk’s distribution can reduce operational integration work, while standard OpenTelemetry APIs and OTLP preserve flexibility. The combination works best when teams know which layer is upstream-compatible, which is Splunk-specific, and which operational guarantees they own.
