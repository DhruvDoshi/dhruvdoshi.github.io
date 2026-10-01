---
title: "Agent orchestration patterns: planner-executor, routing, and supervision"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Enterprise AI
categories: [AI agents, Orchestration, Architecture]
---

Most teams building AI agents start with a single agent loop: a model, a prompt, and a pile of tools. It works for the demo. It falls apart when the task is too long, too varied, or too risky for one context window to hold everything at once. Orchestration is what you do next, and it is where most of the actual engineering lives.

Orchestration is not a framework choice. It is a set of decisions about who does what, in what order, with what state, and who is accountable when it goes wrong. The patterns below are the ones that keep showing up in production systems. Each has a shape where it wins and a shape where it fails. Picking wrong costs you months of latency budgets, debugging pain, and unreliable behavior that no amount of prompt tuning fixes.

## The baseline: one agent, many tools

Before adding orchestration, be honest about whether you need it. A single agent with a well-designed tool set handles a surprising range of work: question answering over a corpus, data lookup and summarization, straightforward multi-step tasks with clear dependencies.

The single-agent loop breaks down in predictable ways. Context windows fill up with tool output from unrelated subtasks, and the model starts dropping details. Long-horizon tasks accumulate errors — each step is slightly wrong, and there is no structure to catch drift. Distinct subproblems interfere with each other: the model applies the wrong tool, or merges results from two subtasks incorrectly. And you get no parallelism: everything runs in one serialized loop.

The rule of thumb I use: if you can describe the task as one coherent job that fits in a single context window with room to spare, stay with one agent. Orchestration is for when the work naturally decomposes into pieces with different skill requirements, different risk profiles, or different latency needs. Adding a second agent to a problem that fits in one is pure overhead — more state to manage, more failure modes, worse debuggability.

Anti-pattern: orchestrating because it looks sophisticated. I have seen teams build planner-executor hierarchies for tasks a single prompt could have handled. Every agent boundary is a seam where context gets lost and errors compound. Earn the complexity.

## The planner-executor pattern

The planner-executor split separates thinking about the work from doing the work. A planner agent decomposes the task into steps and produces a plan — usually a sequence or DAG of subtasks with explicit inputs and outputs. Executor agents (or tool calls) carry out each step. A final synthesis step combines results.

This pattern wins when tasks have clear, decomposable structure: research tasks, data pipeline construction, multi-part analysis. The planner holds the overall goal; executors hold only their subtask's context, which keeps each context window clean and focused.

The failure modes are specific and common. The planner produces plans that look right but are wrong in the details — steps that cannot actually be executed with the available tools, dependencies in the wrong order, or steps that duplicate each other. This is the number one failure of planner-executor systems, and the fix is not a better planner prompt. The fix is plan validation: check each planned step against the actual tool catalog before executing, verify that the plan's declared inputs are available, and reject or repair plans that reference nonexistent tools or unreachable state.

The second failure mode is drift between plan and execution. The executor deviates from the plan — because the world changed, or because it misunderstood — and the plan becomes a fiction. Mitigate this with explicit contracts: each step declares its expected outputs, and a validation layer checks outputs against the contract before the plan advances. When validation fails, re-plan from the current state rather than continuing blindly.

The third failure mode is planning overhead. For tasks with high uncertainty, spending expensive planning calls to produce a plan that gets discarded at step two is waste. Planner-executor fits tasks where the structure is predictable enough that a plan survives contact with reality.

## The router pattern

The router pattern handles task variety, not task length. A router agent (or a classifier) looks at the incoming request and dispatches it to a specialized agent: billing questions go to the billing agent, technical troubleshooting to the support agent, account changes to the account agent. Each specialist has its own tools, its own prompt, and its own evaluation criteria.

This is the right shape when you have distinct task types with different tool sets and different policies. A customer-facing assistant that handles refunds, troubleshooting, and account management is a natural fit. The router keeps each specialist's context clean — the billing agent never sees troubleshooting tools it should not touch — and lets teams own specialists independently, which matters organizationally: the payments team owns the payments agent, with its own evals and its own deploy cadence.

