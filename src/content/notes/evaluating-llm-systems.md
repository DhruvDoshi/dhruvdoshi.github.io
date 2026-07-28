---
title: Evaluate LLM systems as systems
author: Dhruv Doshi
date: 2024-06-01
reviewed: 2026-07-28
status: published
topic: AI governance
categories: [LLM Evaluation, AI Quality, Applied AI]
---

A language-model feature cannot be evaluated by trying a few prompts and deciding the answers look good. Its quality depends on the model, instructions, tools, retrieval, application logic, data, and user workflow. Evaluation must cover the system and the cost of its failures.

## Define the decision

Start with the task the user is trying to complete and the harm caused by an incorrect, incomplete, delayed, or inappropriate result. Translate that into observable criteria: factual support, task completion, citation correctness, policy compliance, format validity, latency, and cost.

Not every criterion should be collapsed into one score. A response that is fluent but exposes confidential data is a failure regardless of average quality.

## Build a representative set

Collect normal cases, important edge cases, adversarial inputs, ambiguous requests, and examples where the system should abstain or escalate. Preserve source and consent for production-derived data. Partition development and holdout sets so prompt tuning does not simply memorise the benchmark.

Use deterministic checks for structure, required citations, tool parameters, and policy rules. Human review remains necessary for nuanced correctness and usefulness. Model-based graders can increase coverage, but they need calibration against human judgments and should not grade with the same assumptions as the system under test.

## Evaluate components and the whole path

For retrieval, measure whether supporting evidence was found and ranked. For tool use, verify selection, arguments, authorization, and handling of tool failure. For generation, assess whether claims follow from supplied evidence. Then run end-to-end tasks because individually good components can interact badly.

NIST’s [Generative AI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence) extends the AI RMF with risks and actions specific to generative systems. It is a useful control catalogue, not a substitute for task-specific acceptance criteria.

## Make evaluation continuous

Run a stable regression suite for changes to models, prompts, indexes, tools, and policies. Add newly observed failures after review. Monitor production proxies and sampled outcomes, but do not treat thumbs-up rates as ground truth; feedback is sparse and selection-biased.

Version results with the complete system configuration. A model name alone is not reproducible evidence.

The goal of evaluation is not to prove an AI feature is intelligent. It is to define where it is dependable, detect when that boundary changes, and prevent unacceptable failure from reaching users.

## Create an evaluation specification

For each task, define input population, expected behavior, unacceptable outcomes, scoring method, reviewer guidance, and release threshold. Include examples of partial credit and disagreement. This turns evaluation from a demo into a repeatable engineering artifact.

Use exact checks where the answer is deterministic: JSON schema validation, allowed tool names, citation existence, permission boundaries, arithmetic, or known identifiers. Use rubric-based human review for relevance, clarity, supported reasoning, and contextual appropriateness. Keep safety and privacy as separate gates rather than averaging them into general quality.

## Calibrate model graders

If an LLM grades outputs, give it a narrow rubric and examples, randomise answer order for comparisons, and measure agreement against qualified human reviewers. Check whether the grader favors longer answers, familiar phrasing, or outputs from its own model family. Periodically resample graded cases for human audit.

Model graders are useful for triage and scale; they are not independent proof. Preserve the grader model, prompt, temperature, and rubric with each result.

## Test uncertainty and change

Run repeated trials for non-deterministic paths and report distributions, not only a best result. Test model timeouts, truncated context, tool errors, missing retrieval, malformed output, and policy refusal. Compare a proposed version with the production baseline on the same holdout set and define the maximum acceptable regression per critical slice.

## Release checklist

Require representative test coverage, protected holdouts, calibrated graders, component and end-to-end results, risk-specific thresholds, latency and cost budgets, reproducible configuration, and an owner for production review. After release, turn confirmed failures into regression cases while watching for test-set contamination and changing user behavior.
