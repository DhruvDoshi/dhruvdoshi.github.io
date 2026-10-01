---
title: "Stream processing design: state, time, and exactly-once"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Data engineering
categories: [Data Engineering, Streaming, Kafka]
---

Batch processing asks "what happened?" Stream processing asks "what is happening, right now, and what should we do about it?" The difference is not speed — it is that the input never ends, data arrives out of order, and the system has opinions about time. Every stream-processing design that survives production gets three things right: where state lives, which clock it trusts, and what "correct" means when something fails mid-write. Get any of the three wrong and you get a system that is fast, wrong, and expensive to fix.

## Why streams are harder than they look

A batch job sees the whole dataset before it computes. A stream processor sees an endless prefix and must produce answers anyway — answers that may need revising when late data arrives. This is the fundamental tension: downstream wants final answers, upstream keeps sending corrections.

**Unbounded input changes the failure model.** A batch job that crashes restarts from the beginning. A stream job that crashes must resume from where it was — which means its progress (offsets) and its intermediate results (state) are both durable artifacts that must survive the crash consistently. "Just restart it" is a data-loss strategy unless state and offsets are checkpointed together.

**Order is not guaranteed.** In a distributed source, events from two partitions arrive interleaved; a mobile client buffers and uploads late; a retry replays yesterday's event. Any design that assumes arrival order equals event order is wrong on day one and stays wrong. The system must define what time means — and then enforce it.

**State is the product.** Counting, joining, sessionizing, deduplicating — every interesting stream operation keeps state. The state store is not a cache you can drop; it is the accumulated knowledge of everything seen so far. Treat it with the same seriousness as a database, because it is one.

## The three clocks: processing time, event time, ingestion time

**Processing time** is the wall clock of the machine running the job. It is simple, always available, and wrong whenever it matters: a late event gets bucketed into the wrong window, a replay produces different results than the original run, and "results" are not reproducible. Processing time is fine for timeouts and liveness checks. It is not fine for business logic.

**Event time** is the timestamp inside the event — when the thing actually happened. This is the clock business logic should use: the user's purchase happened at 14:03 regardless of when the server processed it. Event-time processing gives reproducible results — replay the same events, get the same answers — but it must handle late and out-of-order data explicitly.

**Ingestion time** is when the event entered the streaming system — assigned by the broker or the source connector. It is a compromise: simpler than event time (no per-source clock skew to reason about), more honest than processing time (stable across replays of the same log). Useful when the source cannot be trusted to stamp times — which is more sources than their owners admit.

**Rule of thumb:** business logic on event time, operational timeouts on processing time, ingestion time when the source's clock is untrustworthy. If a design doc doesn't say which clock each computation uses, it isn't finished.

## Watermarks and the lateness contract

Event time creates a problem: how long do you wait for late events before closing a window and emitting the result? Wait forever and you never emit; emit immediately and every late event is wrong.

**Watermarks are the system's statement of progress.** A watermark is a timestamp T meaning "we believe no more events with time earlier than T will arrive." When the watermark passes a window's end, the window fires. Watermarks are heuristics — a guess about the future based on observed lateness — and every watermark strategy is a trade-off between latency and completeness.

**The lateness contract is a business decision.** How late is too late? For a fraud-detection stream, waiting ten minutes for stragglers means the fraudster is gone; emit early, correct later. For a billing aggregation, a late event changes money; wait longer, and have a defined correction path for the truly late. The common failure is letting the framework's default (often zero allowed lateness, or drop-late) become the business policy by accident. The allowed-lateness value and the late-data policy — drop, side-output, or update — belong in the design doc with a business sign-off, not in a config file nobody reads.

**Late data needs a first-class path.** Three policies: drop it (acceptable when the aggregate is advisory), emit corrections (update the downstream store — requires the sink to support upserts), or route to a side output for offline reconciliation. "Drop" as an unexamined default is how billing discrepancies are born. Every windowed computation should state its late-data policy explicitly.

```
event time ──────────────────────────────────────▶

window [10:00–10:05)          window [10:05–10:10)
┌──────────────────┐          ┌──────────────────┐
│ events arrive    │          │                  │
│ out of order     │ watermark│                  │
│ 10:01, 10:04,    │── passes ─▶│ fires, emits    │
│ 10:02, 10:03     │  10:05   │ result           │
└──────────────────┘          └──────────────────┘
                                    ▲
                        late event 10:07 arrives
                        → policy: drop | update | side-output
```

