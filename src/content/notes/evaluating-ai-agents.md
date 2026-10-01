---
title: "Evaluating AI agents: beyond task success rate"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: AI governance
categories: [Evaluation, AI agents, Metrics]
---

Task success rate is the metric everyone reports and almost no one should rely on alone. It tells you whether the agent completed the task — not whether it completed it well, safely, efficiently, or in a way you would accept from a human employee. For enterprise agents with tool access and real-world consequences, evaluation needs to go much deeper. This note is about building that deeper evaluation.

The stakes: an agent with 95% task success that occasionally exfiltrates data, takes twice as long as it should, or burns through your inference budget is not a 95% system. It is a system with unmeasured failure modes. Evaluation is how you find them before production does.

## Why task success rate misleads

Task success is usually judged by an LLM or a human looking at the final outcome: did the agent produce the right answer, complete the workflow, satisfy the request? This misses everything about how it got there.

The agent that succeeds by calling tools in a wasteful order still succeeded. The agent that succeeded but accessed data outside its scope still succeeded. The agent that succeeded on this run but would fail on a slight variation still succeeded. Binary success flattens all of this into a number that hides the dimensions you actually need to manage.

Worse, success rate is gameable — not maliciously, but structurally. Agents optimize for the appearance of completion: producing plausible outputs, skipping verification steps, avoiding the hard parts of a task. An evaluation that only checks outcomes rewards this. You need evaluation that checks the process.

## The evaluation dimensions

A complete agent evaluation covers at least these dimensions.

Correctness. Did the agent produce the right outcome? This is the dimension everyone measures, and you should keep measuring it — but decompose it. For multi-step tasks, measure per-step correctness, not just final outcome. A task can succeed despite a wrong intermediate step (the error got corrected or did not matter) or fail despite all steps being right (the final synthesis was wrong). Per-step measurement tells you where the weakness is.

Efficiency. How many tool calls, how many model calls, how much wall-clock time, how many tokens? Set budgets per task type and measure adherence. An agent that solves tasks but routinely exceeds its budget is not production-ready — it is a cost incident waiting for scale. Efficiency evaluation also catches a subtle failure: the agent that retries excessively, calls tools speculatively, or generates enormous intermediate outputs. These behaviors are invisible to success-rate evaluation and devastating to unit economics.

Safety and policy compliance. Did the agent stay within its authorized scope? Did it access only the data it should? Did it avoid the prohibited actions? This needs explicit test cases: adversarial scenarios designed to tempt the agent across boundaries. Measure not just whether it stayed safe on normal tasks, but whether it stayed safe when pushed.

Robustness. How does performance degrade on variations: rephrased requests, edge-case inputs, partial tool failures, unexpected tool responses? An agent that works on the happy path and collapses on variations is a demo, not a system. Build variation into your eval set deliberately — paraphrases, different orderings, missing optional information, tools that return errors.

Tool use quality. Did the agent select the right tools, with the right parameters, in the right order? Evaluate tool selection accuracy separately from task success: the agent that calls three wrong tools before finding the right one succeeded, but its tool use is poor and will be slow and expensive. Check parameter correctness too — the right tool with wrong parameters is a distinct failure mode, and in systems with consequential tools, it is the dangerous one.

Recovery behavior. When something goes wrong — a tool errors, a plan step fails, retrieved data is missing — does the agent recover gracefully? Test this explicitly: inject tool failures into eval scenarios and check whether the agent retries sensibly, replans, asks for clarification, or escalates. The agent that crashes or hallucinates past a tool error will do it in production.

Output quality. For tasks producing artifacts — reports, code, summaries, messages — evaluate the artifact itself: accuracy, completeness, format compliance, and appropriateness for the audience. An agent that completes the workflow but produces a sloppy report has not really succeeded from the user's perspective.

## Designing the eval set

The eval set is the evaluation. A good methodology on a bad eval set produces confident wrong answers.

Representativeness first. Your eval tasks must resemble production tasks in distribution: the same mix of easy and hard, the same input messiness, the same edge cases. Eval sets built from clean, idealized tasks overestimate production performance systematically. Include the ugly cases: ambiguous requests, incomplete information, contradictory inputs, the scenarios your support team actually sees.

Difficulty stratification. Label eval tasks by difficulty and report metrics per stratum. An agent at 90% overall that scores 40% on hard tasks is a different system from one at 90% with uniform performance. Stratification tells you whether the agent handles the cases that matter — which are usually the hard ones.

Adversarial cases. Include tasks designed to probe boundaries: requests that tempt scope violations, inputs containing injected instructions, scenarios where the efficient path and the safe path diverge. These are not edge cases; for a production agent, they are the cases that determine whether you have an incident.

Freshness. Eval sets go stale. Models and prompts change, production distributions shift, and agents overfit to known eval tasks (especially if eval tasks leak into training or prompt examples). Refresh the eval set regularly, keep a held-out portion that the development team never sees, and treat eval contamination as a serious integrity issue.

Size and statistical power. You need enough tasks per dimension to distinguish signal from noise. A 20-task eval set cannot tell you whether a 5% improvement is real. Size the eval set to the decisions it supports: bigger for release decisions, smaller for iteration. And report uncertainty — a success rate without a confidence interval is a guess with formatting.

## LLM-as-judge: useful and dangerous

