---
title: Use data contracts to make ownership executable
author: Dhruv Doshi
date: 2024-12-01
status: published
topic: Distributed systems
categories: [Data Contracts, Data Platforms, Governance]
---

A data contract makes the expectations between a data producer and its consumers explicit. It covers more than column names: meaning, ownership, quality, timeliness, compatibility, access, and operational response all belong to the interface.

## Start with a named data product

Identify the dataset, event stream, or API output as a product with an accountable owner. Define the business entities and measures in plain language. If “active customer” has three definitions, a schema registry cannot resolve the disagreement.

The contract should include:

- field types, nullability, units, and accepted values;
- keys, uniqueness, ordering, and partition behavior;
- freshness, completeness, and availability objectives;
- classification, retention, residency, and access rules;
- compatibility policy and deprecation period;
- owner, support channel, and incident process.

## Validate near the producer

Generate or validate schemas in the producer’s delivery pipeline. Test critical semantic rules against representative data. Detect contract violations before publication where possible, and quarantine or mark invalid records when blocking the entire stream would cause more harm.

Consumers should validate assumptions too. Contract testing is strongest when registered consumers can express the fields and behavior they depend on. This turns an apparently harmless producer change into visible impact before deployment.

The [OpenAPI Specification](https://spec.openapis.org/oas/latest.html), [AsyncAPI Specification](https://www.asyncapi.com/docs/reference/specification/latest), and schema systems such as Avro each describe structural interfaces for different transports. A data contract uses those mechanisms but also carries semantic and operational commitments.

## Change through negotiation

Prefer additive, backward-compatible changes. For a breaking change, identify consumers, publish a migration path, run versions in parallel for a bounded period, and measure adoption. Do not keep unused fields forever because ownership is unclear.

Version meaning, not just shape. Changing currency, time zone, aggregation window, or source logic can break a consumer without changing a type.

## Operate the relationship

Monitor freshness, volume, schema conformance, distribution shifts, and access failures. Route alerts to the owner able to act. Review recurring exceptions as product feedback rather than treating them only as consumer misuse.

A contract does not eliminate coordination. It makes coordination concrete, testable, and proportional to the impact of change.
