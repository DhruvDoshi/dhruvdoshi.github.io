---
title: "Sagas for distributed transactions: choreography vs orchestration"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Distributed systems
categories: [Distributed Systems, Transactions, Architecture]
---

The moment a business transaction crosses a service boundary, ACID stops applying. An order touches inventory, payment, fraud screening, and fulfillment — four services, four databases, no shared transaction manager. You cannot wrap that in `BEGIN`/`COMMIT`. The saga pattern is the standard answer: a sequence of local transactions, each committing independently, with a defined recovery path when something fails. The interesting decisions are not in the definition — they are in how you coordinate the steps, how you undo them, and what you do when undo itself fails.

## Why two-phase commit doesn't survive contact with microservices

Two-phase commit is a fine protocol for nodes running the same database engine under one administrative domain. Microservices are the opposite, and every assumption 2PC makes breaks on contact.

**Lock duration becomes absurd.** 2PC's prepare phase holds locks on every participant until all vote. Inside one database that is milliseconds. Across business services, the "transaction" is a checkout flow or an approval chain that waits on humans. Holding locks for minutes while a user thinks destroys availability. Nobody accepts it, so 2PC quietly drops out of every real design review.

**It is a blocking protocol.** If the coordinator crashes between prepare and commit, participants sit blocked holding locks. Making the coordinator highly available just moves the consensus problem inside your transaction solution — you wanted to avoid distributed systems hard problems, and now you have two.

**Heterogeneous participants kill it.** Real flows mix a relational database, a broker, a payment gateway, and a third-party SaaS API. No transaction manager speaks prepare/commit to all of them. XA covers some databases, but the moment one participant cannot do XA — and there is always one — the protocol cannot run.

**Availability coupling.** 2PC requires every participant to be up to make progress; one slow service halts everything. Microservices were adopted to decouple availability, and 2PC re-couples it at the worst layer. Add the organizational reality — every participant implementing prepare/commit/rollback hooks across teams and vendors — and the protocol never gets built.

Verdict: 2PC is a database clustering protocol wearing a distributed-transactions costume. Use it between nodes of one store; between business services, put your design energy into saga recovery paths instead of the happy path.

## Saga fundamentals: local transactions plus defined undo

A saga is a sequence of local transactions, T1 through Tn. Each Ti commits independently against its own service's data. If Tk fails, the saga runs compensating transactions — C(k-1) down to C1 — in reverse order. Each compensation semantically undoes its step.

**There is no isolation across the saga.** Other readers see T1's committed effects while T2 is still running. This is the price of the pattern — a design constraint, not a bug. If the business cannot tolerate anyone seeing "payment taken, order not yet created," the saga must make that state explicit: a `PENDING` order status, a reserved-but-unconfirmed inventory hold.

**Use semantic locks, not database locks.** Since you cannot hold a row lock across services, hold a business-level reservation instead: an inventory hold row with an expiry, a payment authorization rather than a capture. These expiring domain concepts are the real work of saga adoption; the coordination mechanics are comparatively easy.

**Forward recovery is a first-class outcome.** Not every step can be compensated: an email was sent, a filing submitted, an item shipped. For these the failure path is forward — complete the saga along an alternate branch (issue a credit, escalate to a human) rather than rolling back. Mark which steps support backward vs forward recovery before code is written; the steps you cannot undo are the ones that page you at 3 AM.

## Choreography: the flow is the wiring

In choreography there is no central controller: service A completes its local transaction and publishes an event; B and C subscribe, each doing its local work and publishing the next event. The saga emerges from the wiring — nobody owns the flow; everybody owns their reaction to it.

```
  Order Service          Inventory Service         Payment Service
       |                        |                        |
   create order ──event──> reserve stock ──event──> charge card
       ^                        |                        |
       └──── compensation ◄─────┘ ◄──── failure event ────┘
```

Honest fit criteria: two to four participants, a linear sequence, little branching, one team or teams that genuinely coordinate. Choreography shines when participants join the flow by subscribing — a notification service listening to `OrderCreated` without the order service changing. That is real decoupling, and the one thing choreography is unambiguously good at.

**Failure modes, stated plainly.** Cyclic dependencies: A reacts to B's events and B reacts to A's, and a badly-shaped event loops until someone notices the broker is on fire. No single artifact shows the whole flow, so cycles are found by incident, not by review. Observability: there is no saga object to walk in a debugger. You reconstruct timelines from five services' logs, and correlation IDs only help if every participant propagates them — including the third-party webhook that doesn't. Changing the flow means touching publisher and subscriber contracts across services; the "flow" is a ghost existing only in the union of everyone's subscriptions, and "what happens if step 3 of 7 fails" has no single place to read the answer.