Using LLMs to evaluate agent outputs is standard practice and genuinely useful — it scales where human evaluation does not. It is also full of traps.

The traps: judge models share the biases of the models they evaluate (they prefer verbose outputs, confident tone, and their own style), they are inconsistent across runs, they can be gamed by agents optimized against them, and they are unreliable on exactly the dimensions where you need reliability most — subtle correctness, safety judgments, domain-specific quality.

Use LLM judges with discipline. Calibrate them against human judgments on a sample: if the judge disagrees with humans on the cases that matter, the judge is wrong, not efficient. Use rubrics, not vibes — the judge should score against explicit criteria, and the criteria should be specific enough that two humans would agree on them. Use multiple judges or judge-plus-rules for high-stakes dimensions: a deterministic check for format compliance plus an LLM judge for content quality beats either alone.

Never let the judge be the same model with the same prompt as the agent. The shared blind spots compound. And never optimize directly against the judge without human verification — you will get an agent that pleases the judge and disappoints users. This is Goodhart's law with extra steps.

Human evaluation remains the ground truth for quality dimensions that matter: correctness on hard tasks, safety judgments, output appropriateness. Budget for it. A few hundred human judgments per release cycle is cheap compared to shipping a bad agent. Use humans where their judgment is irreplaceable and automation where it is sufficient.

## Evaluating the trajectory, not just the outcome

For agents, the path matters as much as the destination. Trajectory evaluation examines the sequence of actions: the tool calls, the intermediate reasoning, the recovery attempts.

What to check in trajectories: were the tool calls necessary (no wasted calls), were they in a sensible order (no doing step three before step one), did parameters derive correctly from prior outputs (no hallucinated IDs or values), and did the agent verify consequential actions before taking them? An agent that succeeds via a lucky trajectory — right answer, wrong process — will fail when luck runs out.

Trajectory evaluation also catches the failures that outcome evaluation cannot: the agent that accessed data it did not need (the outcome was fine, the access was not), the agent that skipped a required verification step (the result happened to be right), the agent that revealed its reasoning contained a plan to deceive (rare, but the kind of thing you want to know about).

Implement trajectory checks as a mix of deterministic rules (tool call sequences that violate policy, parameter values that do not trace to legitimate sources) and LLM review of the reasoning trace for the subtle cases. Log full trajectories in production for sampled sessions — you cannot evaluate what you did not record.

## Production evaluation: the system after deployment

Pre-deployment evaluation is necessary and insufficient. Production is a different distribution, and you need evaluation that runs there.

Shadow and canary evaluation. Run new agent versions alongside production: shadow mode (the new version processes real inputs but its outputs are not used) for safe comparison, canary (a small fraction of real traffic) for measured exposure. Compare on all dimensions, not just success rate. Promote only on evidence.

Sampled human review. Have humans review a sample of production trajectories regularly — weekly for high-volume systems. This catches the drift that automated metrics miss: the slow degradation in output quality, the new failure mode that no eval case covers, the changing user behavior that shifts the task distribution.

User feedback as a signal, with skepticism. Thumbs up/down, correction rates, escalation rates — these are useful but noisy. Users rate confident wrong answers highly and penalize correct agents that ask clarifying questions. Treat user feedback as one signal among many, and be particularly careful with it for safety dimensions where users cannot judge.

Incident-driven eval expansion. Every production incident should produce new eval cases. The incident is evidence of a gap in your eval set; closing the gap means the next agent version gets tested against it. This is how eval sets stay relevant: they grow from real failures, not just imagined ones.

## Who owns evaluation

Evaluation fails organizationally more often than technically. Someone needs to own the eval sets, the metrics, and the release gates — with the authority to block a deploy.

The pattern that works: a small platform or AI-governance function owns the evaluation infrastructure (the harness, the judge calibration, the production sampling pipeline), while product teams own their task-specific eval cases. The platform team ensures evaluations run, are trustworthy, and gate releases; the product teams ensure the eval cases reflect their actual users and risks. Neither can do it alone — platform-owned evals without product input test the wrong things, and product-owned evals without platform rigor decay into checkbox exercises.

Make evaluation visible. Dashboards showing per-dimension metrics per agent version, eval-gate results on every release candidate, and incident-to-eval-case traceability turn evaluation from a background activity into an engineering discipline. What gets measured and displayed gets maintained.

## Anti-patterns

Success-rate-only evaluation: the single number that hides efficiency, safety, and robustness failures.

Eval sets that do not resemble production: clean tasks, no adversarial cases, no messiness — measuring the demo, not the system.

Uncalibrated LLM judges: automated evaluation that disagrees with humans on the cases that matter, trusted anyway because it scales.

No trajectory logging: flying blind on process quality, discovering tool misuse only through incidents.

Static eval sets: the same tasks for a year while the system and the world change around them.

Optimizing against the judge: agents that please the automated evaluator and disappoint users.

## Stated plainly

Evaluate agents on correctness, efficiency, safety, robustness, tool use quality, recovery, and output quality — not just task success. Build eval sets that resemble production, including adversarial cases. Calibrate automated judges against humans. Evaluate trajectories, not just outcomes. And keep evaluating in production, because the system you shipped is not the system you tested — it is the system meeting the real world, which is always stranger than your eval set.
