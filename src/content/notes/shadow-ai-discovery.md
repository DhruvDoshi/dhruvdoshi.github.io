---
title: "Shadow AI: discovering and governing unsanctioned AI use"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Enterprise AI
categories: [Shadow AI, Governance, Discovery]
---

Shadow AI is the use of AI tools and services without IT or security approval: employees pasting customer data into public chatbots, teams building workflows on unvetted AI APIs, departments subscribing to AI features inside SaaS products nobody reviewed. It is shadow IT's successor, and it is more consequential — because the data involved trains models, crosses organizational boundaries, and creates compliance exposure that traditional shadow IT rarely did.

This note covers discovering shadow AI, understanding why it happens, and governing it without declaring war on your own employees.

## Why shadow AI is different from shadow IT

Shadow IT was about unapproved software. Shadow AI is about unapproved intelligence applied to your data — and the differences matter.

Data leaves differently. Traditional shadow IT stored your data in an unapproved SaaS; bad, but the data sat in a database you could eventually reclaim. Shadow AI sends your data to model providers where it may be used for training, retained under unknown terms, and reproduced in outputs to other customers. The blast radius of a data exposure through AI is structurally larger.

It is harder to see. Shadow IT showed up in procurement records, network traffic to known SaaS domains, and expense reports. Shadow AI hides in browser tabs — an employee using a public chatbot looks like normal web traffic. API usage from a personal key does not appear in your cloud bills. The AI features embedded in approved SaaS products activate without any new procurement event.

It spreads through productivity, not procurement. Nobody files a ticket to try a chatbot. The adoption path is: one employee finds it useful, tells the team, and within weeks a workflow depends on it. By the time governance notices, the tool is load-bearing for someone's job. Banning it at that point does not remove the need — it just drives the usage further underground.

The risk profile is asymmetric. Most shadow AI usage is benign in intent and risky in effect: the employee trying to work faster who pastes a customer list into a public model, the analyst uploading financial data for summarization, the developer sending proprietary code to an unvetted coding assistant. The intent is productivity; the effect is data exposure under terms nobody read.

## Discovery: finding what is actually in use

You cannot govern what you cannot see. Discovery is the first and hardest phase.

Network and endpoint signals. Work with your network security team to identify traffic to known AI service domains — public chatbot frontends, AI API endpoints, AI feature endpoints within SaaS products. This catches the browser-based usage and the API calls from corporate networks. It misses personal devices and personal networks, which is a significant blind spot for remote workforces — acknowledge it rather than pretending the coverage is complete.

CASB and SaaS management platforms. If you operate a cloud access security broker or SaaS discovery tooling, extend its catalog to AI services specifically. Many of these platforms now maintain AI service registries. This gives you the SaaS-embedded AI usage: the AI features inside your CRM, your productivity suite, your support platform — which are shadow AI when unreviewed, even though the parent SaaS is approved.

Financial signals. Expense reports, corporate card transactions, and team budgets reveal AI subscriptions: per-seat AI tool licenses, API usage billed to team cards, AI add-ons to existing SaaS. Finance is an underused discovery partner — the subscriptions leave money trails even when they leave no IT trail.

Surveys and amnesty programs. Ask employees what AI tools they use, with explicit amnesty: no punishment for honest disclosure during the discovery window. This sounds soft; it is the highest-signal discovery method available. The tools your network monitoring misses — personal devices, personal accounts, offline workflows — surface here. Frame it as enabling safe usage, not as an investigation. The goal is a complete inventory, and fear produces incomplete inventories.

Code and configuration scanning. Scan repositories and infrastructure for AI API keys, SDK usage, and model provider dependencies. Unvetted AI integrations in codebases are shadow AI with engineering leverage — a prototype built on a personal API key that quietly became production. Key scanning catches the credentials; dependency scanning catches the SDKs.

Data flow analysis. For the highest-risk discovery, trace where sensitive data goes: DLP alerts involving AI service destinations, unusual outbound data volumes to unrecognized endpoints, and customer data appearing in contexts it should not. This is incident-driven discovery, but it finds the cases that matter most.

## Categorizing what you find

Discovery produces a list. The list needs triage, because not all shadow AI is equal.

Risk-tier the findings. Tier one: AI services processing customer PII, financial data, health data, or other regulated information under unknown terms. Tier two: AI services processing internal confidential data (strategy documents, proprietary code, unreleased financials). Tier three: AI services used for low-sensitivity productivity (writing assistance, brainstorming, general research with no company data). The tiers determine response urgency and the governance path.

Distinguish the patterns. Individual experimentation (one employee trying a tool) needs enablement, not enforcement. Team workflows (a department depending on an unvetted tool) need expedited review and a migration path. Embedded features (AI inside approved SaaS) need vendor assessment of the AI component specifically. Production dependencies (unvetted AI in shipping code or critical workflows) need immediate risk treatment.

Map the data. For each finding, determine what data it touches: categories, sensitivity, volume, and whether the usage violates specific regulatory or contractual obligations. A public chatbot used for drafting emails is a different conversation from the same chatbot used with customer records. Data mapping turns a scary list into a prioritized plan.

## The governance response

The goal is safe AI usage, not zero AI usage. Organizations that respond to shadow AI with blanket bans get the worst of both worlds: the bans are evaded, the risk continues, and the governance team loses credibility.

Provide approved alternatives. The single most effective shadow AI control is a sanctioned path that meets the underlying need. If employees use public chatbots because there is no approved alternative, deploy one — an enterprise AI assistant with proper data handling, or approved vendor relationships with the right contractual terms. Every shadow AI finding is a requirements signal: someone needed this capability and the organization did not provide it. Treat the signal as valuable.

