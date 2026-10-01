---
title: "Third-party AI vendor risk management"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: AI governance
categories: [Vendor risk, Procurement, AI governance]
---

Enterprise AI systems are built on third-party components: foundation model APIs, embedding services, vector database vendors, agent frameworks, evaluation platforms, annotation providers. Each vendor is a dependency with its own security posture, reliability characteristics, data handling practices, and business viability. Vendor risk management for AI is traditional third-party risk management plus AI-specific risks that the traditional questionnaires do not cover.

This note is the practitioner's guide: what to assess, what to contract for, and how to manage the ongoing relationship.

## The AI-specific risk surface

Traditional vendor assessments cover information security, business continuity, and financial viability. AI vendors add risks in each category plus new ones.

Data usage and training. The critical question: does the vendor use your data — prompts, documents, fine-tuning datasets, feedback — to train their models? For foundation model providers, this determines whether your proprietary and customer data could surface in another customer's outputs. The answer must be contractual, not just a documentation claim. Look for explicit commitments, understand the difference between "we don't train on API data" and "we don't train on data from this specific product tier," and verify what happens to data in free tiers, trial tiers, and support interactions.

Data retention and deletion. How long does the vendor retain your inputs and outputs? Can you get zero-retention or reduced-retention terms? What is the actual deletion process — cryptographic erasure, logical deletion, backup expiry timelines? For regulated data, retention terms are compliance terms; get them in writing with specific timeframes, not "we retain data as needed."

Model behavior changes. Vendors update models continuously. A model version change can alter your application's behavior — output quality, safety characteristics, latency, even API semantics — without any change on your side. This is a reliability risk unique to AI vendors: your system's behavior depends on someone else's deployment cadence. You need version pinning, change notifications, and the contractual right to stay on a version while you validate.

Sub-processors and the AI supply chain. Your vendor's vendors matter. The annotation provider labeling your fine-tuning data, the cloud hosting the model, the third-party evaluation service — each has data access and security posture implications. Map the sub-processor chain for data access specifically: who can see your data, not just who processes it nominally.

Concentration and lock-in. Building deeply on one vendor's proprietary models, fine-tuning APIs, and agent frameworks creates switching costs that grow over time. The risk is not just price increases — it is behavioral: the vendor deprecating the model version you depend on, changing terms, or being acquired. Assess portability before you commit deeply: can your prompts, eval sets, and application logic move to another provider?

## The assessment process

Assess AI vendors with the traditional third-party risk process extended for AI specifics. The shape:

Tier by criticality. Not every AI vendor needs the same depth of assessment. Tier by data sensitivity (what data do they touch?), by criticality (what breaks if they fail?), and by switching cost (how hard is it to leave?). A spell-check API and your core foundation model provider are different tiers with different assessment depth. Define the tiers explicitly; ad-hoc assessment depth produces both over-engineering and gaps.

Security assessment. Standard diligence: SOC 2 reports, penetration test summaries, vulnerability disclosure programs, incident response capabilities, encryption practices, access controls. For AI vendors specifically, add: their own AI red-teaming practices (do they adversarially test their models?), their prompt injection defenses at the platform level, and their abuse monitoring (do they detect and respond to misuse of their platform that could affect you?).

AI-specific questionnaire. Build a standard set of AI questions asked of every AI vendor: training data usage policies with contractual references, retention and deletion specifics, model versioning and change notification practices, sub-processor lists with data access details, bias and safety testing practices, and incident notification commitments for AI-specific incidents (model behavior changes, data exposure through the model, abuse affecting your tenant).

Technical validation. Do not rely solely on documentation. Test data handling claims where possible: verify that zero-retention settings actually apply, test what happens to data in edge cases (failed requests, support tickets, cached responses). Test version pinning: confirm you can actually pin and that pinned versions behave stably. Technical validation catches the gap between documentation and implementation.

Business viability. AI vendor landscape churn is high. Assess funding, revenue trajectory, customer concentration, and acquisition likelihood for critical vendors. For startups, understand what happens to your data and your service continuity if they are acquired or shut down. Escrow arrangements for critical components and contractual transition assistance are worth negotiating for tier-one vendors.

## Contracting: what to get in writing

The contract is where risk management becomes enforceable. Key terms for AI vendors:

Data terms. Explicit prohibition on training on your data, specified retention periods, deletion commitments with timeframes, restrictions on human review of your data (support access, annotation), and data return/destruction on termination. These must be in the contract or a data processing addendum, not in a blog post.

Service terms. SLA commitments with meaningful remedies, version pinning rights, change notification periods (advance notice of model deprecations and behavior changes), and uptime commitments that reflect your dependency. For foundation models, negotiate the deprecation timeline for model versions you depend on — "we deprecate with 90 days notice" is very different from "we deprecate when we feel like it."

Security terms. Incident notification timeframes (including AI-specific incidents), right to audit (or reliance on current certifications), sub-processor change notification and objection rights, and security contact provisions. Ensure AI-specific incidents are explicitly in scope — a model update that degrades your application's safety is an incident for you even if the vendor considers it routine.

Exit terms. Data return formats and timelines, deletion certification, transition assistance periods, and clarity on what happens to fine-tuned models or customizations built on the vendor's platform. Negotiate exit when you have leverage — at signing, not when you want to leave.

