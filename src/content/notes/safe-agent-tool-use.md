---
title: Design safe tool use for AI agents
author: Dhruv Doshi
date: 2027-03-16
status: scheduled
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