## State: the part everyone underestimates

**State backends are databases with opinions.** Stream processors keep state in an embedded store (RocksDB is the industry standard) with changelog topics in Kafka for durability. This gives you local-disk speed with Kafka-backed recovery — but it also means state size, compaction, and restore time are your problems now. A job whose state grows unboundedly — a join keyed on user ID with no TTL — will eventually fall over, and "eventually" arrives faster than the capacity model predicted.

**State must be bounded by design.** Every keyed state needs a TTL, a retention policy, or a compaction strategy derived from the business question. "Count events per user forever" is not a design; "count events per user in the trailing 30 days" is. The TTL is not a tuning parameter — it is part of the correctness contract, because a window that never closes is a memory leak with extra steps.

**Restore time is a recovery metric.** When a task fails over to another node, it replays its changelog to rebuild state. For large state, restore takes minutes to tens of minutes — during which the stream is stalled and lag grows. Test restore time at production state sizes, not on an empty dev cluster. Incremental checkpoints and standby replicas reduce it; both cost resources. This is a real line item in the capacity plan.

**Schema evolution applies to state, not just events.** A stateful job's serialized state outlives any single deploy. Changing the shape of a state object — adding a field to an aggregation accumulator — needs a migration strategy: versioned serializers, or a stop-the-world state rebuild. Teams discover this when a "simple" deploy corrupts state and the job starts emitting garbage with full confidence. Version your state schemas like your event schemas.

**Key design decides scaling.** Parallelism in stream processing is per key: all events for one key go to one task. A hot key — one merchant with 40% of transactions, one device spamming — bottlenecks a single task while the rest idle. There is no framework magic for this: salt the key, pre-aggregate, or accept the ceiling. Key cardinality and skew belong in the design review, not the postmortem.

## Exactly-once: what it means and what it costs

**Exactly-once is a contract between the processor and the sink, not a framework feature.** The processor can guarantee it processes each event's effect exactly once only if the sink cooperates: either the sink supports transactional writes (Kafka's idempotent producer plus transactions, writing results back to Kafka), or the sink supports idempotent upserts keyed deterministically (write to Postgres with `ON CONFLICT`, to an object store with deterministic file names). Without one of these, you have at-least-once with duplicates — and you must design the downstream to tolerate them.

**Two-phase commit inside the stream job.** Frameworks like Flink implement exactly-once via checkpointing coordinated with two-phase commit to the sink: state snapshot and sink pre-commit in the same checkpoint barrier, then commit. It works, and it costs latency — checkpoint intervals bound your end-to-end latency floor, and the commit phase adds overhead per checkpoint. Smaller checkpoints mean lower latency and higher overhead; this is a knob, not a free lunch.

**The honest question: do you need it?** Exactly-once matters when duplicates change the answer: counting money, incrementing balances, emitting alerts. It does not matter when the sink is idempotent by construction: keyed upserts into a serving store, overwriting aggregates. Most serving use cases — materialized views, search indexes, feature stores — are idempotent sinks, and at-least-once plus idempotent writes is simpler, faster, and cheaper than exactly-once machinery. Reserve exactly-once for the cases where a duplicate is a correctness violation, not an inconvenience.

**End-to-end exactly-once is a myth worth retiring.** Your job writes exactly-once to Kafka; the consumer of that topic replays after a crash; the downstream service double-applies. The guarantee holds only within the boundary you control. Design each stage for the semantics it can actually provide, and make every sink idempotent regardless — it is the cheapest insurance in streaming.

Verdict: default to at-least-once with idempotent sinks. Reach for transactional exactly-once only when duplicates are a correctness violation and the sink supports it. Never assume exactly-once extends past your system's boundary.

## Windowing: the shapes and their traps

**Tumbling windows** (fixed, non-overlapping) are the workhorse: five-minute aggregates, hourly rollups. Simple, well-understood, and the right default for periodic reporting.

**Sliding windows** (fixed size, overlapping) give smoother curves — a 1-hour window sliding every 5 minutes — at the cost of each event being processed many times. Fine for dashboards; wasteful for expensive computations.

**Session windows** (gap-based: a burst of activity separated by inactivity) model user sessions, device connections, fraud sequences. The trap is the gap parameter: too short splits real sessions, too long merges distinct ones, and the "right" value is a business question disguised as a config. Sessions also can't emit until the gap elapses — a session that stays active holds its result indefinitely, so long-lived sessions need early-firing triggers.

