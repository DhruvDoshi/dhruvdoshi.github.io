---
title: Design APIs for safe retries
author: Dhruv Doshi
date: 2026-10-01
status: scheduled
topic: Distributed systems
categories: [API Design, Idempotency, Distributed Systems]
---

Networks fail in ambiguous ways. A client can time out after the server commits a change but before the response arrives. Retrying may be necessary, yet repeating the operation may charge a card twice, create two orders, or send duplicate notifications. Safe retry behavior must be part of the API contract.

## Separate method semantics from business semantics

HTTP defines PUT, DELETE, and safe methods such as GET as idempotent at the method level; repeating the same request should have the same intended effect. POST is not generally idempotent. The current semantics are defined in [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#name-idempotent-methods).

Business operations often still need an explicit idempotency mechanism. A payment creation endpoint may accept an idempotency key representing one client intent. The server stores the key, a fingerprint of relevant request fields, the operation state, and the eventual response.

## Define key behavior

The contract should specify:

- who generates the key and its uniqueness scope;
- how long the server retains it;
- whether reuse with a different payload is rejected;
- what concurrent requests with the same key receive;
- which response, including errors, is replayed;
- whether the key covers one resource or a wider workflow.

Persist the key and state change atomically when possible. A cache written after the database commit recreates the failure window the key was meant to close.

## Model incomplete work

Long-running operations need states such as accepted, in progress, succeeded, and failed. A retry should return or reference the existing operation rather than starting another. If downstream side effects are asynchronous, propagate a stable operation identifier and make each consumer idempotent as well.

Exactly-once delivery is not a property an HTTP endpoint can promise across arbitrary dependencies. The practical goal is an effectively-once business outcome built from durable identifiers, deduplication, transactional boundaries, and reconciliation.

## Make retry policy observable

Record idempotency-key collisions, duplicate attempts, retention misses, and incomplete operations. Do not log raw keys if they expose sensitive client information. Test timeouts at each boundary, including after commit and before response.

Retries are normal distributed-systems behavior. An API that documents and tests them is safer than one that assumes clients will call every operation exactly once.
