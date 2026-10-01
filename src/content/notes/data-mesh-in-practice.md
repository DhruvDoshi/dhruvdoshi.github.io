---
title: "Data mesh in practice"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Data engineering
categories: [Data Engineering, Data Governance, Architecture]
---

Data mesh arrived with a compelling diagnosis: the centralized data team is a bottleneck, domain knowledge lives with the teams that produce the data, and the monolithic data platform cannot keep up with organizational scale. The prescription — domain ownership of data products, data as a product, federated governance, a self-serve platform — is directionally right. But between the conference talks and production reality lies a graveyard of "mesh transformations" that renamed the data team, created a governance committee, and changed nothing about who does the work or how long it takes.

This note is about the gap: what domain ownership actually requires, what federated governance looks like when it is not theater, what the self-serve platform really costs, and how to tell whether a mesh is premature for your organization.

## The real problem: the bottleneck is real, but it is not the org chart

The mesh diagnosis starts from something true. In a centralized model, every dataset request flows through one data team: the team that understands the warehouse but not the domain, that must learn each new business context from scratch, that becomes a queue where domain teams wait weeks for a pipeline they could have described in an afternoon. As the company grows, the queue grows faster than the team, and data work slows to the pace of the scarcest resource.

But notice what the bottleneck actually is. It is not that one team owns the data; it is that data work requires two kinds of knowledge — platform knowledge (how to build reliable pipelines) and domain knowledge (what the data means) — and the centralized team has only the first while the domain teams have only the second. Every request pays a translation tax.

Data mesh's answer is to move the work to where the domain knowledge is: domain teams own their data products end to end. The platform team stops building pipelines and starts building the platform that lets domain teams build pipelines. This is a genuine insight. It is also a much harder organizational change than it sounds, because it requires domain teams to do work they did not sign up for, with skills they may not have, under standards they did not write.

## Prerequisite one: domain ownership means real accountability

"Domain ownership" is the most quoted and least implemented mesh principle. Real ownership has a specific shape, and most of what gets called ownership is missing pieces:

- **A named owner who can say no.** A data product needs a person (or a small team) with the authority to prioritize data work against feature work, to reject a consumer's request, and to set the product's roadmap. If the "owner" is a shared Slack channel, there is no owner.
- **Budget and headcount.** Owning a data product costs engineering time: building pipelines, maintaining quality, handling incidents, supporting consumers. If the domain team's roadmap has no room for this work — if data work is always the thing that slips when a feature deadline looms — ownership is fiction. The organization has to fund it, which usually means the domain team needs data engineering capacity inside the team, not borrowed from a central pool on request.
- **On-call for data.** A data product with an SLA needs someone paged when the SLA breaches. Domain teams that have never carried a pager for data will resist this, and their resistance is rational: it is new, unglamorous work. But a product nobody is on-call for is not a product; it is a side project.
- **Consumer relationships.** The owner talks to consumers, gathers requirements, announces breaking changes, and deprecates old versions. This is product management for data, and it is a skill most engineering teams have not practiced.

The failure mode to watch for: leadership declares domain ownership, the central data team is told to stop taking requests, and domain teams — given no headcount, no training, and no reduction in feature expectations — produce worse data products than the bottleneck ever did. The queue is gone, but so is the quality. This is decentralization as abdication, and it is the most common way mesh initiatives fail.

The honest prerequisite: domain ownership works when domain teams already have, or are given, the engineering capacity and the mandate to treat data as part of their product. If your domain teams are pure feature teams with no data skills and no appetite to acquire them, you do not have a mesh problem — you have a staffing and incentives problem, and no architecture will fix it.

## Prerequisite two: data as a product, with teeth

"Data as a product" means a dataset is treated with the discipline of a software product: discoverable, documented, trustworthy, with SLAs and a support path. In practice this decomposes into requirements that are easy to list and hard to sustain:

