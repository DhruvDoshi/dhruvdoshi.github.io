---
title: "Choosing a vector database: what actually differentiates them"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Enterprise AI
categories: [Vector databases, RAG, Architecture]
---

The vector database market has a marketing problem: every product claims to be the fastest, most scalable, most accurate option, and the benchmarks they publish are engineered to prove it. Meanwhile the actual decision usually comes down to a handful of factors that have little to do with benchmark leaderboards. This note is about those factors — the ones that determine whether your choice survives contact with production.

The uncomfortable truth first: for most enterprise RAG systems, the vector database is not the bottleneck and not the differentiator. Retrieval quality is dominated by chunking strategy, embedding model choice, and hybrid search design. The database is plumbing. Important plumbing — you need it to be correct, available, and operable — but the teams that agonize over vector DB benchmarks while shipping naive chunking are optimizing the wrong layer.

## Start with the shape of your problem

Before comparing products, characterize your workload. The dimensions that matter:

Corpus size and growth. A hundred thousand documents and ten million documents are different problems. At the small end, almost anything works, including not having a vector database at all. At the large end, sharding, distributed indexing, and incremental updates become the actual decision criteria.

Query patterns. Are queries uniform, or do you have hot subsets? Do you need filtered search — "find documents like this, but only from this department, published after this date"? Metadata filtering is where vector databases diverge sharply in practice. Some handle rich filtering elegantly; others treat it as an afterthought and performance falls off a cliff when filters are selective.

Update frequency. A corpus that is rebuilt nightly is a different system from one with continuous ingestion and a freshness SLA. Incremental index updates, delete handling, and consistency during updates separate the serious options from the demos.

Multi-tenancy. Enterprise systems almost always need tenant isolation: per-customer or per-department data boundaries. Whether the database supports namespaces, per-tenant indexes, or logical partitioning — and what the performance implications are — matters more than raw query speed for most buyers.

Latency and throughput requirements. Be specific and honest. "Fast" is not a requirement. A p95 target for query latency and a queries-per-second target, tied to your actual user experience, lets you evaluate whether a product fits instead of comparing marketing numbers.

## The architectural fork: dedicated vs. embedded

The first real decision is not which vector database, but whether you need a standalone one.

Dedicated vector databases — purpose-built systems for vector search — make sense when vector search is a core, high-scale workload with demanding latency or freshness requirements. They invest in the indexing algorithms, the distributed architecture, and the operational tooling for exactly this job.

Embedded or integrated options — vector search inside your existing Postgres, your search engine, or your data platform — make sense far more often than the dedicated vendors want you to believe. If you already operate Postgres and your corpus fits comfortably, the pgvector extension gives you vector search with zero new infrastructure, your existing backup and access control story, and one less system to operate. The performance is fine for a large fraction of real workloads. The operational simplicity is worth more than a benchmark delta you will never feel.

The honest decision framework: start with what you already operate. Add a dedicated system when you have measured a specific limitation — latency, scale, freshness, filtering — that the integrated option cannot meet. "We might need scale later" is not a reason to take on a new distributed system today. Migration between vector stores is genuinely painful (re-embedding and re-indexing a large corpus is a project), so this is a decision worth getting right, but the bias should be toward simplicity until the workload proves otherwise.

Anti-pattern: choosing the dedicated vector database first because the RAG tutorial used it. Tutorials optimize for getting started quickly, not for operating the system for three years.

## What actually differentiates them

Once you have decided you need a dedicated system, here is what separates the options in production.

Indexing algorithms and their trade-offs. Most systems offer variants of HNSW for approximate nearest neighbor search, sometimes with quantization options (product quantization, scalar quantization) for memory efficiency. The practical differences: build time for large indexes, memory footprint at scale, and how gracefully accuracy degrades under quantization. These matter at millions of vectors; below that, they are interchangeable. Do not let an indexing algorithm debate drive a decision for a hundred-thousand-document corpus.

Filtering architecture. This is the underrated differentiator. Pre-filtering (apply metadata filters before vector search) is correct but can be slow when filters are unselective. Post-filtering (vector search first, then filter) is fast but can return too few results when filters are selective. The best systems do something smarter — filtered search integrated with the index traversal. Ask vendors specifically how they handle selective filters at your scale, and test it with your actual filter patterns. A system that is fast on unfiltered benchmarks and slow on your filtered queries is the wrong system.

Consistency and freshness. When you write a document, how quickly is it searchable? Some systems offer tunable consistency; others have background indexing with lag. If your use case includes "user uploads a document and asks about it immediately," freshness is a hard requirement, not a nice-to-have. Test the write-to-searchable path under load, not just in isolation.

Hybrid search support. Pure vector search is rarely the best retrieval strategy for enterprise corpora. The systems that natively support hybrid search — combining vector similarity with keyword/BM25 scoring, with tunable weighting — save you from bolting on a second system. If you plan to do hybrid retrieval (and you should evaluate it), native support is a significant advantage.

Operational maturity. Backup and restore, monitoring integrations, access control, audit logging, high availability configuration, upgrade procedures. This is the boring stuff that determines your on-call experience. A vector database with brilliant search and no backup story is a liability. Evaluate the operational surface with the same rigor as the query surface: read the docs on disaster recovery before you read the benchmarks.

