---
title: "Exactly-once semantics in streaming"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Data engineering
categories: [Data Engineering, Stream Processing, Kafka]
---

Ask a streaming team whether their pipeline is exactly-once and you will usually get a confident yes followed by a description of a single config flag. That confidence is almost always misplaced. Exactly-once is not a property of a producer setting or a consumer setting. It is a property of the entire system — producer, broker, stream processor, and sink, taken together — and it holds only for the specific failure modes you have actually reasoned about. Everything else is at-least-once with good marketing.

This note is the honest treatment: what exactly-once actually requires, where it breaks down (the sink, always the sink), what it costs, and when the right answer is to stop chasing it and build idempotent consumers instead.

## The real problem: duplicates are the default

Distributed systems duplicate work. A producer sends a message and the acknowledgment is lost, so it retries — the broker now has two copies. A consumer processes a batch, crashes before committing its offset, restarts, and replays the batch — every message processed twice. A network partition makes a leader step down and a follower replay. None of these are bugs. They are the normal operating conditions of a system that refuses to lose data, and "refuse to lose data" plus "things fail" equals "sometimes deliver twice."

The consequences depend on what the processing does. Doubling a page-view count is a rounding error. Double-charging a customer, double-counting revenue, or double-applying an inventory decrement is an incident. The question is never "do we have duplicates" — you do — but "where can a duplicate cause harm, and what does it cost to make the harm impossible rather than unlikely."

It helps to name the three semantics precisely:

- **At-most-once:** each message is processed zero or one times. Achieved by committing offsets before processing. Fast, and silently lossy — a crash between commit and processing loses data.
- **At-least-once:** each message is processed one or more times. Achieved by committing offsets after processing. No data loss, but duplicates on every failure-and-retry.
- **Exactly-once:** each message's *effect* is applied once. Note the word "effect." The message may physically arrive twice; what matters is that the downstream state reflects it once.

That last definition is the key to the whole topic. Exactly-once is about effects, not deliveries. And effects live in the sink.

## The producer side: idempotence and transactions

Kafka gives you two mechanisms on the write path, and they solve different problems.

**Idempotent producer** (`enable.idempotence=true`) ensures that retries from a single producer session do not create duplicates in a partition. The broker tracks a sequence number per producer ID per partition and rejects replays. This is nearly free — a small amount of broker-side bookkeeping — and there is no good reason not to enable it. But understand its limits: it deduplicates retries of the *same* batch within a producer session. It does not survive a producer restart with a new producer ID unless you also use transactions, and it says nothing about what happens after the message is read.

**Transactions** (`transactional.id`) extend the guarantee across multiple partitions and, critically, allow the consumer's offset commit to be part of the same atomic unit as the produced output. The pattern for a read-process-write stream processor:

```
begin transaction
  read batch from input partitions
  process
  write results to output partitions
  send offsets to transaction (offsets committed atomically with output)
commit transaction
```

If the processor crashes mid-transaction, the transaction abons, and the output topic never shows the partial results; on restart, the consumer replays from the last committed offset and reprocesses. The output topic, read with `isolation.level=read_committed`, shows each input's effect exactly once. This is genuine exactly-once *within Kafka*: from input topics, through the processor, to output topics, the effect is applied once.

The costs are real and should be named. Transactions add latency — the commit protocol involves the transaction coordinator, and end-to-end latency rises noticeably versus plain idempotent writes. Throughput drops, typically on the order of tens of percent depending on batching and transaction size, because every transaction boundary is coordination. There is operational surface: transaction timeouts, `transactional.id` fencing (which is how Kafka ensures a zombie producer from before a failover cannot commit — the new instance with the same ID fences the old one), and the transaction log topic itself to monitor. None of this is prohibitive, but "just turn on exactly-once" hand-waves away a meaningful performance and operability tax.

## The sink problem: where exactly-once goes to die

Here is the part that gets skipped in most explanations. The transactional guarantee above covers Kafka-to-Kafka. But most pipelines do not end in Kafka. They end in Postgres, in a data warehouse, in an object store, in a third-party API. And Kafka transactions cannot span those systems.

An external sink faces a fundamental choice on every write:

- **Write then commit offset:** if the process crashes after the write but before the offset commit, the write replays on restart. Duplicates.
- **Commit offset then write:** if the process crashes after the commit but before the write, the message is lost.
- **Write idempotently:** the write can be safely replayed, so duplicates are harmless.

There is no fourth option. Two-phase commit across Kafka and an external database is theoretically possible and practically something you should not build — it couples your sink's availability to a distributed transaction coordinator and creates failure modes worse than the duplicates you were avoiding.

So the sink problem reduces to one question: **can the sink absorb duplicates harmlessly?** The patterns that answer yes:

**Idempotent writes by natural key.** If every event carries a stable unique key (an order ID, a transaction ID), the sink can upsert on that key or ignore duplicates. `INSERT ... ON CONFLICT DO NOTHING` in Postgres, keyed writes where the key is the event ID, conditional writes in DynamoDB-style stores. This is the workhorse pattern. Its prerequisite is that the key actually exists and is actually stable — events without natural keys need one assigned at the source, and "we'll use a hash of the payload" fails the moment any field is non-deterministic.

**Transactional outbox at the source.** When the event originates in a service with a database, write the event to an outbox table in the same local transaction as the business state change, then relay the outbox to Kafka (via CDC or a relay process). The business update and the event emission are atomic *within the one database*, which is a transaction the database can actually guarantee. Duplicates can still occur at the relay step, so the consumer side still needs idempotency — but the "event emitted without state change" and "state change without event" failure modes are eliminated.