**Global windows with custom triggers** are the escape hatch for "emit when X happens" — a threshold crossed, a signal received. Powerful and easy to get wrong: a trigger that never fires is a silent data loss, and a trigger that fires too eagerly is a duplicate storm. Every custom trigger needs a test that proves it fires exactly when intended, including under failure.

**Rule of thumb:** start with tumbling windows; move to sliding only for smoothness requirements you can name; use sessions only when the gap has a business definition; treat custom triggers as code that needs the same review rigor as any other code.

## Joins in streams: the expensive operation

**Stream-stream joins** keep state for both sides: every event on the left waits for its match on the right within the join window. State grows with the product of both streams' rates times the window — this is the fastest path to an unbounded-state incident. Keep join windows as small as the business allows, and put TTLs on both sides even when the framework doesn't require it.

**Stream-table joins** (enrichment against a slowly-changing dimension) are the common case: join the event stream against a customer table, a product catalog. The dimension table itself is usually fed by CDC. The trap is staleness: the enrichment reflects the dimension as of some lag, and a join against a stale record produces wrong-but-plausible results. Decide whether the join needs point-in-time correctness or whether "current as of now" suffices — the former is an order of magnitude more complex.

**Out-of-order joins need the lateness contract too.** A join is a windowed operation; late events on either side miss their matches. The same allowed-lateness and late-data policy decisions apply, on both inputs.

## Failure handling: the design nobody writes down

**Checkpointing is the recovery mechanism.** The job periodically snapshots state and offsets; on failure it restores the last checkpoint and replays. Checkpoint interval is a three-way trade-off: shorter means less reprocessing but more overhead; longer means cheaper steady-state but longer recovery. Align the interval with your recovery-time objective, not with a default.

**Poison events need a dead-letter path.** A malformed event that crashes the deserializer will crash the job on every replay — the job is now stuck in a crash loop on the same record, forever. Every source needs a deserialization-error policy: dead-letter topic, metric, alert. This is not an edge case; it is the most common production incident in stream processing, and it is entirely preventable.

**Backpressure is a signal, not a bug.** When a sink slows down, the job should slow down — that is backpressure working. The failure is unbounded buffering: queues that grow until memory exhausts. Prefer bounded buffers with explicit overflow policy (drop-oldest for advisory data, block-and-alert for critical data) over unbounded queues that turn a slow sink into an OOM.

**Reprocessing is a normal operation.** A bug in the job logic means replaying history with fixed code — which requires the source to retain history (Kafka retention sized for your reprocessing window, not the default seven days) and the sink to tolerate a full rewrite.

## Observability for streams

**Lag is the master metric.** End-to-end lag — event time to result-visible time — per pipeline, per partition. Lag rising is the first signal of almost every problem: hot keys, slow sinks, checkpoint pressure, poison events. Alert on lag against the business SLA, not on CPU.

**Watermark lag deserves its own alert.** The difference between the watermark and wall clock tells you how far behind event-time progress is. A stuck watermark means windows never fire — results silently stop while the job looks healthy. This is the metric that catches the "everything is green but nothing is emitting" incident.

**State size, checkpoint duration, and restore time** round out the essentials: state size trending up without bound is the early warning for the TTL you forgot; checkpoint duration trending up predicts recovery problems.

## Decision checklist

1. **Which clock?** Event time for business logic, with the source's timestamp trustworthiness assessed honestly.
2. **Lateness contract:** allowed lateness value, late-data policy (drop/update/side-output), business sign-off.
3. **State bounds:** TTL or retention for every keyed state, derived from the business question.
4. **Delivery semantics:** at-least-once + idempotent sink by default; exactly-once only where duplicates are correctness violations and the sink supports it.
5. **Key design:** cardinality, skew, hot-key plan.
6. **Failure paths:** poison-event dead letter, checkpoint/recovery RTO, replay capability with retention to match.
7. **Sink contract:** upsert keys, delete handling, staleness tolerance for enrichment joins.

## Closing

Stream processing design is state design, time design, and failure design — in that order. The frameworks (Flink, Kafka Streams, Spark Structured Streaming — industry tools teams reach for, each with real trade-offs) handle the mechanics of checkpointing and watermarks; they do not decide your lateness contract, bound your state, or make your sink idempotent. Those decisions are the engineering. Write them down before the first deploy, because the stream will not wait for you to figure them out later — it just keeps flowing, and every hour of ambiguity becomes a day of backfill.
