---
title: Production RAG requires retrieval evidence and control
author: Dhruv Doshi
date: 2026-02-15
reviewed: 2026-07-28
status: published
topic: AI governance
categories: [RAG, LLM, Retrieval, Architecture]
---

Retrieval-augmented generation is often described as “search, then prompt.” A production RAG system is more accurately a governed information-retrieval system connected to a probabilistic synthesizer. Its quality depends on corpus ownership, permission-aware retrieval, evidence coverage, and explicit behavior when sources are insufficient.

## Define the answer contract

State what the system may answer, which sources are authoritative, how current information must be, and when it must abstain. Separate three output types:

- a statement directly supported by retrieved evidence;
- an inference that combines evidence but is not stated verbatim;
- general model knowledge that is outside the governed corpus.

For enterprise architecture recommendations, general model knowledge should not silently override approved standards or service metadata. The application should prefer current governed sources, mark inference, and refuse when the required evidence is missing.

## Build a permission-preserving corpus

Ingestion must retain source identity, owner, version, classification, effective dates, and access policy through parsing and chunking. Every indexed chunk needs enough metadata to reconstruct its origin and evaluate whether the requesting principal may retrieve it.

Deletion is part of ingestion. When a source is removed or access changes, derived chunks, embeddings, caches, and replicas must be updated within a defined objective. Otherwise the vector index becomes an uncontrolled copy of protected information.

## Use hybrid retrieval

Semantic search is useful for conceptual similarity, but exact terms matter for architecture: product identifiers, control numbers, region codes, runtime versions, and error messages. Combine lexical retrieval, vector similarity, metadata filters, and optional reranking.

A practical pipeline is:

1. normalise the query and identify required filters;
2. enforce tenant and document authorization;
3. retrieve lexical and vector candidates;
4. merge and rerank the candidates;
5. remove duplicates and allocate context across sources;
6. test whether evidence crosses the answer threshold;
7. generate with citations or abstain.

## Evaluate retrieval separately

Maintain representative questions with expected source documents and supported claims. Measure whether relevant evidence appears in the candidate set, whether it ranks high enough to reach the prompt, and whether citations actually support the answer.

End-to-end “answer quality” is not diagnostic. A wrong answer may come from a missing document, stale ingestion, weak filtering, poor ranking, context truncation, unsupported synthesis, or an application defect. Measure each boundary so the team knows what to change.

## Protect the generation boundary

Retrieved documents are untrusted input. They can contain instructions, malformed markup, hidden text, or examples that resemble system policy. Keep application instructions separate, label source content, constrain tool use outside the model, and validate structured output before it reaches another system.

For an architecture platform, use deterministic rules for mandatory controls and compatibility constraints. RAG can explain a recommendation, locate standards, and assemble evidence; it should not replace hard authorization or certification checks.

## Operate the complete system

Version the model, prompt, index, parser, embedding model, reranker, retrieval configuration, and policy. Record source identifiers and decision metadata with privacy controls. Monitor ingestion freshness, empty retrieval, citation coverage, latency, cost, authorization denials, and user-confirmed failures.

The [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) provides a useful Govern–Map–Measure–Manage structure for the complete system. The engineering objective is evidence-bounded assistance: useful when sources support it, explicit when inference is involved, and safe when the corpus cannot answer.
