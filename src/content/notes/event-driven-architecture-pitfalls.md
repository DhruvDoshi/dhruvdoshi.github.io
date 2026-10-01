---
title: "Event-driven architecture pitfalls and how to avoid them"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Distributed systems
categories: [Distributed Systems, Event-Driven Architecture, Messaging]
---

Event-driven architecture has a seductive pitch: services decoupled in time and space, reacting to facts instead of calling each other. The pitch is not wrong. But the failure modes of event-driven systems are quieter and stranger than the failure modes of request-response systems, and teams adopt the pattern for the decoupling while underestimating everything that replaces the coupling: schema governance, ordering assumptions, duplicate delivery, poison messages, and debugging across service boundaries. This note is the list of things I wish every team settled before their first production event.

## Pick your event style deliberately: notification, state transfer, or sourcing

Three different patterns hide under "we publish events," and mixing them up causes most of the confusion.

**Event notification** says something happened: `OrderPlaced { orderId: "ord_123" }`. The consumer calls back to the source of truth for details. This keeps events tiny and avoids duplicating state, but it reintroduces temporal coupling — the consumer needs the producer's API to be up, and at scale every consumer's callback becomes load on the producer. Use notifications when the payload would be large or sensitive, or when consumers need the absolute latest state rather than the state at event time.

**Event-carried state transfer** puts the needed data in the event: `OrderPlaced { orderId, customerId, items[], total, shippingAddress }`. Consumers work from the event alone, which is genuinely decoupled — no callback, no temporal coupling. The cost is duplication: the same facts now live in every consumer's store, and schema changes ripple everywhere. Use this when consumers need autonomy and the payload is bounded and stable.

**Event sourcing** stores the event log as the source of truth and derives state by replaying it. This is a persistence architecture, not a messaging choice, and adopting it means committing to versioned events forever, upcasting old events, and explaining to every new hire why the "database" is a log. Use it when auditability of every state change is a requirement or when temporal queries ("what did we know at time T?") are core to the domain — not as a default.

**The rule:** pick one style per event stream and document the choice. The common failure: a notification that accretes fields until it is state transfer without versioning discipline, or "event sourcing" that is just publishing events from a CRUD service with no replay story.

## Schema evolution and the "stringly-typed JSON" trap

Untyped JSON events feel fast and become expensive. Without a schema registry (or at minimum a checked-in schema with contract tests), every producer change is a potential consumer outage, discovered in production. "Stringly-typed" payloads — dates as ambiguous strings, money as floats, enums as free text, nested objects with no documented shape — turn every consumer into a defensive parser and every incident into a guessing game.

**Minimum viable discipline:** a schema registry with compatibility checks (backward compatibility as the default rule: new consumers read old events), required fields that stay required, and semantic versioning of event types. Producers register schemas in CI; the build fails if a change breaks compatibility. This is not bureaucracy — it is the compile step that event-driven systems otherwise lack.

**Evolution rules that hold up:** only add optional fields; never repurpose a field's meaning; never change a field's type in place (add a new field, deprecate the old); keep deprecated fields populated for at least two consumer deploy cycles, or whatever your slowest consumer needs. And version the event type in the envelope (`OrderPlaced.v2`), not just the payload, so consumers can route on version explicitly.

## Ordering guarantees: what brokers actually promise

Teams routinely assume global ordering and get per-partition ordering at best. Know exactly what your broker guarantees: Kafka orders within a partition, not across partitions; most managed queues offer FIFO only on specific queue types and at lower throughput; SNS-style fan-out makes no ordering promises at all. If your consumer assumes "event B always arrives after event A" and the two landed on different partitions, you have a latent bug that manifests under load — the worst kind.

