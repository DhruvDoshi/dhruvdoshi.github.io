---
title: Architecture decision records that remain useful
author: Dhruv Doshi
date: 2022-06-01
reviewed: 2026-07-28
status: published
topic: Staff engineering
categories: [Architecture, Decision Records, Technical Leadership]
---

An architecture decision record is valuable only if a future engineer can understand what changed, why it changed, and when the decision should be reconsidered. Length is not the goal. Durable context is.

## Record the decision boundary

A practical record needs five things:

1. **Context:** the problem, constraints, and forces that matter.
2. **Decision:** the choice in direct language.
3. **Alternatives:** credible options considered and why they lost.
4. **Consequences:** benefits, costs, risks, and follow-up work.
5. **Revisit conditions:** evidence that would make the team reopen the choice.

“Use Kafka” is not a decision record. “Use the managed Kafka service for durable domain-event distribution because consumers require replay and independent scaling; do not use it for synchronous request-response workflows” establishes a boundary.

## Keep records close to the system

Store records in the repository that owns the decision when possible. Review them with the code or infrastructure change, link them from relevant runbooks and diagrams, and assign stable identifiers. A small index can show status—proposed, accepted, superseded, or deprecated—and link a superseded record to its replacement.

The original [ADR guidance by Michael Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) deliberately uses a small structure. The value comes from capturing the forces and consequences while they are still known, not from producing a large template.

## Separate approval from documentation

An ADR should preserve a decision; it should not become a universal approval gate. Match review to impact. A local, reversible library choice may need only the owning team. A cross-domain data contract or identity pattern needs representatives from affected teams and security. The review path should be explicit before authors start writing.

## Revisit with evidence

Good records include observable triggers: request volume exceeds the design range, a vendor ends support, recovery objectives change, or operating cost crosses an agreed threshold. Calendar reviews can help, but evidence-based triggers are more meaningful.

During incidents and migrations, update consequences rather than rewriting history. The original record should continue to explain why a once-reasonable choice was made.

The best ADRs reduce repeated debate. They let a new engineer challenge a decision with the same context the original team had—and with better evidence when the system has changed.

## Match the record to the decision

Not every choice deserves an ADR. Record decisions that are expensive to reverse, affect multiple teams, establish a security or data boundary, introduce a long-lived dependency, or constrain future designs. Routine implementation details belong in code and ordinary review. This keeps the decision index useful instead of turning it into a second commit log.

A decision record should name its scope. “Standardise asynchronous integration” is too broad if the actual choice applies only to customer-notification events. State the systems, environments, and teams affected, plus any explicitly excluded use cases.

## Example consequence model

Suppose a team chooses a managed event service over operating its own cluster. Immediate benefits may include reduced control-plane work, supported upgrades, and clearer availability commitments. Costs may include provider limits, data-transfer charges, reduced configuration freedom, and a migration dependency. Follow-up actions might cover schema governance, quota monitoring, disaster recovery, and cost ownership.

Writing consequences this way prevents a false binary of “approved” and “rejected.” Every architecture choice buys some properties by accepting others.

## Keep the lifecycle visible

Link records to code, diagrams, threat models, service catalogues, and delivery milestones. During review, check whether the implementation still matches the accepted decision. During an incident, link relevant findings back to the record and update its known consequences.

Do not edit an accepted record to make the past look cleaner. Add a dated amendment or superseding ADR. The historical chain explains how the system arrived at its present state and protects future teams from repeating discarded options without new evidence.

## Review checklist

An ADR is ready when a reader can identify the problem, decision owner, affected boundary, credible alternatives, trade-offs, implementation obligations, and revisit trigger. If the record cannot say what evidence would invalidate the decision, it is probably documenting a preference rather than an architectural judgment.
