---
title: Incident review culture for AI systems
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Reliability
categories: [Incident Management, AI Systems, Engineering Culture]
---

Incident review for traditional software asks what the system did wrong. Incident review for AI systems must also ask what the system did confidently, plausibly, and incorrectly — and why nobody noticed until a user complained. The probabilistic nature of model behavior changes what evidence matters and what "fixed" means.

## Review the failure, not just the outage

AI incidents rarely page anyone. A retrieval system serves stale policy for three weeks. A classifier silently degrades on a new document format. A support assistant gives wrong refund guidance to two hundred customers before anyone samples the transcripts. These are incidents even though no dashboard turned red.

Expand the incident definition to include quality failures discovered through sampling, user reports, evaluation regressions, and audit findings. The review process should trigger on impact and on evidence of systemic risk, not only on availability. A wrong answer delivered at scale is an outage of correctness.

## Reconstruct the decision path

A traditional timeline lists deploys, config changes, and alerts. An AI incident timeline must also capture the model version, prompt and instruction version, retrieval index version, embedding model, tool definitions, and the specific inputs that produced the failure. Without this, the review cannot distinguish a model regression from a data change from a prompt edit.

This is why versioning the complete system configuration matters. "The model" is not a sufficient identifier; the same model with different retrieval data is a different system. Incident tooling should capture the full configuration automatically at inference time, because reconstructing it after the fact is unreliable.

## Ask why the safeguards did not catch it

Every AI incident review should answer three questions beyond the proximate cause. First, why did evaluation not catch this before release — was the failure mode absent from the test set, or did the test set exist and the gate not run? Second, why did production monitoring not catch it — were the right quality signals instrumented, and were they reviewed? Third, why did users trust the output — was the uncertainty communicated, or did the interface present a guess as a fact?

These questions turn an incident into improvements in the evaluation suite, the monitoring, and the product surface. A review that only fixes the prompt will see the same class of failure again.

## Keep the review blameless and specific

Blameless review matters more for AI systems, not less. Model behavior is genuinely surprising even to its builders, and engineers will hide near misses if the review feels like a trial. But blameless does not mean vague. The output should name the specific control that failed — the missing eval case, the unversioned prompt, the unmonitored quality signal — and assign an owner and a date.

Distinguish three kinds of findings. System findings change the technology: better retrieval evidence, stricter abstention, versioned configuration. Process findings change the workflow: evaluation gates on prompt changes, sampling reviews for high-impact tasks. Product findings change the interface: uncertainty display, human approval steps, narrower autonomy.

## Feed failures back into evaluation

The most valuable artifact of an AI incident review is a new regression case. Every confirmed failure mode should become a permanent test: the adversarial query, the stale document, the ambiguous request, the permission edge. Over time the regression suite becomes a record of everything the system has learned the hard way.

Track repeat failure classes, not just repeat incidents. If retrieval misses cause three separate incidents in a quarter, the problem is not three prompts; it is the absence of an evidence contract. Incident review for AI systems succeeds when the same class of failure becomes structurally impossible, not when individual symptoms are patched.

## Practice on near misses

The best incident reviews happen before the incident. A near miss — the wrong answer caught by a reviewer, the permission edge discovered in testing, the evaluation regression that blocked a release — contains the same lessons as a production failure at a fraction of the cost. Organizations that review near misses build the reflexes that production incidents require.

Make near-miss review lightweight and routine. A short write-up: what almost happened, what caught it, what would have happened if it had not been caught, and what changes as a result. No meeting required for small ones; a monthly review of the collection for patterns. The pattern review is where the value compounds — three near misses of the same class are a finding about the system, not three anecdotes.

Reward the reporting. The engineer who flags that the assistant nearly disclosed restricted data in a demo has done the organization a real service. If near-miss reports disappear into a void, or worse, invite scrutiny of the reporter, the supply dries up and the lessons arrive later as incidents. Culture is what happens to the person who raises their hand.

Start the practice this month: pick one recent near miss, write the short review, and share what changed because of it. Culture is built from repetitions, and the first repetition is the hardest.