Ecosystem and lock-in. Consider the client libraries, the framework integrations, and — critically — how hard it is to leave. Proprietary query languages, proprietary metadata models, and managed-only features increase switching costs. Open formats and standard APIs keep your options open. You will not switch often, but the ability to switch is leverage in every vendor conversation.

## The managed vs. self-hosted decision

Managed vector database services trade money for operational burden. Self-hosting trades operational burden for control and, at scale, cost.

The managed option wins when your team does not have the capacity to operate another distributed system well. "Well" is doing a lot of work in that sentence — a poorly operated self-hosted vector database is worse than a managed one in every dimension: slower, less available, and a source of incidents. Be honest about your team's operational capacity. If you are already stretched thin operating your existing stack, managed is the right call regardless of the price difference.

Self-hosting wins when you have strict data residency or sovereignty requirements that managed options cannot meet, when your scale makes the managed premium genuinely painful, or when you need customization the managed service does not offer. For Canadian public-sector and regulated-enterprise contexts, data residency is often the deciding factor — verify where the managed service actually stores data and whether that satisfies your requirements, in writing.

The hybrid reality: many teams self-host in development and use managed in production, or use managed until scale justifies bringing it in-house. Both are reasonable. What is not reasonable is self-hosting in production without a runbook, without backup testing, and without someone who understands the indexing internals well enough to debug a corrupted index at 2 AM.

## Evaluation: how to actually test

Vendor benchmarks are not your workload. Run your own evaluation, and make it representative.

Build a test corpus from your actual documents — not a sample of clean, uniform files, but the messy reality: PDFs with tables, scanned documents, long reports, short memos, the formats your users actually have. Chunk it the way you plan to chunk in production. Your retrieval quality depends on this pipeline as much as on the database.

Create a labeled query set. You need questions with known-good answers tied to specific documents. A few dozen is enough to start; a few hundred is better. This is the same evaluation set you should be using for your RAG system overall — the vector database evaluation and the RAG evaluation are the same project, and teams that evaluate them separately end up optimizing the database for queries their RAG system never issues.

Measure what matters to you: query latency at your expected concurrency (not single-query latency in isolation), indexing throughput for your update patterns, filtered query performance with your actual filters, and recall on your labeled set. Measure under sustained load, not just in bursts — vector databases, like all databases, have failure modes that only appear when the system is warm and busy.

Test the failure modes deliberately. Kill a node during indexing. Restore from backup. Upgrade the version. Run a query storm. The evaluation that only tests the happy path teaches you nothing about the system you will operate.

## The embedding model decision

The vector database stores embeddings, but the embedding model determines what those vectors mean — and therefore what retrieval can possibly find. This decision deserves at least as much attention as the database choice.

Match the embedding model to your corpus and queries. General-purpose embedding models handle diverse enterprise content well; domain-specific corpora (legal, medical, technical documentation with heavy jargon) often benefit from models tuned or fine-tuned on similar text. Evaluate on your labeled query set: swap candidate embedding models and measure recall before you commit, because changing embeddings later means reprocessing the entire corpus.

Watch dimensionality as a cost lever. Higher-dimensional embeddings capture more nuance but cost more to store and search. For many enterprise corpora, the quality difference between a well-chosen smaller model and a larger one is negligible on actual queries — test rather than assume. And pin your embedding model version: silent model updates from a provider change your vectors and invalidate your index without warning. Version-pinning and a re-embedding runbook are part of operating the system, not optional extras.

## Cost modeling

Vector database costs have a way of surprising teams. Model the full picture.

For managed services: query volume pricing, storage pricing, and the cost of the index build and rebuilds. Watch for pricing dimensions that scale with your usage in ways you did not expect — some services charge per query in a way that makes high-QPS applications expensive, others charge for dimensions or metadata in ways that penalize rich schemas. Model your actual projected usage, not the free tier.

For self-hosted: compute, memory, and storage for the cluster sized to your corpus with headroom, plus the engineering time to operate it. Memory is usually the dominant cost for vector indexes — size your instances for the index in memory with room to grow, and understand how quantization options trade accuracy for memory before you need them.

The hidden cost in both models: re-embedding and re-indexing. When you change embedding models — and you will, as better models appear — you reprocess the entire corpus. Budget for this as a recurring operational event, not a one-time migration. Systems that make bulk re-indexing easy and observable earn their keep here.

## Anti-patterns

Benchmark-driven selection: choosing based on published benchmarks that do not resemble your workload, then discovering the filtering or freshness behavior in production.

Premature dedication: deploying a standalone vector database for a workload that Postgres with pgvector would have handled, and now operating two systems.

Ignoring the write path: evaluating query performance exhaustively while never testing ingestion throughput, update freshness, or delete handling.

No exit plan: adopting proprietary features with no migration path, then discovering the switching cost when pricing changes or requirements shift.

Treating the database as the retrieval strategy: expecting the vector store to fix bad chunking, wrong embeddings, or missing hybrid search. It will not.

## The decision, stated plainly

For most teams: start with vector search in the database you already operate. Move to a dedicated system when you have measured a specific limitation. When you do move, decide on filtering architecture, freshness guarantees, operational maturity, and data residency — not benchmark leaderboards. Evaluate with your documents, your queries, your filters, and your failure modes. And remember that the database is one component of a retrieval system; the chunking, the embeddings, and the hybrid strategy matter at least as much as where the vectors live.
