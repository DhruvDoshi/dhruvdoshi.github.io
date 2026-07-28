---
title: Microsoft 365 audit data in an OpenTelemetry pipeline
author: Dhruv Doshi
date: 2026-05-01
reviewed: 2026-07-28
status: published
topic: Observability
categories: [Microsoft 365, OpenTelemetry, Audit Logs, Data Engineering]
---

Microsoft 365 audit data is valuable operational and security telemetry, but Microsoft 365 is not itself a general native OTLP source. The reliable architecture is to retrieve tenant audit records through supported Microsoft APIs, preserve their audit semantics, normalise them into an organisational event contract, and then route them through an OpenTelemetry-compatible pipeline.

## Understand the source boundary

The [Office 365 Management Activity API](https://learn.microsoft.com/en-us/office/office-365-management-api/office-365-management-activity-api-reference) exposes user, administrator, system, and policy activity from workloads including Microsoft Entra ID, Exchange, SharePoint, and other Microsoft 365 services. Collection requires unified audit logging, Microsoft Entra application identity, appropriate permissions, and subscriptions to relevant content types.

The API returns tenant-specific content blobs. A collector service can poll for available content or receive webhook notifications and then download the records. The cursor, subscription state, and downloaded content identifiers need durable storage so retries do not create gaps or uncontrolled duplicates.

## Preserve audit semantics

The Microsoft common schema includes creation time, record type, operation, user identity, client address, object identity, result, workload, and service-specific fields. Do not flatten everything into an unstructured message. Map stable common fields to a governed log schema and retain the original record or source-specific attributes where policy permits.

Useful OpenTelemetry resource attributes describe the collector service, tenant boundary, cloud, region, and environment. Log record attributes can hold workload, operation, result, record type, user type, and source event identifier. Event time must come from the audit record; observed time should record when the pipeline received it.

## Design for delay and duplication

Audit content can arrive after the activity occurred and may not be ordered globally. Use source identifiers and content metadata for deduplication. Maintain a look-back window to recover late content, but bound it and monitor duplicate rate. Do not use arrival time as the business event time.

Track the most recent successfully retrieved window per tenant and content type. Alert on subscription failure, authorization change, webhook silence, polling lag, content-download failure, parsing errors, and unexpected volume changes.

## Apply tenant and regional policy

Credentials, checkpoints, buffers, and output records must remain tenant-scoped. Route records using declared geography and data classification before they reach a shared backend. Redact or tokenize personal identifiers only according to investigation and regulatory requirements; excessive redaction can make audit data unusable, while unrestricted replication creates privacy risk.

## Microsoft OpenTelemetry support is adjacent

Azure Monitor supports OpenTelemetry instrumentation and OTLP ingestion, and Microsoft publishes an OpenTelemetry distribution for application telemetry. Those capabilities can observe the collection service and receive its normalised output, but they do not replace the Microsoft 365 audit extraction API.

The resulting design is a bridge: supported Microsoft 365 extraction on one side, an explicit audit-event contract in the middle, and vendor-neutral routing on the other. Keeping those boundaries clear makes completeness, security, and backend portability independently testable.