Router failure modes: misrouting is the obvious one, and it is worse than it sounds because the wrong specialist will often attempt the task anyway rather than refusing. It will call billing tools for a troubleshooting question and produce a confident wrong answer. The defense is explicit scope: each specialist should declare what it handles, and the router should route on declared capability, not vibes. Build a confusion-matrix evaluation for the router specifically — not just overall accuracy, but which pairs of specialists get confused — and fix the boundary cases with clearer specialist descriptions and router few-shot examples drawn from real misroutes.

The subtler failure is the multi-intent request: the user asks for a refund and a plan change in one message. A naive router picks one specialist and drops the other intent. Handle this with intent decomposition before routing: extract the distinct requests and route each.

Anti-pattern: routing when you mean planning. If the subtasks have dependencies on each other, you need a planner, not a router. Routers are for independent task types. Dependencies need plans.

## Supervision and hierarchical orchestration

Supervision adds a layer that watches, validates, and intervenes. A supervisor agent oversees worker agents: it assigns work, reviews outputs, and decides whether to accept, retry, or escalate. Hierarchical orchestration generalizes this: supervisors supervise supervisors, forming a tree.

This pattern exists for one reason: quality control at scale. When you parallelize work across many agent instances — processing hundreds of documents, reviewing thousands of tickets — you cannot have a human review everything. The supervisor is the automated reviewer. It checks outputs against rubrics, catches the failures workers miss, and routes the hard cases to humans.

The economics of supervision are the whole game. A supervisor that is as expensive as the worker doubles your cost for marginal gain. Effective supervision is usually asymmetric: the worker does the expensive generative work, and the supervisor does cheap verification — checking outputs against explicit criteria, running deterministic checks, comparing against known-good examples. A supervisor that just re-does the worker's task is not supervising; it is duplicating. Watch for rubber-stamping: inject known-bad worker outputs and verify the supervisor catches them. If it cannot catch planted errors, it is decoration. Use different models or checking strategies for worker and supervisor so they do not share blind spots.

Escalation policy is the part teams skip and then regret. Define explicitly what the supervisor does with uncertain outputs: retry with different parameters, escalate to a human, or flag and continue. "Escalate to human" is not a policy; it is a wish. Specify the queue, the SLA, the context the human gets, and what happens to the rest of the workflow while waiting. Unbounded human escalation in a parallel pipeline creates a queue that nobody monitors.

## State management: the part everyone underestimates

Every orchestration pattern above is really a state management problem wearing a costume. Agents need to share context: what has been done, what was decided, what the intermediate results are. The patterns for this range from simple to sophisticated, and the sophistication is usually unjustified.

The simplest approach that works: a shared working document. The orchestrator maintains a structured state object — task status, intermediate results, decisions — and passes relevant slices to each agent. Agents read and write through the orchestrator; they do not communicate with each other directly. This is boring and it works. It is debuggable: you can read the state object and see exactly what the system believes. It is recoverable: you can resume from the state object after a crash.

What fails: letting agents pass raw conversation history to each other. Context accumulates, contradicts itself, and becomes unreadable. What also fails: no shared state at all, where each agent starts cold and the orchestrator hopes the handoffs contain everything. Handoffs always lose information; the question is whether the loss is in the shared state or in nobody's memory.

For long-running orchestrations, add explicit state compaction: summarize completed subtasks into their essential results and drop the working detail. Debugging an orchestration without state history is archaeology.

Anti-pattern: building a message bus between agents before you have a working system. Direct agent-to-agent communication creates emergent behavior that is fascinating and undebuggable. Route everything through the orchestrator until you have a specific, proven reason not to.

## Tool design for multi-agent systems

Tools are the action surface, and in orchestrated systems the tool catalog is shared infrastructure. Design it like an API, because that is what it is.

The critical property is tool granularity relative to the agent using it. Executors need narrow, well-scoped tools: `get_invoice(invoice_id)`, not `query_database(sql)`. Broad tools in executor hands produce unpredictable behavior and make it impossible to write meaningful guardrails. The planner needs read access to the tool catalog with descriptions good enough to plan against — which means tool descriptions are load-bearing documentation, not afterthoughts. If the planner cannot tell from the description what a tool does and when to use it, the description is wrong.

Idempotency matters more in orchestrated systems because retries are more common. Any tool that a supervisor might retry must be safe to call twice. Tools with side effects need explicit confirmation steps or compensating actions.

