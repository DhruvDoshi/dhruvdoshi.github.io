---
title: "Fine-tuning vs RAG vs prompting: how to actually decide"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Enterprise AI
categories: [Fine-tuning, RAG, LLM]
---

Teams building on LLMs face a recurring decision: should we fine-tune a model, build retrieval-augmented generation, or just engineer better prompts? The discourse around this is noisy — fine-tuning maximalists, RAG maximalists, and prompt-engineering skeptics all claim their approach is the answer. The reality is that these are different tools for different problems, and most production systems need at least two of them. This note gives you the decision framework.

The core distinction: prompting and RAG change what the model knows at inference time. Fine-tuning changes what the model is — its weights, its tendencies, its behavior patterns. That difference determines everything about cost, risk, and maintainability.

## What each approach actually does

Prompting — including few-shot examples, chain-of-thought instructions, and structured output schemas — shapes behavior without changing the model. It is fast to iterate, cheap to test, and trivially reversible. Its limits: context window capacity, the model's base capabilities, and the fact that instructions compete with everything else in the prompt for the model's attention.

RAG grounds the model in external knowledge. It retrieves relevant documents at query time and includes them in the context. RAG's strength is dynamic knowledge: the corpus can change without touching the model, citations are natural, and access control can be enforced at retrieval time. Its limits: retrieval quality bounds everything (bad retrieval means bad answers regardless of model quality), latency increases, and the system is only as fresh and correct as the corpus.

Fine-tuning trains the model on your data, adjusting weights. It changes behavior patterns: tone, format adherence, domain reasoning style, task-specific skills. It does not reliably teach the model new facts — this is the most common misconception. Fine-tuning on factual corpora produces models that are confident about facts they still get wrong; the knowledge is smeared across weights in ways you cannot inspect or update surgically. What fine-tuning does well is behavior: making the model consistently follow your output format, reason in your domain's style, or handle your task's edge cases.

## The decision framework

Ask these questions in order.

First: is the problem about knowledge or about behavior? If the model needs to know things — your product documentation, your policies, your data — that is a knowledge problem, and the answer is RAG (or sometimes just a better prompt with the right context). If the model needs to act a certain way — always output valid JSON in your schema, follow your review rubric, write in your brand voice, handle your domain's reasoning patterns — that is a behavior problem, and fine-tuning is the candidate.

This single question resolves most of the debate. Teams fine-tune for knowledge and get unreliable memorization. Teams use RAG for behavior and get inconsistent formatting that no retrieval improvement fixes. Match the tool to the problem type.

Second: how fast does the knowledge change? RAG handles changing knowledge gracefully — update the corpus, and the system knows the new thing immediately. Fine-tuned knowledge is frozen at training time; updating it means retraining, revalidating, and redeploying. For anything that changes weekly or faster — product catalogs, policies, operational data — fine-tuning for knowledge is operationally indefensible. For stable knowledge, the trade-off is closer, but RAG still wins on inspectability: you can see exactly which documents informed an answer.

Third: what are your latency and cost constraints? RAG adds retrieval latency and larger prompts (retrieved context costs tokens on every query). Fine-tuning can reduce per-query cost — a fine-tuned smaller model often matches a larger base model on the specific task, at lower inference cost. If you have high query volume on a narrow task, the math can favor fine-tuning a small model over RAG with a large one. Do the arithmetic with your actual volumes; the crossover point is real but task-specific.

Fourth: what does your evaluation say? This is the question that should dominate and usually does not. Build the simplest version first — usually prompting, then RAG if knowledge is needed — evaluate it on representative tasks, and only add fine-tuning when you have measured a specific gap that fine-tuning addresses. "We think fine-tuning will help" is not a reason. "Our eval shows the model fails on these behavior patterns, and we have training data that demonstrates the correct behavior" is a reason.

## When fine-tuning is the right call

Fine-tuning earns its place in specific situations.

Format and schema adherence at scale. When you need a model to reliably produce structured output in your exact schema across thousands of varied inputs, fine-tuning on examples of correct output is highly effective. Prompting can get you most of the way, but the last stretch of reliability — the difference between 95% and 99.9% schema compliance — often needs the behavior baked into weights.

Domain reasoning patterns. Fields with distinctive reasoning styles — legal analysis, medical triage protocols, financial compliance checks — benefit from fine-tuning on demonstrations of expert reasoning in that style. The model learns the pattern, not just the facts.

Distillation for cost. Train a small model to mimic a large model's behavior on your specific task distribution. The small model runs cheaper and faster, and for narrow tasks it can match the large model's quality. This is one of the highest-ROI uses of fine-tuning: pay training cost once, save inference cost on every query forever.

Classification and structured prediction. Tasks with well-defined output spaces — intent classification, risk scoring buckets, routing decisions — are fine-tuning's home turf. These are the tasks where traditional ML always worked, and fine-tuned LLMs handle them with the added benefit of understanding nuance in the input.

What fine-tuning needs to succeed: quality training data (hundreds to thousands of high-quality examples demonstrating the desired behavior — garbage in, confidently wrong behavior out), a held-out evaluation set that measures the actual task (not training loss), and the operational capacity to retrain and revalidate on a cadence. Fine-tuning without eval is just expensive hope.

## When RAG is the right call

RAG is the default for knowledge-intensive applications, and the default is usually correct.

Enterprise Q&A over internal documents. The canonical use case. The corpus changes, access control matters, citations are expected, and the model needs to say "I don't know" when the corpus lacks the answer. RAG handles all of this structurally.

