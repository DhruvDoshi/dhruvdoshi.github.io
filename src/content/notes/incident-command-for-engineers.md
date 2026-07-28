---
title: Incident command is a coordination system
author: Dhruv Doshi
date: 2027-05-01
status: scheduled
topic: Staff engineering
categories: [Incident Management, Reliability, Leadership]
---

During a serious incident, technical skill is necessary but insufficient. Many responders changing the system without shared priorities can increase risk. Incident command creates a temporary coordination structure so investigation, mitigation, communication, and decision-making remain aligned.

## Assign explicit roles

The incident commander owns priorities, coordinates work, and decides when the response changes phase. They do not need to be the deepest technical expert and should avoid becoming the primary debugger.

Other useful responsibilities include:

- operations leads investigating and executing mitigations;
- a communications lead updating stakeholders and users;
- a scribe preserving timeline, hypotheses, decisions, and actions;
- subject-matter experts engaged for specific systems.

One person may hold several roles in a small event, but the responsibilities should still be named.

## Stabilise before explaining

Establish impact, affected users, start time, current risk, and immediate containment options. Prefer reversible mitigations: stop a rollout, shed non-critical load, disable a feature, fail over, or restore a known state. Root cause can wait when user harm is continuing.

Maintain a single incident record with timestamps, owners, and next update time. Separate facts from hypotheses. Every production change should have an executor, reviewer where possible, expected effect, and rollback condition.

Google’s [SRE incident management guidance](https://sre.google/workbook/incident-response/) describes a structured response with clear command, operational work, communications, and planning. The exact role names matter less than preventing hidden ownership and conflicting action.

## Manage responder load

Rotate people during long incidents. Handovers should state system state, active hypotheses, changes made, risks, and next actions. Invite expertise deliberately rather than filling the channel with observers. Psychological safety improves accuracy: responders must be able to report uncertainty and mistakes quickly.

## Close the response carefully

Recovery is not the same as resolution. Confirm user journeys, queues, data integrity, dependencies, and monitoring after metrics return to normal. Record follow-up owners before dissolving the command structure.

The review should examine technical and organisational conditions, including detection, tooling, permissions, and decision load. Incident command is effective when it helps experts apply their judgment without losing a shared picture of the event.
