---
title: AWS support for OpenTelemetry with ADOT and CloudWatch
author: Dhruv Doshi
date: 2026-05-15
reviewed: 2026-07-28
status: published
topic: Observability
categories: [AWS, ADOT, OpenTelemetry, CloudWatch, X-Ray]
---

AWS supports OpenTelemetry through several paths: the AWS Distro for OpenTelemetry, the CloudWatch agent, upstream or custom collectors, and CloudWatch OTLP endpoints. The right choice depends on signal coverage, AWS-specific enrichment, operational ownership, and the degree of vendor-neutral control required.

## ADOT and upstream OpenTelemetry

The [AWS Distro for OpenTelemetry](https://docs.aws.amazon.com/xray/latest/devguide/xray-services-adot.html) packages upstream OpenTelemetry components that AWS tests, optimises, secures, and supports. It includes SDK and auto-instrumentation options plus collector distributions for AWS environments.

ADOT can send traces and metrics to AWS destinations including X-Ray, CloudWatch, Amazon Managed Service for Prometheus, and OpenSearch. Because it remains based on OpenTelemetry APIs and OTLP, an organisation can keep common instrumentation while selecting AWS or non-AWS exporters at a collector boundary.

## Choose an ingestion path

AWS documents several [CloudWatch OpenTelemetry paths](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch-OTLPGettingStarted.html):

- the CloudWatch agent for integrated logs, metrics, traces, resource correlation, and Application Signals;
- an upstream OpenTelemetry Collector for a standard pipeline;
- a custom collector build when AWS components and additional processors are required;
- collectorless ADOT SDK export for supported signals and constrained environments.

These paths are not feature-equivalent. Collectorless operation reduces infrastructure but may omit log support or resource correlation available through the agent. An upstream collector preserves control but may require explicit AWS enrichment and configuration.

## Authenticate with workload identity

Use IAM roles for EC2, ECS, EKS, or Lambda rather than static access keys. Grant only the actions required by the chosen OTLP or service exporter. When a central gateway serves several accounts, preserve source account, region, resource, cluster, and service identity and prevent one tenant from selecting another tenant’s credentials or destination.

## Preserve portable semantics

Adopt OpenTelemetry semantic conventions and standard resource attributes at instrumentation time. Apply AWS resource detection in the collector so EC2, ECS, EKS, or Lambda context is added from trusted environment data. Keep vendor-specific attributes additive; do not replace portable service identity with an AWS-only dimension.

## Operate and test the path

Monitor collector queueing, refused telemetry, exporter errors, throttling, credential failure, and CloudWatch or X-Ray ingestion limits. Confirm metric temporality and units after export, trace-service mapping, log correlation, and retention. Test region loss and destination throttling under load.

## Migration checklist

Start with one representative service and record its expected traces, metrics, logs, resource attributes, and correlations before changing the pipeline. Run the AWS destination beside the existing backend long enough to compare service maps, alert inputs, sampling decisions, and ingestion cost. Then rehearse credential rotation, collector restart, endpoint failure, and rollback.

For EKS or multi-account estates, decide explicitly where agents end and shared gateways begin. Keep account and region boundaries visible in configuration, dashboards, and access controls. A migration is complete only when teams can diagnose missing telemetry, not merely when data appears in CloudWatch.

AWS provides strong OpenTelemetry integration, but portability still depends on the architecture an organisation owns: standard APIs in applications, explicit semantic contracts, controlled enrichment, and collectors that can route to more than one destination when required.
