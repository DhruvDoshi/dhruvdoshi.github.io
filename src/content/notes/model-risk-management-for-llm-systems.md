---
title: Model risk management for LLM systems in regulated industries
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: AI governance
categories: [AI Governance, Risk Management, Regulated Industries]
---

Regulated industries — banking, insurance, healthcare — have managed model risk for decades. Credit models, fraud models, and capital models all pass through validation functions that check conceptual soundness, data quality, and ongoing performance. Large language models break the assumptions that framework was built on, but the underlying expectations have not gone away. The task is translation, not exemption.

## What the existing framework expects

Traditional model risk management, shaped by guidance such as the US SR 11-7 framework widely mirrored internationally, rests on three pillars: development with clear design choices and limitations, independent validation separate from the builders, and ongoing monitoring with defined performance thresholds.

Regulators and internal risk functions will ask the same questions of an LLM system: What is it supposed to do? What data does it rely on? How do you know it works? How will you know when it stops working? "The model is from a reputable provider" is not an answer to any of these.

## Translate validation to generative behavior

Conceptual soundness for a generative system means documenting what the system is and is not designed to do, the boundaries of acceptable use, and the known failure modes of the approach — hallucination, prompt injection susceptibility, retrieval errors, and bias in generated content. This is a design document, not a model card; it describes the application, the prompts, the tools, and the controls, not just the base model.

Outcome analysis replaces backtesting. Since generative outputs have no single correct answer, validation defines acceptable behavior through evaluation: task-specific test sets, unacceptable-output definitions, human review protocols, and thresholds for release. The validation function should review the evaluation design itself — is the test set representative, are the graders calibrated, are the thresholds tied to actual risk?

Data assessment extends to the corpus. For retrieval-based systems, validators should examine source authority, data freshness processes, permission handling, and deletion propagation. Training and fine-tuning data need provenance and consent documentation.

## Keep validation independent and proportionate

Independence still matters: the people who built the prompt should not be the only ones who evaluate it. But independence must be proportionate to risk. A three-tier structure works well: standard review for internal productivity tools with human oversight, enhanced review for customer-facing or consequential systems, and full independent validation for high-stakes automated decisions.

Each tier defines its evidence requirements in advance. Teams should know before they build what documentation, evaluation, and monitoring their tier demands. Discovering the requirements at the validation gate is how projects die.

## Monitor what actually changes

Ongoing monitoring for LLM systems tracks a different set of signals than traditional models. Model and provider versions can change without an application deploy. Prompts get edited. Retrieval corpora grow stale. User behavior shifts the input distribution. Each of these can degrade performance silently.

Define the changes that trigger re-validation: model version changes, prompt or instruction modifications beyond editorial scope, retrieval source changes, new tools or permissions, and measured quality degradation beyond threshold. Automate detection where possible — version tracking on every component, continuous evaluation on a fixed probe set — and make the re-validation path fast for low-risk changes so it does not become a reason to avoid improving the system.

## Documentation as the deliverable

In regulated environments, the documentation is not overhead on the work; it is a primary work product. The model inventory entry, the validation report, the monitoring plan, and the incident record are what allow the organization to defend the system to a regulator, an auditor, or a court.

Build documentation generation into the delivery path so it is produced by normal engineering activity rather than reconstructed under pressure. Versioned prompts, evaluation results tied to releases, approval records, and incident logs should flow into the system record automatically. The organizations that do this find validation conversations straightforward. The ones that do not find them existential.

## Work with validators, not around them

The fastest way to slow down AI delivery in a regulated organization is to treat the validation function as an adversary. Validators who first encounter a system at the approval gate, with no prior context and a deadline, will ask for everything — because they have no basis for asking for anything specific. The delay that follows gets blamed on governance, but it was caused by the engagement model.

Bring validators in early, when the design is still forming. A thirty-minute conversation about the planned evaluation approach, before it is built, surfaces expectations while they are still cheap to meet. Share the evaluation design for comment, not just the results for approval. Validators who helped shape the evidence plan rarely reject the evidence.

This requires the development team to speak the validator's language: risk tiers, evidence standards, limitations and compensating controls, rather than model benchmarks and demo quality. It also requires validators to develop AI literacy — the failure modes of generative systems genuinely differ from those of scoring models, and validation criteria need to evolve. Organizations that invest in this shared understanding find that validation accelerates delivery by catching design problems early. The governance conversation works best as a design partnership, not a courtroom.