Liability and indemnification. AI-specific IP indemnification (training data provenance is a live legal question — who bears the risk if the vendor's model generates infringing output?), and liability caps that reflect the actual risk. Understand what the vendor's standard terms exclude and negotiate the exclusions that matter for your use case.

## Ongoing management

Vendor risk management does not end at signing. AI vendors change faster than traditional vendors, and the management cadence should reflect that.

Continuous monitoring. Track vendor security posture (certification renewals, disclosed incidents, sub-processor changes), service behavior (your own monitoring of latency, quality, and behavior drift — do not rely on the vendor to tell you their model changed), and business health (funding news, leadership changes, acquisition rumors for critical vendors). Automate what you can: model output quality monitoring catches behavior changes that no notification will announce.

Periodic reassessment. Re-assess tier-one AI vendors annually at minimum, and on trigger events: model architecture changes, acquisitions, disclosed incidents, sub-processor changes affecting your data, and contract renewals. The vendor you assessed last year is not the vendor you have today — their models changed, their sub-processors changed, their terms may have changed.

Incident coordination. When the vendor has an incident affecting you — a data exposure, a model behavior change that breaks your safety properties, an outage — you need a defined coordination process: who at the vendor you contact, what information you expect, how you assess impact on your systems, and how you communicate to your own stakeholders. Establish this before the incident. The vendor's status page is not an incident coordination process.

Concentration review. Periodically review your AI vendor concentration: how much of your AI capability depends on each vendor, what the blast radius of each vendor's failure is, and whether your portability investments are keeping pace with your dependence. Growing dependence without growing portability is accumulating risk silently.

## AI vendor incidents: what goes wrong in practice

Understanding typical incident shapes helps you contract and prepare for them.

Silent model behavior changes. The vendor updates the model; your application's outputs shift — quality degrades on your eval set, safety properties change, formatting drifts. You discover it through your own monitoring, days later, because no notification was sent. Preparation: your own output quality monitoring on a fixed eval set, version pinning, and contractual change notification. Without these, you are debugging a system someone else changed.

Data exposure through the vendor. A vendor-side misconfiguration, a support engineer accessing your data beyond scope, or a sub-processor incident exposes your inputs. Preparation: data minimization (the vendor cannot expose what it never received), contractual incident notification with specific timeframes, and clarity on the vendor's access controls for your data.

Abuse of shared infrastructure affecting you. Another tenant's misuse triggers rate limiting, content policy changes, or capacity constraints that degrade your service. Preparation: contractual capacity and performance commitments, architectural isolation where the vendor offers it (dedicated capacity tiers), and fallback plans for degraded vendor performance.

Vendor business events. Acquisition, pivots, shutdowns, or pricing changes that invalidate your planning assumptions. Preparation: exit terms negotiated at signing, portability investments proportional to dependence, and business-health monitoring for tier-one vendors. The time to discover your vendor was acquired is not when the new owner announces new terms.

For each shape, define your detection (how you would know), your response (what you do in the first 24 hours), and your contractual coverage (what the vendor owes you). Write these down before the incident.

Negotiating leverage is highest before you are dependent. The terms that matter — training prohibitions, retention limits, version pinning, exit assistance — are hardest to get after you have built on the vendor. Front-load the negotiation: involve legal and security before the engineering team commits deeply, and treat "we'll sort out the contract later" as the risk decision it is. For tier-one vendors, consider competitive tension honestly — the ability to credibly switch is your best negotiating tool, which is another reason portability investments pay off.

## The build-vs-buy overlay

Vendor risk management connects directly to build-vs-buy decisions for AI capabilities.

Buy when the capability is undifferentiated and the vendor is strong: foundation models, standard embedding services, commodity vector databases. The vendor does it better and cheaper than you will, and the risk is manageable through the assessment and contracting above.

Build when the capability is differentiated or the data is too sensitive: proprietary fine-tunes on your most sensitive data, retrieval over your most confidential corpus, agent workflows encoding your core business logic. "Build" here often means self-hosting open models or building on your own infrastructure — not training foundation models from scratch.

The hybrid reality for most enterprises: buy the foundation, build the differentiation. Vendor-manage the foundation layer rigorously; own the layers where your data and logic live. And keep the portability option alive even for the bought layers — abstraction boundaries between your application and vendor-specific APIs are cheap insurance.

## Anti-patterns

Questionnaire-only assessment: sending the vendor a spreadsheet, receiving reassuring answers, and never validating technically or contracting the key terms.

Ignoring the AI-specific questions: running the standard infosec assessment and never asking about training data usage, retention, or model change practices.

Contracting the demo tier: negotiating terms for the enterprise tier while the team builds on the free tier with none of those protections.

No exit planning: discovering the switching cost when the vendor raises prices or deprecates your model version.

Set-and-forget vendor management: assessing once at procurement and never monitoring behavior drift, business changes, or sub-processor updates.

Shadow AI as unmanaged vendor risk: employees using AI tools the vendor management process never assessed. (This is the shadow AI problem wearing a procurement costume — it needs its own program, covered in a separate note.)

## Stated plainly

Assess AI vendors on data usage, retention, model change practices, sub-processors, and portability — not just standard infosec. Contract the key terms in writing: no training on your data, specific retention and deletion, version pinning with change notice, incident notification including AI-specific incidents, and exit terms. Monitor continuously for behavior drift and business changes, reassess periodically, and review concentration. The vendors are part of your system's risk surface; manage them like it. The cheapest time to manage vendor risk is before signing — the most expensive time is during the incident you did not prepare for.