**Design for unordered delivery.** Consumers should handle out-of-order events: carry a sequence number or version per aggregate in the event, and have the consumer ignore stale events (`if event.version <= current_version: skip`). For the cases where order genuinely matters (a state machine's transitions), route all events for one aggregate to the same partition via a partition key — and accept the hot-partition risk that comes with it. Never rely on wall-clock timestamps for ordering across producers; clocks skew, and two events stamped in the wrong order will eventually arrive.

## Exactly-once is a lie — idempotent consumers are the real answer

Brokers promise at-least-once in practice. Exactly-once exists in narrow, expensive configurations, and even then covers only the broker handoff — not your consumer's side effects. The moment your consumer writes to a database, calls an API, or sends an email, exactly-once is gone. Design for duplicates from day one.

**Idempotency is a consumer contract.** Every consumer must handle the same event arriving twice (or five times) with the same final effect. The standard mechanisms: idempotency keys from the event ID stored in the consumer's database, checked in the same transaction as the state update; natural idempotency where the operation is inherently safe to repeat (setting a value rather than incrementing); and deduplication windows for side effects that cannot be transactional (emails, webhooks — track sent IDs and check before sending).

```python
def handle_order_placed(event):
    with db.transaction():
        if processed_events.exists(event.id):
            return  # duplicate delivery — safe to ignore
        order = create_order(event.payload)
        processed_events.insert(event.id)
    # side effects outside the txn use their own dedupe
    send_confirmation_email(order, dedupe_key=event.id)
```

**Watch the ordering/duplication interaction.** Retries plus ordering guarantees create a specific trap: a consumer that processes event 5, crashes before committing the offset, then reprocesses events 3–5 on restart. Your idempotency keys must survive this, which means they live in the consumer's own store, not in broker offsets.

## Poison messages and dead-letter discipline

A poison message is an event no consumer can process — malformed payload, a bug in the handler, a downstream dependency that rejects it permanently. Without a policy, the consumer retries forever, blocking the partition (in ordered consumers) or burning resources while the real backlog grows behind it.

**The discipline:** bounded retries with backoff, then the message goes to a dead-letter queue with full context — original payload, headers, retry count, the error, the consumer version that failed. The DLQ is not a trash can; it is a work queue with an owner, a dashboard, and an alert. Define the reprocessing story up front: replay after a fix, with a tool rather than manual broker surgery, and a policy for messages that can never be reprocessed (quarantine and reconcile manually).

**Distinguish poison from outage.** A consumer failing on every message signals a downstream outage, not poison — DLQ-ing thousands of messages during someone else's incident creates a reprocessing nightmare. Circuit-break the consumer (stop polling while the downstream is down); retry policy should distinguish single-message failure from fleet-wide failure.
## Event fan-out storms and thundering retries

One event in, N consumers out — that is the point. But fan-out multiplies every failure. A producer publishes a burst (a backfill, a retry of a failed batch, a marketing import), and every consumer scales simultaneously, hammering shared dependencies: the same database, the same third-party API, the same downstream service. The producer's "small" burst becomes a distributed denial of service against your own infrastructure.

**Defenses, layered.** Consumers need independent rate limits and bulkheads — one consumer's surge must not starve others of shared resources. Retry policies need jitter and backoff with decorrelation; synchronized retries from N consumers are a thundering herd with extra steps. For known-large bursts, producers should publish at a controlled rate or mark the batch so consumers can switch to a slower path. Quota the producer side too: an unbounded publish loop from a buggy producer fills retention and pages everyone downstream.

**Mind the retry amplification math.** If 10 consumers each retry a failing event 5 times against a struggling downstream, it sees 50x the original load — from one event. Backoff with jitter is not polish; it keeps a partial outage from becoming total. Cap retry budgets per event, not just per attempt.

## Debugging across services: correlation IDs and trace context

In a request-response world you follow a request through logs. In an event-driven world the "request" shattered into a dozen events across six services hours ago. Without propagated context, debugging is archaeology.

**Propagate context in the event envelope, not the payload.** Every event carries: a correlation ID (the business transaction — the order, the user signup — stable across the whole flow), a causation ID (which event caused this one, building the causal chain), and trace context (W3C traceparent/tracestate for distributed tracing). Producers set them; consumers propagate them into every event they emit and every log line they write. This is a platform-level contract — enforce it in shared libraries, not by asking every team nicely.

**Make the causal chain queryable.** Correlation IDs in logs let you grep; a trace backend lets you see — emit spans for consume-process-publish cycles so the flow renders as a trace. Keep a per-event audit log for critical flows: which consumer processed which event version, when, with what outcome. When the business asks "why is this order in this state," the answer should be a query, not a war room.

## Versioning events without breaking consumers

Events are a public API with many clients you cannot coordinate deploys with. Version accordingly.

**The practical rules:** additive changes only within a major version (new optional fields are fine; renames, type changes, and semantic changes are not). Publish new versions as new event types or versioned topics (`orders.v2`) rather than mutating in place, so consumers migrate on their schedule. Support at least two versions in flight — the old and the new — and define who owns the dual-publish or translation layer (usually the producer, via an upcaster). Set a sunset policy with a date, communicated to consumer owners, not "we'll remove v1 eventually."

**Consumer-side robustness:** Ignore unknown fields, never require optional fields, and fail loudly on unknown event versions rather than silently misprocessing. A consumer that crashes on an unknown version is annoying; one that misinterprets it is dangerous — route unknown versions to the DLQ with a clear error.

## The "distributed monolith via events" anti-pattern

Events do not automatically decouple you. If service A publishes an event, and services B, C, D must all process it successfully for the business operation to complete, and a change to A's event requires lockstep deploys of B, C, and D — you have a distributed monolith with extra latency. The telltale signs: consumers that cannot tolerate the producer being down (temporal coupling wearing an events costume), "events" that are really RPCs with a broker in the middle, and deploy trains where six teams ship together because the event contract changed.

**The test:** can you deploy the producer Tuesday and consumers Thursday without breakage? Can a consumer be down an hour without the operation failing? If not, the events are ceremony without substance — choose genuinely independent consumer semantics or admit the services are one deployable unit and merge them.

## Temporal coupling sneaking back in: request-reply over events

Request-reply over a broker — publish a "request" event, wait for a "reply" event with a matching correlation ID — recreates synchronous coupling with worse tooling. You get timeouts, correlation state to manage, and none of the load-balancing, deadline propagation, or error semantics that RPC frameworks give you. Teams reach for it to "stay event-driven" while needing an answer now.

**Use request-reply over events only when** the reply is genuinely asynchronous (minutes to hours — an approval, a batch process) and the requester is built to wait (a saga step, a workflow timer). Need an answer in seconds? Use synchronous RPC and be honest about the coupling. A broker doesn't make a synchronous dependency asynchronous; it makes it harder to debug.

## Retention, replay, and the GDPR deletion tension

Event logs are replayable history — which collides with the right to be forgotten. If your events carry personal data and your retention is "forever for replay," you have a compliance problem wearing an architecture hat.

**Resolve it deliberately.** Options: keep personal data out of events (notification style — events carry IDs, consumers fetch current state, and deletion at the source of truth propagates naturally); encrypt personal fields with per-subject keys and destroy the key on deletion request (crypto-shredding — effective but operationally heavy); or define a compaction/deletion process for the log itself (feasible on some brokers, painful on an immutable event-sourced store). What does not work is discovering this during your first deletion request. Decide before the first production event, document it, and make sure legal has seen the document.

**Retention is also an operational decision.** Long retention enables replay and disaster recovery at the cost of storage and slower reprocessing; short retention bounds cost but a lagging consumer loses data permanently. Set retention per stream from the slowest legitimate consumer plus margin — not one global default.

## Decision checklist before going event-driven

Answer these before the first topic is created:

1. **Do we need temporal decoupling?** If producers and consumers must both be up for the operation to succeed, events add complexity without decoupling — use RPC.
2. **Which event style?** Notification, state transfer, or sourcing — chosen per stream, documented, with the trade-offs above accepted explicitly.
3. **What is the schema governance story?** Registry, compatibility rules, CI checks — before production, not after the first incident.
4. **What are the ordering requirements?** Stated per consumer, with partition keys where order matters and stale-event handling where it doesn't.
5. **What is the duplicate-handling contract?** Idempotent consumers designed and tested, not assumed.
6. **What is the poison-message policy?** Retry budgets, DLQ ownership, reprocessing tooling.
7. **Can we debug it?** Correlation/causation IDs and trace context in the envelope, propagated by shared libraries.
8. **What is the versioning and sunset policy?** Two versions in flight, owner of translation, communicated sunset dates.
9. **What is the deletion story?** Personal data handling decided with legal before the first event.
10. **Can consumers deploy independently?** If not, you are building a distributed monolith — reconsider.

## Closing

Event-driven architecture done well is genuinely powerful: autonomous services, natural audit trails, room to grow. Done carelessly it is the hardest kind of distributed system to debug — silent failures, ordering bugs that appear only under load, schema changes detonating across team boundaries. The pattern rewards upfront discipline disproportionately: schema governance, idempotent consumers, propagated context, and explicit versioning are cheap on day one and ruinous to retrofit.
