---
title: Evolve event contracts without breaking consumers
author: Dhruv Doshi
date: 2023-02-01
reviewed: 2026-07-28
status: published
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

## Separate event types

A **domain event** records a business fact such as `InvoiceIssued`. An **integration event** is the stable representation intentionally shared outside the owning boundary. A **command** asks another component to perform work and may be refused. Mixing these meanings makes ownership unclear and encourages consumers to depend on internal state transitions.

Publish only facts for which the producer is authoritative. If a service copies an event from another domain and republishes it as its own fact, consumers may no longer know which source to trust.

## Define delivery behavior

Document partition key, ordering scope, retention, retry behavior, duplicate expectations, maximum payload, and dead-letter handling. Ordering across a whole topic is expensive and often unnecessary; ordering per account or aggregate is usually more useful. Changing the partition key can change both ordering and load distribution, so treat it as a contract change.

Consumers should persist their processing checkpoint with the resulting state change where possible. If they acknowledge first and write later, a crash can lose work. If they write first and acknowledge later, duplicates are expected and processing must be idempotent.

## Govern without centralising every change

Give each contract an owner and machine-readable schema. Automated compatibility checks should run in producer CI, while semantic review is required for changes to meaning, units, identifiers, privacy classification, or lifecycle. Maintain a consumer registry based on actual subscriptions and declared ownership.

## Migration checklist

Before changing an event, identify consumers and replay jobs, classify the change as additive or breaking, publish examples, test old and new schemas against representative records, define a dual-publish window, observe consumer migration, and specify removal criteria. After retirement, delete obsolete permissions, topics, transformations, and monitoring so the old contract does not remain an unowned production surface.
