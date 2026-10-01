---
title: Observability for LLM applications
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: AI systems
categories: [Observability, LLM, Reliability]
---

Traditional observability answers what the system did. LLM application observability must also answer what the system said, why it said it, what it cost, and whether it should have said it at all. The probabilistic, multi-step nature of these applications demands telemetry designed around their actual structure.

## Trace the full reasoning path

A single user request to an LLM application fans out into a tree: prompt construction, retrieval queries, reranking, tool calls, sub-model invocations, and final generation. A flat log line per request cannot represent this. Use distributed traces where each step — retrieval, tool call, generation — is a span with its own inputs, outputs, latency, and cost.

Capture the inputs that determine behavior: the exact prompt or template version, retrieved chunk identifiers (not just scores), tool arguments and results, and model parameters. When a user reports a bad answer, the trace should let you replay the decision path. Without it, debugging is archaeology.

Be deliberate about what not to store. Full prompts and completions in traces create a privacy liability at scale. Store references and hashes by default, full content only where justified, with retention policies that match the sensitivity of the data.

## Instrument quality, not just latency

Latency, error rate, and throughput remain necessary and are no longer sufficient. LLM applications need quality signals as first-class telemetry: faithfulness of claims to retrieved evidence, abstention rate, tool-call success rate, user correction or regeneration rate, and agreement between model recommendations and human decisions where humans remain in the loop.

Many of these require asynchronous evaluation — a sample of production traffic scored by rubric-based graders or human reviewers, joined back to the trace. Build the sampling and joining infrastructure early; bolting it on later means flying blind through the period when the system is changing fastest.

## Track cost per unit of value

Token usage is the new infrastructure bill, and it behaves differently: it scales with user behavior and prompt design rather than traffic, and a single prompt change can multiply cost overnight. Instrument cost per request, per use case, per model, and per successful task completion — not just aggregate spend.

Alert on cost anomalies the way you alert on latency anomalies. A prompt regression that doubles tokens per request is an incident for the budget even when users notice nothing. Attribute spend to the teams and prompts that generate it so optimization has an owner.

## Monitor the components that change silently

Models get updated by providers. Embeddings drift. Retrieval corpora go stale. Tool definitions change. Each of these alters behavior without a deploy, which means change monitoring must cover more than the application repository.

Track provider model versions, safety settings, embedding model versions, index build timestamps, and tool schema versions as deployment metadata. Run a fixed probe set continuously — the same questions, the same retrieval queries — and alert on quality drift. A probe set is the canary for silent change.

## Design for investigation

When something goes wrong, the questions come fast: was this a model issue, a retrieval issue, a prompt issue, or a data issue? The telemetry should make the common investigations quick: filter traces by quality signal, compare behavior across model versions, inspect what was retrieved for a failed answer, and see the exact configuration in effect at the time.

Observability for LLM applications is not a monitoring add-on. It is the evidence infrastructure that makes evaluation, incident review, governance, and cost control possible. Build it as part of the application, not after it.

## Keep humans in the sampling loop

Automated quality signals scale, but they drift from human judgment over time. Graders trained on yesterday's notion of quality miss the ways user expectations evolve; proxy metrics optimize toward what is measured rather than what matters. The correction is a permanent, calibrated human sampling loop.

Design the loop deliberately. Sample production traffic across use cases and risk levels, not just where failures are suspected — the sampling exists to find the failures you are not suspecting. Use qualified reviewers with clear rubrics, measure their agreement with each other before trusting their judgments, and recalibrate the automated graders against human scores on a schedule.

Size the sample to the stakes. A customer-facing system deciding eligibility needs deeper human review than an internal drafting assistant, and the sampling rate should be explicit rather than "as time permits." When human reviewers consistently disagree with the automated signals, believe the humans and fix the signals; the moment the team starts overriding reviewers to protect a metric, the telemetry has become theater.

The human loop is also where the organization learns. Reviewers see the system's actual behavior on real inputs — the edge cases, the surprising successes, the slow shifts in user behavior. Feed those observations back into evaluation design, product decisions, and training. Telemetry tells you what happened; the humans tell you what it means.