## Error handling, retries, and human-in-the-loop

Orchestrated systems fail in more ways than single agents, so the error strategy needs to be explicit from the start.

Classify failures before you handle them. Transient failures (rate limits, timeouts, flaky tools) get retries with backoff. Deterministic failures (bad plan step, validation failure) get re-planning or escalation — retrying a deterministic failure is just paying to fail again.

Retry budgets are non-negotiable. Every retry loop needs a maximum count and a maximum cost, enforced by the orchestrator, not by the agent's good intentions. An agent left to retry on its own will retry until the budget is gone. I have seen runaway agent loops burn through a day's inference budget in an hour. The orchestrator owns the budget and kills loops that exceed it.

Human-in-the-loop should be designed as a first-class step, not a panic button. Specify the trigger conditions (confidence thresholds, value thresholds, policy flags), the interface (what the human sees, what actions they can take), and the resume semantics (what happens to the workflow while waiting, what happens if the human never responds). The most common real design: async human review for high-value or high-risk steps, with the workflow continuing on low-risk steps and pausing only where the human's input is needed. Synchronous human blocking on every step is just a slow human doing the work with extra steps.

## Observability for orchestrated agents

You cannot operate what you cannot see, and orchestrated agents are harder to see into than single agents. The minimum viable observability: a trace for every run that shows the orchestration graph — which agents ran, in what order, with what inputs and outputs, how long each took, and what it cost. This is the equivalent of distributed tracing for agents, and it is not optional.

Beyond traces, you need decision records: why did the router route here, why did the planner choose this decomposition, why did the supervisor accept this output. These do not need to be elaborate — the agent's stated reasoning, captured verbatim, is usually enough. When something goes wrong, the first question is always "why did it do that," and without decision records you are guessing.

Aggregate metrics per pattern: plan success rate and re-plan rate for planner-executor, routing accuracy for routers, catch rate on injected errors for supervisors. Overall task success rate tells you that something is wrong; pattern-level metrics tell you what.

## Latency and cost budgeting

Every agent call costs time and money, and orchestration multiplies both. A planner-executor flow with a planning call, five executor calls, a supervisor call, and a synthesis call is eight model calls for one user request. If each call takes seconds, the user is waiting. If each call costs cents, the unit economics need to work at your volume.

Budget before you build. Write down the expected call count per request for the happy path and for the retry path. Multiply by your expected volume. If the number is uncomfortable, simplify the orchestration before you have built it — it is much cheaper to cut a supervisor from a design doc than from a production system.

The standard latency mitigations: parallelize independent subtasks, use smaller and faster models for routing and supervision, and stream partial results so perceived latency stays below total latency.

The standard cost mitigations: match model capability to subtask difficulty, cache aggressively, and set per-request cost ceilings that trigger degraded modes — a cheaper fallback plan rather than a failed request.

## Anti-patterns

A few recurring ones worth naming explicitly. The mega-prompt orchestrator: stuffing the entire orchestration logic — routing rules, planning instructions, tool docs for every specialist — into one giant prompt and calling it a multi-agent system. It is a single agent with extra steps and all the context problems that implies.

The framework-first build: adopting an orchestration framework before understanding the problem's natural decomposition. Frameworks encode opinions about orchestration; if those opinions do not match your problem, you fight the framework on every step. Understand the decomposition first, then pick the tooling that fits — or write the orchestrator yourself, which for many systems is a few hundred lines of straightforward code.

The unevaluated orchestration: adding agents without per-pattern evals. "It works on my three test cases" is not an evaluation.

## Choosing a pattern

A short decision guide. One coherent task, fits in context, low variety: single agent. Long task, decomposable, predictable structure: planner-executor. High request variety, independent task types, different tool sets: router. Parallel work at scale needing quality control: supervision. Long task, high uncertainty, structure emerges during execution: interleaved planning (single agent with planning discipline) or planner-executor with cheap re-planning.

Most real systems end up hybrid: a router that dispatches to planner-executor flows, with supervision on the high-risk paths. That is fine. What is not fine is arriving at the hybrid by accident, with no evaluation of the individual patterns and no observability into the seams. Orchestration is engineering. Treat it like engineering: decompose the problem, pick patterns deliberately, instrument the seams, and evaluate each piece.
