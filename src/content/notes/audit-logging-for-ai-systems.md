---
title: "Audit logging for AI systems: what to record and why"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: AI governance
categories: [Audit logging, Compliance, Observability]
---

AI systems make decisions and take actions that need to be explainable after the fact: why did the agent do that, what data did it use, who approved it, what exactly happened? Audit logging is how you answer those questions. It is also one of the most neglected parts of AI system design — teams instrument for debugging and performance, then discover during an incident or an audit that they cannot reconstruct what the system did.

This note covers what to log, how to structure it, and how to operate audit logs for AI systems specifically. The general principles of audit logging apply; AI systems add new event types, new sensitivity concerns, and new questions the logs must answer.

## Why AI audit logging is different

Traditional audit logging records who did what, when, to which resource. AI systems add layers that traditional logs do not capture.

The decision process is probabilistic and opaque. When a human approves a transaction, the audit log records the approval. When an agent approves a transaction, you need the reasoning trace, the retrieved context, the tool outputs it based the decision on, and the policy checks that ran. Without these, "the agent approved it" is not an auditable event — it is a black box with a timestamp.

The inputs are unstructured and sensitive. Prompts contain user data, retrieved documents, conversation history. Logging them verbatim creates a sensitive data store; not logging them destroys reconstructability. This tension has no perfect resolution, only managed trade-offs.

The actions are multi-step and distributed. An agent workflow spans model calls, tool invocations, retrieval queries, and human approvals across seconds or minutes. The audit trail must connect these into a coherent record of a single logical operation. Correlating scattered events after the fact is forensic archaeology; emitting them with correlation IDs from the start is engineering.

Regulatory pressure is growing. AI-specific regulations and guidance increasingly expect logging of AI system behavior: what the system did, what data it used, how decisions were made, and human oversight points. Even where not yet legally required, enterprise buyers ask for it, and incident response demands it.

## What to record

The audit record for AI systems has several categories. Record all of them for consequential flows; record proportionally for the rest.

Identity and context. Who initiated the request (user ID, service identity), their authorization context (roles, tenant, data scopes granted), the session or conversation identifier, and the request timestamp. For agentic systems, also record the agent's identity and version — which agent, which model version, which prompt version. "The agent did it" is insufficient; you need to know exactly which configuration did it, because configurations change.

Inputs. The user's request, in full. For RAG systems, the retrieved documents (identifiers and versions, not necessarily full text — but enough to reconstruct what the model saw). For agents, the tool definitions available and the task parameters. Input logging is where the sensitivity tension is sharpest; handle it with the redaction strategy below.

The decision record. For model-driven decisions: the model's output, the reasoning trace (or a summary for long traces), confidence signals if available, and the model/prompt versions. For agent workflows: the plan, each step's action and result, and any re-planning events. The decision record is what makes AI audit logs different from traditional ones — it captures not just what happened but the basis for it.

Tool invocations. Every tool call: which tool, full parameters, the result or error, timestamp, and duration. Tool calls are where agents affect the world; the audit log must show each one. For tools with side effects, also log the pre- and post-state where feasible (account balance before and after, ticket status transitions).

Policy and guardrail evaluations. Every policy check that ran, its result, and what it decided. Guardrail triggers, approval requests and their outcomes (who approved, when, with what context shown), and any overrides or escalations. When something goes wrong, the first question is often "did the guardrail catch it" — the log must answer that directly.

Data access. What data the system touched: documents retrieved, database records read, external APIs called, and the authorization basis for each access. For multi-tenant systems, record the tenant context of every data access. Cross-tenant incidents are investigated through these records.

Outputs and delivery. What was returned to the user, what actions were taken externally, and any post-processing applied (redaction, filtering). The output record closes the loop: from request to response, the log shows the complete story.

## Structuring the log

Unstructured text logs do not survive contact with investigations. Structure from the start.

Use a consistent event schema across all AI components. Every event carries: timestamp (with timezone, synchronized clocks), correlation ID (tying all events from one logical operation), component identifier (which service, which agent, which model version), event type, actor identity, and a structured payload specific to the event type. The schema should be versioned and documented — the audit log is a data contract with your future incident responders.

Correlation is the critical design decision. A single user request can generate dozens of events across model calls, retrievals, tool invocations, and approvals. Without a correlation ID propagated through every component, reconstructing the story requires timestamp correlation across services — slow, error-prone, and incomplete. Propagate the correlation ID through the prompt chain, the tool calls, and the human approval steps. For multi-turn conversations, use both a session ID and a per-turn request ID.

Immutability matters for audit logs in a way it does not for debug logs. Once written, audit events should not be modifiable — append-only storage, with integrity protection (hash chaining or write-once storage) for the highest-assurance contexts. Someone under investigation should not be able to edit the record of their actions, and the system should be able to prove they did not.

Separate audit logs from operational logs. Debug logs are verbose, unstructured, and routinely sampled or truncated. Audit logs are complete, structured, and retained per policy. Mixing them means either drowning the audit trail in debug noise or losing audit completeness to debug sampling. Different pipelines, different retention, different access controls.

