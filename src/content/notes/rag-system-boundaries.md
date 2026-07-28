---
title: Define the boundaries of a production RAG system
author: Dhruv Doshi
date: 2024-04-01
reviewed: 2026-07-28
status: published
topic: AI governance
categories: [RAG, LLM, AI Architecture]
---

Retrieval-augmented generation connects a language model to external information, but it does not automatically make an answer correct, current, or authorised. A production design must define the boundaries of ingestion, retrieval, generation, and user trust.

## Establish the corpus contract

Identify which sources are authoritative, who owns them, how often they change, and which users may access each part. Preserve source identifiers, timestamps, versions, and access-control metadata through parsing and chunking. If the ingestion pipeline loses document permissions, retrieval can become a data-exfiltration path.

Measure freshness from source change to searchable representation. Define deletion behavior and prove that removed material disappears from indexes, caches, and derived stores.

## Treat retrieval as a system

Chunking, embeddings, filters, hybrid search, reranking, and context assembly are separate design choices. Evaluate them against representative questions and known relevant sources. Recall at a fixed result count, ranking quality, latency, and empty-result behavior matter more than whether a vector database is present.

Keep citations attached to the exact evidence supplied to the model. A generated link that was not part of retrieved context is not provenance.

## Constrain generation

Tell the model when to abstain, how to separate sourced statements from inference, and which operations require deterministic application logic. Validate output structure before another system consumes it. Treat retrieved text as untrusted input: documents can contain instructions intended to override the application.

The [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) organises AI risk work around governing, mapping, measuring, and managing. Those activities apply to the whole RAG pipeline, not only the model endpoint.

## Observe each boundary

Record retrieval query, filters, document identifiers, model and prompt versions, latency, token use, safety decisions, and user feedback with appropriate privacy controls. Do not log sensitive prompts and retrieved text by default.

Evaluate failure by layer: missing source, stale ingestion, poor retrieval, context truncation, unsupported synthesis, or application error. A single end-to-end accuracy score hides where the system needs improvement.

RAG is useful because it makes evidence available at inference time. Its credibility comes from access control, provenance, evaluation, and honest behavior when the evidence is insufficient.

## Design ingestion for traceability

Store the source URI, document version, section location, parser version, chunking policy, and ingestion timestamp with every chunk. A generated answer should be traceable back through the retrieved chunk to the exact source version. When parsing fails, quarantine the document and alert its owner rather than silently indexing incomplete text.

Chunk boundaries should reflect document structure where possible. Fixed token windows are simple but may separate a heading from its explanation or combine unrelated sections. Evaluate chunk size and overlap against actual questions, and avoid creating so many near-duplicates that ranking becomes noisy.

## Build retrieval in stages

Apply authorization and coarse metadata filters before semantic ranking. Combine lexical and vector retrieval when exact identifiers, product names, error codes, or policy clauses matter. Rerank a manageable candidate set using features appropriate to the task, then allocate context space across sources so one large document cannot crowd out all others.

Define an evidence threshold. When retrieval scores, source authority, or coverage are insufficient, the system should say that it cannot answer from the approved corpus. Returning a plausible answer from model memory defeats the purpose of grounded retrieval.

## Evaluate with diagnostic metrics

Maintain questions with expected source documents and supported answer claims. Measure source recall, ranking, citation precision, answer support, abstention quality, latency, and cost. Slice results by document type, user group, language, recency, and authorization path. A high overall score can hide failure on the most sensitive corpus.

## Production checklist

Verify source ownership, permission-preserving ingestion, deletion propagation, parser monitoring, retrieval evaluation, prompt-injection controls, citation binding, model abstention, privacy-safe traces, index backup, and an emergency disable path. Review incorrect answers by layer and assign the fix to the owning component instead of reflexively changing the prompt.