Freshness requirements. Anything where the answer depends on recent information — current product state, recent policy changes, operational data. RAG's update path is "update the corpus," measured in minutes. Fine-tuning's update path is a retraining pipeline, measured in days at best.

Multi-tenant knowledge boundaries. RAG lets you enforce access control at retrieval: the retriever only returns documents the current user is allowed to see. This is architecturally clean in a way that fine-tuning cannot match — you cannot easily un-teach a fine-tuned model one tenant's data.

Regulated and auditable answers. When you need to show your work — which sources informed this answer, for compliance or for user trust — RAG's retrieval trail is the mechanism. Fine-tuned knowledge has no provenance; you cannot point to the training example that produced a specific claim.

RAG's prerequisites, honestly stated: a corpus worth retrieving from (garbage documents produce garbage answers), a chunking and embedding pipeline you have actually tuned, and evaluation of retrieval quality separate from generation quality. Teams that skip retrieval evaluation and blame the model for bad answers are misdiagnosing their own system.

## When prompting is enough

Do not skip this option. A large fraction of enterprise LLM tasks are well-served by careful prompting on a capable base model.

Well-defined tasks with clear instructions. Classification, extraction, summarization, format conversion — tasks where the instruction is stable and the variation is in the input. Good prompting with few-shot examples handles these reliably.

Prototyping and exploration. Before building RAG infrastructure or a fine-tuning pipeline, prove the task is solvable with prompting. If a strong prompt on a strong model cannot do it, that tells you something important about the task's difficulty — and if it can, you just saved weeks.

Low-volume and variable tasks. When query volume is low and tasks vary widely, the fixed costs of RAG infrastructure and fine-tuning pipelines do not pay off. Prompting's per-query cost is higher, but there is no build cost, no maintenance cost, and no retraining cadence.

The prompting ceiling is real, though. When you find yourself writing a 3,000-word system prompt with dozens of few-shot examples and conditional branches, you have outgrown prompting. That mega-prompt is a RAG corpus or a fine-tuning dataset waiting to be properly structured. Recognize the symptom and refactor.

## Combining them

Production systems routinely combine all three, and the combinations are where the best results live.

RAG plus fine-tuning is the most common powerful combination: RAG provides the knowledge, fine-tuning provides the behavior. Fine-tune the model to use retrieved context well — to cite sources, to say "not in the documents" when appropriate, to follow your output format — and let RAG handle everything that changes. This separates the stable (behavior) from the dynamic (knowledge) along exactly the right boundary.

Prompting plus RAG is the starting point for almost everything: good prompts orchestrating good retrieval. Get this working and evaluated before adding fine-tuning.

Fine-tuning plus prompting is the cost play: a fine-tuned small model with a lean prompt, optimized for high-volume narrow tasks.

The architecture principle: put stable things in weights, dynamic things in retrieval, and task logic in prompts. When something changes, you want the change to touch exactly one layer. Knowledge updates touch the corpus. Behavior updates touch the fine-tune. Task variations touch the prompt. Systems where a knowledge change requires retraining, or a behavior change requires recorporating, have their layers confused.

## A worked example

Consider an enterprise IT support assistant: employees ask questions, the agent searches runbooks and ticket history, and it can reset passwords and provision standard software.

Start with prompting: a strong model with clear instructions handles common questions well. Measure the baseline. Add RAG over the runbook corpus and ticket history — knowledge changes constantly (new runbooks, new incidents), access control matters (some runbooks are team-restricted), and citations build trust. Measure again: retrieval recall on real questions, end-to-end resolution rate, freshness on recently added runbooks.

Now the measured gaps: the agent's responses are accurate but inconsistently formatted, and it sometimes skips the verification step before password resets. These are behavior gaps. Fine-tune a smaller model on demonstrations of correct behavior — proper format, always verifying identity before resets — and distill for cost, since support volume is high. RAG still supplies the knowledge; the fine-tuned model supplies the discipline. Each layer was added for a measured reason, and each can be changed independently when requirements shift.

## The evaluation imperative

Every claim in this note bottoms out in evaluation. The decision between these approaches is empirical, not philosophical.

Build a representative eval set before choosing: real queries, real documents, real edge cases, with known-good answers. Measure the prompting baseline. Add RAG and measure again — separately measuring retrieval quality and end-to-end quality. Only then consider fine-tuning, with a clear hypothesis about what behavior gap it addresses and training data that demonstrates the desired behavior.

Common evaluation failures: eval sets that do not resemble production queries, measuring only end-to-end quality (which hides whether retrieval or generation is the problem), and declaring victory on accuracy without measuring latency, cost, and freshness behavior. The approach that wins on accuracy but misses your latency SLA or freshness requirement did not win.

## Anti-patterns

Fine-tuning for knowledge: training on factual corpora and getting confident hallucinations with no provenance and no update path.

RAG for behavior: expecting retrieval to fix inconsistent formatting or reasoning style. It will not.

The mega-prompt: a prompt so large and branched it should have been a corpus or a dataset.

Skipping the baseline: building RAG or fine-tuning without ever measuring what prompting alone achieves. You cannot know what the complex approach bought you.

Fine-tuning without eval: training on vibes, deploying on hope, discovering the behavior gaps in production.

One-tool maximalism: insisting every problem is a fine-tuning problem, or a RAG problem, or a prompting problem. The tools compose; use them together.

## Stated plainly

Knowledge problems get RAG. Behavior problems get fine-tuning. Clear, stable tasks get prompting. Most production systems need at least two, composed along the boundary between what changes and what stays stable. Decide empirically: baseline, measure, add complexity only for measured gaps. And never fine-tune for knowledge — that way lies confident, unfixable wrongness.