## The sensitivity problem

Audit logs for AI systems contain the sensitive data the system processed: PII in prompts, retrieved documents, tool outputs with customer data. The audit log becomes one of your most sensitive data stores. Handle it accordingly.

Redact at write time. Apply PII detection and redaction to audit events before they are written, with typed markers preserving investigability ([EMAIL] rather than [REDACTED]). Redaction at write time means the sensitive value never enters the log store. Batch redaction later is strictly worse — the data sits unprotected in between, and "later" has a way of never happening.

But preserve reconstructability. Over-redaction destroys the audit log's purpose. If every identifier is redacted, you cannot trace what the agent actually did. The balance: redact direct PII (names, contact details, identifiers) while preserving operational identifiers (record IDs, transaction IDs, document IDs) that let investigators follow the trail without seeing personal data. Define this balance explicitly per event type — it is a design decision, not something to improvise per incident.

Access control on the logs themselves. Audit logs need strict, role-based access: security and compliance teams can read them, with access itself logged. Developers debugging production issues get redacted views or specific event types, not raw access. The people being audited should not have write access to the audit store — this includes the AI system's own service identities.

Retention with purpose. Define retention periods based on regulatory requirements and incident investigation needs, not on storage convenience. Financial and healthcare contexts often require multi-year retention; other contexts may need less. Implement automated deletion at the end of retention — audit logs that accumulate forever become a liability, and "we kept it just in case" is not a retention policy.

## What the logs must answer

Design the audit log backward from the questions it must answer. If it cannot answer these, it is incomplete.

For incidents: What did the system do, in what order? What data did it access, and was the access authorized? What did the user ask for versus what the system did? Which policy checks ran, and what did they decide? Who approved the consequential actions, and what did they see? Could this have been prevented by an existing control, and if so, why did the control not fire?

For compliance: Demonstrate that required controls operated — human approval happened where required, data access respected authorization, retention policies were followed, and the system's behavior is explainable. Show the control evidence, not just the system behavior.

For disputes: When a user or a business partner disputes what the system did — "the agent was not authorized to do that," "the system disclosed my data" — the audit log is the record of truth. It must be complete enough, tamper-evident enough, and understandable enough to resolve the dispute.

For improvement: Which failure modes occur in practice? Where do guardrails trigger most? What do escalated cases look like? The audit log is also an operational dataset — aggregate analysis of audit events reveals the patterns that eval sets miss.

Test this directly: pick a set of representative questions and verify the logs answer them. If answering requires joining three systems' logs with timestamp guesswork, the audit design needs work.

## Operating the audit pipeline

Audit logging is infrastructure. Operate it like infrastructure.

Reliability: audit events must not be lost. Use durable queuing between components and the log store, with backpressure handling that degrades the application rather than dropping audit events. An AI system that continues operating while its audit pipeline is down is operating without oversight — decide explicitly whether that is acceptable (it usually is not for consequential flows) and build the circuit breaker accordingly.

Performance: audit logging adds overhead to every operation. Keep event emission asynchronous and non-blocking on the request path, batch writes where possible, and monitor the pipeline's latency and throughput. Size the pipeline for peak load, not average — audit backlogs during incidents are exactly when you need the logs most. Manage storage costs explicitly: structured audit events compress well, tiered storage (hot for recent, cold for archival) matches the access pattern of investigations, and the retention policy bounds the total. Unmanaged audit storage grows until someone asks why the bill is so large.

Monitoring the monitors: alert on audit pipeline health — ingestion rate anomalies, write failures, storage capacity, and gaps in event sequences (missing correlation IDs, sequence breaks). A silent audit pipeline failure is a control failure; treat it as an incident.

Access and review workflows: define who can query audit logs, through what interface, with what approval. Ad-hoc production log access during incidents needs a defined emergency path. Regular compliance reviews need scheduled, scoped access. Both need their own audit trail — access to audit logs is itself audited.

## Anti-patterns

Debug logs as audit logs: verbose, sampled, unstructured application logs presented as an audit trail. They are neither complete nor reliable.

No correlation IDs: dozens of events per request with no way to reconstruct the story except timestamp proximity.

Logging everything raw: full prompts with unredacted PII flowing into a log store with broad access. A breach waiting for a query.

Audit pipeline as an afterthought: best-effort event emission that drops data under load, discovered during the first real investigation.

Immutable in name only: audit stores that admins can edit, with no integrity protection and no access logging.

Retention by default: keeping everything forever because no one defined deletion, creating a growing liability.

## Stated plainly

Log identity, inputs, decision records, tool invocations, policy evaluations, data access, and outputs — structured, correlated, and immutable. Redact PII at write time while preserving reconstructability. Control access to the logs strictly and retain them per policy, not per convenience. Design backward from the questions the logs must answer: incident reconstruction, compliance evidence, dispute resolution. Audit logging is not observability overhead — it is the control that makes every other AI governance control provable. Build it before the incident that needs it, because afterward is too late and the gaps are permanently unfillable.