**Rule of thumb:** use choreography when you can draw the entire flow on a whiteboard, with all failure arrows, without the room arguing about what happens next. The moment the whiteboard gets contentious, you have outgrown choreography.

## Orchestration: the flow is a program

In orchestration a coordinator issues commands, collects results, and decides what happens next. Participants never talk to each other; they do local work and report back. The saga is an explicit program you can read.

**Use orchestration when the flow is complex or the audit trail matters.** Branching and parallel steps, conditional logic, many participants, centrally enforced timeouts, or a regulator wanting the exact event sequence — all point at orchestration. Across team boundaries where the flow is a product requirement, the owning team should own the saga explicitly, not hope five teams' subscriptions compose correctly.

**The coordinator is a single point of logic — manage that risk.** The failure mode is the orchestrator becoming a god service: computing prices, applying discount rules, making domain decisions. The discipline is a clean split: the orchestrator knows *what* happens in *which order* and *what to do on failure*; participants know *how*. Review every orchestrator change against that split.

**The orchestrator must be durable.** It persists saga state before issuing each command, so a crash or deploy mid-saga resumes instead of restarting. A stateless orchestrator is a pager incident waiting for a deploy: the first rolling restart orphans every in-flight saga. Durability is the correctness mechanism, not optional infrastructure.

## Designing compensating transactions

Sagas succeed or fail here, and it is almost entirely a design activity: every action ships with its compensation defined, reviewed, and tested. No compensation, no action.

**Idempotency in both directions.** Both will be retried, because network ambiguity makes "did it run?" unknowable — a compensation that charges back twice is worse than none. Put idempotency keys on compensations exactly as on actions, and test double-execution, including compensation arriving for an action that never ran.

**Semantic rollback, not technical rollback.** Technical rollback restores exact prior state — possible only if you saved it. Semantic rollback achieves an equivalent business outcome through a new operation: you cannot "un-charge" a card the way you delete a row; you issue a refund, with its own fees, timing, and audit trail. Design compensations with domain experts in the room — only they know what "undo" legally and financially means.

**Compensation ordering and failure.** Compensate in reverse order of execution. Design for compensation failure too — the refund API has outages: bounded retries with backoff, then escalation to a human queue with the full saga snapshot. Never silently drop a failed compensation; a half-compensated saga is a reconciliation problem that compounds daily.

```python
def run_saga(saga, steps):
    completed = []
    for step in steps:
        try:
            step.execute(idempotency_key=saga.id, timeout=step.timeout)
            completed.append(step)
        except StepFailed as e:
            for done in reversed(completed):          # reverse order
                retry_with_backoff(
                    lambda: done.compensate(idempotency_key=saga.id),
                    budget=done.compensation_budget,
                    on_exhausted=lambda: escalate_to_human(saga.id, done),
                )
            raise SagaFailed(e)
```

**Timeouts on everything.** Every step — action and compensation — gets a deadline; exceeding it counts as failure and triggers compensation. This is the single highest-ROI rule in saga design. Unbounded steps are how sagas get "stuck," and stuck sagas are how you discover the pattern's failure modes in production instead of in review.

## Execution coordinators vs workflow engines

**A hand-rolled coordinator** — state table, event loop, retry logic, timeouts — is the right machinery for one simple saga. The trap is the second and third: by then you have built a framework (generic state machine, retry library, dashboard, versioning) — a bad workflow engine you will maintain forever. If you catch yourself adding "just one more generic feature," evaluate the alternative.

**Workflow engines** (Temporal, Cadence, Step Functions, Camunda/Zeebe) provide durable execution as a platform feature: event-sourced state that survives crashes, replay and visibility UIs, in-flight versioning, and day-scale timers as primitives rather than cron hacks. Costs are real: a new operational dependency, a learning curve, and flow logic inside the engine's programming model.

**Decision rule:** more than two sagas, or any saga with human-in-the-loop waits — use a workflow engine. Durable execution across crashes is harder than it looks; re-solving it is not where your leverage is. One caveat: the engine executes your logic reliably but does not invent your compensation semantics. You still do the hard design work.

## Handling partial failures and "stuck" sagas

"Stuck" is three cases needing different policies: an action that keeps failing (downstream outage), a compensation that keeps failing (the dangerous one — the saga is half-undone), and a participant that never responds (did the action commit?).