- **Discoverability.** A catalog where consumers can find the product, understand what it contains, and see who owns it. A catalog that is out of date is worse than no catalog, because it sends consumers to dead ends with confidence.
- **Documentation that answers real questions.** Not auto-generated column lists — those are table stakes — but semantics: what does "active" mean, what is the grain, what are the known caveats, what changed in the last six months. This documentation rots fast; it needs an owner and a review cadence, or it becomes archaeology.
- **Trustworthiness: SLAs and quality.** Freshness, completeness, and correctness objectives with monitoring behind them. A data product without quality SLAs is a dataset with a nicer name.
- **Addressability and access.** Consumers can actually get the data — through documented interfaces, with a sane access-request process — rather than filing a ticket and waiting.
- **Versioning and change management.** Breaking changes are announced, versioned, and migrated, not sprung on consumers.

The teeth are the point. A product standard that is not enforced is a suggestion. Enforcement can be centralized (the platform team gates publication on meeting the standard) or federated (peer review, automated checks in CI), but it has to exist. The teams that succeed here treat the product standard like an API contract: automated checks where possible, human review where judgment is needed, and no publication without both.

## Federated governance that is not theater

Governance is where mesh initiatives go to become committees. The mesh idea — governance decisions made by the people with the context, coordinated through federated standards rather than central mandates — is sound. In practice it degrades into one of two failure modes: the governance council that meets monthly, writes principles nobody reads, and has no enforcement power; or the central team that keeps all the real control and calls the rubber stamp "federation."

Governance that works has three properties:

**Standards are few, global, and automated.** The federated model works when the global standards are a short list of non-negotiables — security classification, PII handling, retention, access control, interoperability formats — and compliance is checked by machines, not meetings. A pipeline cannot publish a data product containing unencrypted PII because the platform blocks it, not because a council frowns. Automate the global rules; leave everything else to domains.

**Decisions have a venue and a decider.** "Federated" does not mean "nobody decides." For each governance question — who can access this dataset, how long is it retained, what does this field mean — there must be a named decider and a way to appeal. Ambiguity about who decides is how governance becomes theater: everyone discusses, no one resolves.

**Interoperability is the real governance product.** The highest-value thing federated governance produces is not policy documents but shared semantics: common identifiers, common definitions for core entities (customer, order, revenue), and standard interfaces between data products. Without this, domain ownership produces a dozen incompatible definitions of "customer" and the mesh is just silos with better branding. With it, domains can build on each other's products without endless translation. This is unglamorous, slow work — agreeing on what a customer is across five business units — and it is the work that determines whether the mesh composes or fragments.

## The self-serve platform tax

The mesh promise is that domain teams can build data products without deep platform expertise because the platform team provides self-serve infrastructure: templated pipelines, managed compute, built-in observability, one-click publishing to the catalog. This is the right division of labor. It is also expensive in ways that get underestimated.

Building a platform that genuinely abstracts the hard parts — and does not just move the complexity behind a YAML file nobody understands — is a multi-year investment by a strong platform team. The platform has to cover ingestion, transformation, orchestration, quality checks, catalog integration, access control, cost attribution, and incident tooling, all through interfaces simple enough for a domain engineer who thinks about data quarterly. Every rough edge in the platform becomes a support ticket, and the platform team becomes the new bottleneck — the same queue, now labeled "self-serve."

The tax has two components. First, the platform team's headcount and seniority: this is platform engineering, and it needs engineers who can build abstractions, not just operate infrastructure. Second, the ongoing cost of keeping the paved road paved: templates rot, managed services change, domain teams find the gaps. A self-serve platform is a product with customers, and it needs product investment indefinitely.

The trade-off to be honest about: a self-serve platform pays off when you have enough domain teams building enough data products that the leverage exceeds the platform cost. With three domain teams and a dozen pipelines, a central data team building those pipelines directly is cheaper and faster. The platform investment makes sense at the scale where central delivery has already broken — which brings us to the prematurity question.

## When a mesh is premature

Data mesh is an answer to a specific problem: organizational scale has made centralized data delivery untenable. If you do not have that problem, the mesh is overhead. Signs it is premature:

