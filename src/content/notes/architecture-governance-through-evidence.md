---
title: Architecture governance should operate through evidence
author: Dhruv Doshi
date: 2027-06-16
status: scheduled
topic: Platform architecture
categories: [Architecture Governance, Standards, Enterprise Architecture]
---

Architecture governance is useful when it improves decisions and makes system risk visible. It becomes harmful when every change waits for a central meeting that lacks the context to make the decision.

## Match governance to impact

Classify decisions by reversibility, blast radius, data sensitivity, external obligation, cost, and number of affected teams. Local and reversible choices should stay with the owning team. Cross-domain contracts, identity boundaries, regulated data, and difficult-to-reverse platform choices deserve broader review.

Publish the thresholds. Teams should know before design begins which evidence is required and who has decision authority.

## Provide executable standards

A standard should include its purpose, scope, owner, required controls, reference implementation, validation method, exception path, and review date. Where possible, encode it in platform defaults, policy tests, templates, and CI checks. A slide deck that engineers must manually interpret will drift.

Use a small number of principles to guide cases a standard does not cover. Keep a catalogue of approved patterns and their boundaries, but avoid presenting patterns as universal solutions.

## Review evidence, not presentation quality

Ask for context, alternatives, threat model, reliability objectives, data flows, operating model, migration plan, and measurable consequences in proportion to risk. Link the decision record and resulting controls to the system inventory.

NIST’s [Secure Software Development Framework](https://csrc.nist.gov/Projects/ssdf) demonstrates how governance outcomes can be organised as practices and tasks rather than tied to one implementation. Architecture governance can use the same approach: state the required outcome and provide evidence-backed ways to satisfy it.

## Manage exceptions as information

Exceptions need an owner, rationale, compensating controls, expiry, and review trigger. Repeated exceptions may indicate an unrealistic standard or a missing platform capability. Analyse them as product feedback.

Measure review lead time, recurring findings, exception age, control adoption, and production outcomes. Do not optimise for the number of approvals completed.

The purpose of governance is distributed decision quality. Central architects should supply context, patterns, and challenge for high-impact choices while platforms and automated evidence make the safe path routine.
