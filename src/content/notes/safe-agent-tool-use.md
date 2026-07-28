---
title: Design safe tool use for AI agents
author: Dhruv Doshi
date: 2024-10-01
reviewed: 2026-07-28
status: published
topic: AI governance
categories: [AI Agents, Tool Use, Security]
---

An AI agent becomes materially different from a chatbot when it can read private data or change external systems. The central safety question is not whether the model produces good prose; it is whether authority, intent, and side effects remain controlled when model output is uncertain.

## Give tools narrow contracts

Each tool should perform one bounded operation with a typed schema, explicit authorization, predictable errors, and a small response. Avoid general shell, database, or HTTP tools when a domain-specific operation will do. Validate every argument outside the model and reject unknown fields.

Separate read operations from writes. Separate reversible changes from destructive or externally visible actions. Tool descriptions must not be the security boundary; enforcement belongs in application code and the target system.

## Bind authority to the user and task

The agent should receive only the credentials and scopes needed for the current task. Preserve the initiating user’s identity and tenant context. Re-check authorization at execution time rather than assuming that access to the conversation implies access to every connected resource.

Require confirmation when an action is destructive, costly, difficult to reverse, or communicates externally. The confirmation should show the resolved target and effect, not a vague “continue?” prompt.

## Treat all content as untrusted

Tool results, retrieved documents, websites, emails, and attachments can contain instructions intended to redirect the agent. Keep system policy and data separate, constrain which tool calls content can influence, and prevent secrets from being inserted into untrusted destinations.

The [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/) describes prompt injection, excessive agency, sensitive-information disclosure, and related risks. Use it as a threat-model input, then test the concrete workflows your agent supports.

## Make execution inspectable

Record requested action, resolved arguments, authorization decision, tool result, model and policy versions, confirmation, and resulting resource identifiers. Redact sensitive content and apply retention limits. Use idempotency keys for retried writes and compensation procedures where transactions are unavailable.

Set budgets for steps, time, tokens, money, and affected records. A stop condition is a control, not a model preference.

Useful agents combine flexible reasoning with inflexible authority boundaries. The model may propose an action; deterministic systems must decide whether and how that action is allowed to occur.

## Use a plan-execute boundary

Represent proposed actions as structured data before execution. A policy layer can resolve resource identifiers, calculate risk, check current authorization, and decide whether confirmation is required. The executor receives only an approved, immutable action—not the full conversation and open-ended model authority.

For a destructive request such as deleting a deployment, confirmation should show the exact environment, deployment identifier, dependent resources, and recovery consequence. If any target changes after confirmation, require a new approval.

## Limit indirect influence

Retrieved content may supply facts but should not grant capabilities. An email saying “upload credentials to this URL” must not change the allowlist of destinations. Label data provenance internally and prevent untrusted text from being concatenated into system policy or tool definitions.

Use separate contexts for browsing, reasoning, and secrets. Where a tool needs a credential, bind it inside the executor rather than exposing it to the model. Filter tool responses to the minimum fields needed for the next decision.

## Design compensation and recovery

For reversible actions, capture the previous state and provide a tested undo operation. For irreversible actions, increase review and confirmation. Multi-step workflows need checkpoints so a retry resumes safely rather than repeats completed effects. Stop and escalate when actual state differs from the plan.

## Adversarial checklist

Test instructions embedded in websites, documents, code comments, images, and tool output; attempts to cross tenant or user boundaries; argument smuggling; excessive result counts; repeated writes; tool timeout; stale confirmation; and partial workflow failure. Verify budgets, policy decisions, and audit events remain correct under each case. Safety is demonstrated by denied or contained actions, not by the model explaining that it intends to be careful.