- **You can name every data producer and consumer.** If the data organization fits in one team and the stakeholders fit in a meeting, central ownership with good service habits beats federated ownership with ceremony.
- **Domain teams have no data engineering capacity and no path to get it.** Mesh without domain capacity is abdication, as discussed. If hiring or training that capacity is not on the table, do not start.
- **The bottleneck is tooling, not ownership.** Sometimes the central team is slow because the platform is bad — no CI, manual deploys, no testing. Fix the platform first; you may find the org chart was never the problem.
- **Leadership wants the label, not the change.** If the initiative is driven by conference enthusiasm rather than by a concrete pain (wait times, quality failures, inability to staff the central team), it will produce the artifacts of a mesh — catalog, council, principles — without the substance.

There is also a middle path that most organizations should consider before a full mesh: the **hub-and-spoke** or **embedded** model, where data engineers sit inside domain teams but report to (or are strongly affiliated with) a central data organization that sets standards, runs the platform, and manages careers. This gives you domain proximity without requiring every domain team to independently develop data engineering maturity. It is less ideologically pure than a mesh and more likely to work.

## Anti-patterns: the mesh theater checklist

- **Renaming without reassigning.** The central data team is renamed "platform team" or "mesh enablement," but keeps building every pipeline because domain teams cannot. The org chart changed; the work did not.
- **The catalog as a deliverable.** A quarter is spent evaluating and deploying a data catalog. It launches with 40% coverage and no freshness guarantees. Nobody trusts it, so nobody uses it, so nobody maintains it. A catalog is a product that needs the same ownership discipline as any data product — including its own SLAs.
- **Governance by document.** Principles are written, published, and never enforced. The test is simple: can you point to a decision that went differently because of the governance process? If not, it is theater.
- **Interoperability assumed.** Domains publish products with local definitions and no shared identifiers. Six months later, someone tries to join two domains' data and discovers the mesh is a set of disconnected islands. The shared-semantics work was skipped because it was hard and unglamorous.
- **Platform as a ticket queue.** The "self-serve" platform requires a ticket for every non-trivial operation. Domain teams wait on the platform team exactly as they once waited on the data team. Self-serve means self-serve: if a human must approve the common path, it is not self-serve.
- **Big-bang migration.** The organization attempts to convert all data ownership at once. Migrations of this kind fail the way all big-bang migrations fail: too much change, too little feedback. Mesh adoption should be incremental — one domain, one product, prove the model, then expand.

## How to start, and what good looks like

If the diagnosis fits — centralized delivery is genuinely the bottleneck, and leadership will fund domain capacity — start small and concrete:

1. **Pick one domain and one data product.** A domain with an engaged engineering team, a dataset with real consumers and real pain. Stand up the full model there: named owner, product standard, SLAs, catalog entry, on-call. This is your reference implementation.
2. **Build the thinnest viable platform.** Not the grand self-serve vision — the minimum that lets the pilot domain publish: templated pipelines, automated quality checks, catalog integration, access control. Expand based on what the pilot actually needed, not what the roadmap imagined.
3. **Write the global standards first, and keep them short.** Security, privacy, retention, interoperability formats. Automate their enforcement. Everything else is domain discretion until proven otherwise.
4. **Do the shared-semantics work early.** Agree on identifiers and core entity definitions before the second domain publishes. This is the cheapest time to do it and the most expensive time to skip it.
5. **Measure the things the mesh was supposed to fix.** Time from request to published data product, data incident rates, consumer satisfaction. If the pilot does not improve these, stop and understand why before expanding.

What good looks like at steady state: domain teams publish data products through a platform they rarely have to think about, consumers discover and trust those products because the SLAs hold, the global standards are enforced by automation rather than meetings, and the shared semantics let products compose across domains. The central team is small, senior, and focused on the platform and the standards — not on building everyone's pipelines. Governance is mostly invisible because it is mostly automated, and the visible part is a short list of decisions with named deciders. Nobody talks about "the mesh" anymore, because it stopped being a program and became how data work gets done. That quiet is the signal it worked.