Expedited review for discovered tools. When discovery surfaces a tool with real adoption, run it through a fast-track assessment: data handling terms, security posture, business viability. Approve it, approve it with conditions (no customer data, specific data handling), or reject it with a sanctioned alternative. The review must be fast — weeks, not quarters. A slow review process is what created the shadow usage; repeating it as the response teaches employees that the official path does not work.

Targeted enforcement for the high-risk tier. Tier-one findings — regulated data under unknown terms — need direct intervention: stop the data flow, assess exposure, determine notification obligations. This is incident response, not governance debate. Be direct with the affected teams about what happened and why it matters, without blame — blame drives the next discovery underground.

Policy that reflects reality. Write the AI acceptable-use policy after discovery, not before. A policy written without knowledge of actual usage bans things people need and permits things that are risky. Ground the policy in the discovered inventory: what is approved, what is conditionally approved, what is prohibited, and what the process is for requesting new tools. Keep it readable — a policy nobody reads governs nothing.

## Preventing recurrence

Discovery and response handle the present. Prevention handles the future.

Reduce the friction of the approved path. Every approval process, every procurement delay, every unmet capability need is a shadow AI incubator. The long-term fix is making the sanctioned path the path of least resistance: easy access to approved AI tools, a fast intake for new requests, and proactive deployment of capabilities teams actually want. Governance that only says no is governance that gets bypassed.

Continuous discovery, not one-time inventory. Shadow AI is not a project with an end date; new tools appear constantly, and usage patterns shift. Build discovery into ongoing operations: network monitoring rules maintained, financial reviews periodic, surveys annual, code scanning in CI. The inventory should be a living system, not a spreadsheet from last year.

AI literacy as a control. Most shadow AI risk comes from employees who do not understand what happens to data they paste into AI tools. Training — short, specific, scenario-based — is a genuine control: "here is what happens to data in the approved assistant versus a public chatbot, here is what you must never paste into unapproved tools, here is how to request a new tool." Literacy does not replace technical controls, but it reduces the volume of risky usage at the source.

Vendor management integration. Feed discovered AI tools into the vendor risk process: the AI features in your SaaS stack need the same assessment as standalone AI vendors (data usage, retention, sub-processors). Procurement should flag AI capabilities in SaaS renewals and new purchases. Shadow AI discovery and vendor risk management are two views of the same problem — connect them organizationally.

## When shadow AI becomes the incident

Sometimes discovery finds not just usage but exposure: customer data was sent to a public model, regulated information went to an unvetted API, proprietary code went to an external coding assistant. At that point this is incident response, not governance planning.

Assess the exposure first: what data, whose data, how much, over what period, and under what terms did the vendor receive it. Pull the vendor's data handling terms as they existed during the exposure window — terms change, and the historical terms govern. Determine whether training on your data was possible under those terms; if yes, assume the worst for sensitivity assessment purposes.

Determine notification obligations: contractual obligations to customers, regulatory breach notification requirements, and internal escalation paths. This assessment needs legal involvement early — the notification clock in most regimes starts at discovery, not at full understanding.

Contain and remediate: stop the data flow, work with the vendor on deletion where the terms allow it (and document where they do not), rotate any credentials that were exposed, and review whether the exposure pattern exists elsewhere. Then feed the incident back into the program: the discovery gap that allowed it, the missing approved alternative that drove it, and the new eval case for the monitoring rules.

Handle the people with care. The employee who caused the exposure was usually trying to work faster, not to cause harm. A punitive response teaches everyone to hide the next one. Accountability for the process failure belongs with the governance program that left the need unmet — fix the program, educate the person.

## Measuring the program

Track what tells you whether shadow AI risk is decreasing.

Inventory coverage and freshness: what fraction of known AI usage is assessed, and how current is the inventory? A growing unassessed fraction means discovery is falling behind.

Time-to-assessment for discovered tools: how quickly does a discovered tool get reviewed? This measures whether the governance path is viable or whether it recreates the friction that caused shadow usage.

Approved alternative adoption: are employees actually using the sanctioned tools? Low adoption of approved alternatives while shadow usage persists means the alternatives do not meet the need — fix the alternatives, not the employees.

High-risk finding trend: is the count and severity of tier-one findings decreasing? This is the outcome metric. Everything else is activity.

Incident linkage: what fraction of AI-related incidents trace to previously unknown shadow usage? A decreasing fraction means discovery is working.

## Anti-patterns

The blanket ban: prohibiting AI tools without providing alternatives. Drives usage underground and destroys governance credibility.

Punitive discovery: treating the inventory exercise as an investigation. Produces incomplete inventories and resentful employees.

One-time inventory: discovering shadow AI once, writing a report, and never looking again.

Policy before discovery: writing acceptable-use rules without knowing what is actually in use.

Ignoring SaaS-embedded AI: governing standalone tools while AI features inside approved SaaS go unassessed.

Review processes slower than shadow adoption: a six-month assessment queue for tools teams adopt in a week.

## Stated plainly

Shadow AI is unapproved AI usage driven by real productivity needs, carrying data exposure risks that traditional shadow IT did not. Discover it through network signals, financial trails, amnesty surveys, and code scanning. Triage by data risk, respond with approved alternatives and fast-track review rather than blanket bans, and prevent recurrence by making the sanctioned path the easiest path. Govern the need, not just the tool — the employees were trying to get work done, and the governance program that helps them do it safely wins over the one that just says no.
