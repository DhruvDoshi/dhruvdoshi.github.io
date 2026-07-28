---
title: Evolve event contracts without breaking consumers
author: Dhruv Doshi
date: 2026-10-16
status: scheduled
topic: Distributed systems
categories: [Event Driven Architecture, Kafka, Schema Evolution]
---

An event is a public record of something that happened. Once multiple consumers depend on it, its schema, meaning, ordering, and delivery behavior form a contract—even if the producer never wrote that contract down.

## Specify meaning before shape

Name an event in past tense and define the business fact it represents. `CustomerAddressChanged` is more stable than `UpdateCustomerCache`. Document who owns the fact, when it is emitted, the identity of the subject, and whether consumers may use it as a source of truth.

An envelope typically includes an event identifier, type, schema version, occurrence time, producer, subject identifier, and trace context. Business data belongs in the payload. Avoid copying large mutable aggregates into every event unless consumers genuinely need the snapshot.

## Prefer additive evolution

Adding an optional field is usually safer than changing the type or meaning of an existing one. Consumers should tolerate fields they do not recognise. Required-field removal, enum narrowing, identifier reinterpretation, or a change in units is a new contract even if the serialized schema still validates.

Compatibility tooling can catch structural breaks. It cannot decide whether `total` changed from pre-tax to post-tax. Pair a schema registry with ownership, examples, semantic review, and consumer tests. Apache Kafka’s [design documentation](https://kafka.apache.org/documentation/#design) explains the log and consumer model underlying many event systems; delivery semantics still depend on the application’s processing boundaries.

## Make migration explicit

For a breaking change, publish a new event type or version, dual-write for a bounded period, and measure consumer migration. Do not remove the old contract because its topic “looks quiet”; confirm registered consumers and replay jobs have moved. State the support window and rollback path.

Ordering should be promised only within a defined key and partition strategy. Consumers must handle duplicates and delayed events. Include enough identity to make processing idempotent, and define how corrections or tombstones work.

## Treat replay as a production feature

Reprocessing historical events can overload dependencies or apply obsolete logic. Version consumer behavior, isolate replay capacity, preserve original timestamps, and distinguish replay traffic in telemetry. Test schemas against representative historical records before deployment.

Event-driven architecture reduces temporal coupling, not organisational responsibility. A durable event contract gives producers freedom to change implementation while giving consumers a fact they can continue to trust.