**Classify failures before retrying.** Retry budgets are per step, with backoff and jitter — but classify first: retryable (timeouts, 5xx) vs non-retryable (validation errors, business rejections). Retrying the latter burns budget and delays the compensation that should have started immediately. Classification belongs in the step definition.

**Resolve ambiguity before compensating.** When a participant never responds, query its state with the idempotency key before deciding — compensating blindly can race a retried action. Participants must expose "did operation X commit?" as part of the saga contract.

**Escalate, never silently die.** After budget exhaustion, the saga moves to a dead-saga queue with its full state snapshot and a human gets paged — it stays queryable, never vanishing into a log. For the half-compensated case this is urgent: someone with domain authority finishes the undo manually.

**Circuit-break saga intake.** If a downstream service is down for hours, every saga touching it piles up in retry loops. Stop starting new sagas that need the dead participant — fail fast at the edge — instead of building a mountain of stuck sagas that thunder back on recovery.

**Monitor the invariants:** track started vs completed vs compensated vs escalated, compensation failure rate, p99 duration, stuck-saga count — and alert on stuck count above zero. A rising compensation rate is often the first signal of a downstream data-quality problem.

## Testing sagas

Saga testing must cover failure paths with the same rigor as the happy path, because the failure paths are the product.

**Deterministic replay.** Record a saga run's command/event sequence and replay it with canned participant responses. Workflow engines give you this nearly for free; hand-rolled coordinators need a scripted-response harness. Every production incident should become a regression test.

**Fault injection per step.** Kill each step in turn — action fails, compensation fails, participant times out, orchestrator restarts mid-saga — and verify the saga reaches its defined terminal state. If your coordinator cannot survive its own deploy, it is not production-ready.

**Compensation contract tests.** Test each compensation in isolation: double execution, execution with no preceding action, and compensation after the action's effects were partially overwritten by later legitimate operations. The last case — refunding against an account whose balance has since changed legitimately — is where semantic rollback design either holds or collapses.

**State-machine property tests.** For any interleaving of step failures, the saga ends in a terminal state: completed, fully compensated, or escalated — never "half." Model the saga as a state machine and test the property, not just examples; this catches the missing transition that only two specific failures in sequence would expose.

## Decision framework: choreography or orchestration

| Dimension | Favors choreography | Favors orchestration |
|---|---|---|
| Participants | 2–4 | 5+ |
| Flow shape | Linear, no branching | Branching, parallel, conditional |
| Team topology | One team, tight coordination | Multiple teams, flow owned as a product |
| Audit needs | Best-effort tracing OK | Exact sequence must be reconstructable |
| Evolution | Participants join/leave freely | Flow changes centrally, deliberately |
| Failure diagnosis | Flow fits in your head | One place must show saga state |
| Long waits | Rare | Approvals, day-scale timeouts |

When the table splits, default to orchestration. Choreography's costs compound with every added participant while orchestration's stay roughly flat, and teams almost always underestimate how complex their flow will become.

## Anti-patterns

**Saga for everything.** If one service can own the write, use a local transaction plus a transactional outbox. Sagas are for business transactions that genuinely span services, not for making every RPC "safe."

**Compensations that call other sagas unguarded.** Nesting without a parent/child protocol creates recursive failure: the child's compensation fails, triggering the parent's, which re-triggers the child. If you must nest, the child's compensation is part of the parent's compensation step, failures escalate to the parent, and depth is exactly one.

**No timeout on steps.** The most common production defect in saga implementations. Every step gets a deadline, or your "durable" saga is durable only in that it stays stuck forever.

**Assuming compensation always succeeds.** The refund API has outages too. The compensation-failure path deserves the same care as the action path — a design doc with no "what if compensation fails" section is incomplete.

**Exposing saga internals to clients.** Clients get "order accepted" or "order failed with reason" — not "saga step 4 of 9 failed at payment authorization." Leaking internals couples clients to your flow and turns refactoring into breaking API changes.

**Synchronous saga over request-response.** Chaining synchronous calls across services and calling it a saga gives you the coupling of 2PC with the guarantees of nothing. Either make it one service, or make it genuinely asynchronous with defined recovery.

## Closing

Sagas do not give you ACID back — they give you a disciplined way to live without it: every action paired with its undo, every step with a timeout, every failure with a defined terminal state. Choose choreography for flows you can hold in your head; orchestration the moment the flow matters enough to be explicit. Put your design energy in the compensations, because the happy path has never been the problem.