**Sink-side dedup tables.** When the sink has no natural idempotency, maintain a table of processed event IDs and check-then-write in a transaction. This works but has costs: the dedup table grows forever (mitigate with TTL-based cleanup keyed to your replay horizon), and the check adds a read to every write. Use it when the sink truly cannot be made idempotent any other way.

The anti-pattern to name explicitly: a team enables Kafka transactions, reads with `read_committed`, writes to Postgres with plain inserts, and declares the pipeline exactly-once. It is not. The Kafka leg is exactly-once; the Postgres leg is at-least-once with duplicates on every consumer failure. The system's guarantee is the weakest link's guarantee.

## When at-least-once plus idempotency is the right answer

Given the cost and complexity above, a serious engineer should ask when exactly-once is even worth it. My answer: less often than the textbooks suggest.

Choose **at-least-once with idempotent consumers** when:

- **The sink supports idempotent writes cheaply.** If your sink is a key-value store keyed by event ID, or Postgres with upsert semantics, duplicates are already harmless. Adding Kafka transactions on top buys you nothing except latency.
- **The processing is naturally idempotent.** Aggregations that recompute from scratch, writes that set absolute state rather than deltas ("set balance to X" versus "add 5 to balance") — these tolerate replays by construction.
- **Duplicates are merely wasteful, not wrong.** Recomputing a derived table twice costs warehouse credits; it does not corrupt anything. Paying a 20-30% throughput tax to avoid wasting 1% of compute on replays is bad arithmetic.
- **Latency matters more than duplicate-freedom.** Transactions add commit latency to every batch. For near-real-time use cases with tight latency budgets, at-least-once with idempotent sinks is often the only viable choice.

Choose **transactional exactly-once (Kafka-to-Kafka)** when:

- **The stream processor does read-process-write with non-idempotent effects**, like counting or summing into an output topic, and downstream consumers of that output topic cannot deduplicate. This is the case the mechanism was built for.
- **You need atomic multi-partition writes** — the output must appear in several partitions atomically or not at all.

And recognize the cases where **neither suffices**: when the sink is a third-party API with no idempotency support and real side effects (sending an email, charging a card). There, the answer is not a streaming semantic at all — it is a reconciliation process. Record the intent, attempt the side effect, reconcile against the provider's state, and alert on divergence. Exactly-once to a non-idempotent external system is not achievable; admitting that is the beginning of a correct design.

## Failure modes people forget to reason about

A checklist for reviewing any "exactly-once" claim:

1. **Producer restarts.** Does the producer use a stable `transactional.id` so fencing works, or does each restart get a new ID and lose idempotence across restarts?
2. **Consumer rebalances.** During a rebalance, partitions move between consumers. Are offsets committed transactionally with output, or is there a window where a moved partition replays?
3. **Poison pills.** A message that always fails processing will be retried forever, blocking the partition. Exactly-once machinery does not help; you need a dead-letter strategy, and the dead-letter decision (skip the message) is itself a semantic choice that breaks strict exactly-once. Name it as such.
4. **Transaction timeouts.** A transaction that runs longer than `transaction.timeout.ms` is aboned by the coordinator. Long processing batches need the timeout tuned — or smaller batches.
5. **Zombie fencing.** After a failover, the old producer instance must be fenced before the new one writes. If your `transactional.id` assignment is wrong (e.g., random per restart), fencing cannot protect you.
6. **The replay horizon.** Idempotent sinks and dedup tables only protect against duplicates within their retention. A replay of data older than your dedup window reintroduces duplicates. Size the window from your actual operational needs: how far back might you ever replay?

## How to start, and what good looks like

If you are designing a new streaming pipeline and want to get the semantics right:

1. **Start from the sink and work backward.** What does the sink do with a duplicate? If the answer is "nothing bad" (upsert by key, absolute-state writes), you are done — at-least-once with idempotent writes is your semantic, and it is the cheapest correct answer. Only reach for transactions if the sink cannot be made duplicate-safe.
2. **Enable the idempotent producer everywhere, unconditionally.** It is nearly free and eliminates the most common duplicate source. There is no trade-off to agonize over here.
3. **Give every event a stable unique key at the source.** This is the single highest-leverage decision for downstream correctness. Keys assigned at the source survive every retry, replay, and reprocessing in the pipeline. Keys invented mid-pipeline do not.
4. **If you need Kafka-to-Kafka exactly-once, use transactions properly**: stable `transactional.id`, offsets sent to the transaction, consumers reading with `read_committed`, and monitoring on transaction abort rates and durations. Load-test with failure injection — kill processors mid-transaction and verify the output, because the guarantee is only as good as your testing of the failure modes.
5. **For external sinks, implement the outbox or idempotent-write pattern** and document the replay horizon. Write the failure-mode checklist above into the service's runbook.

What good looks like at steady state: every pipeline has a documented delivery semantic that names the scope — "exactly-once from topic A to topic B via transactions; at-least-once with idempotent upsert from topic B to Postgres" — rather than a blanket claim. Producers are idempotent by default. Events carry stable keys. Sinks are duplicate-safe by construction, not by hope. And when someone asks whether the pipeline is exactly-once, the team answers with the scope and the failure modes, not with a config flag. That precision is the real deliverable: not the absence of duplicates, but the absence of illusions about them.
