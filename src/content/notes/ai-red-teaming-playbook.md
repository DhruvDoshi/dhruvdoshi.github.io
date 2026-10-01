---
title: "AI red teaming: a practical playbook for enterprise teams"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: AI governance
categories: [Red teaming, Security, AI safety]
---

AI red teaming is the practice of adversarially testing AI systems before attackers do. It borrows the name from cybersecurity red teams, and the analogy is useful but incomplete: you are not just testing for vulnerabilities in code, you are testing for failures in behavior — the model doing the wrong thing, the agent taking the wrong action, the system leaking what it should protect. This note is a practical playbook for teams that need to stand up red teaming for enterprise AI systems.

Start with the honest framing: red teaming does not make your system safe. It finds specific failures so you can fix them, and it builds an evidence base for risk decisions. A red team engagement that finds nothing either tested too little or tested the wrong things. Scope it, run it, fix what it finds, and run it again.

## What you are actually testing

Enterprise AI red teaming covers four layers, and engagements fail when they only test one.

The model layer: does the model refuse what it should refuse, and comply with what it should comply with? This is the layer most public red-teaming discussion focuses on — jailbreaks, prompt injection, harmful content generation. It matters, but for enterprise systems it is rarely the layer where the worst failures live.

The application layer: does the system built around the model behave safely? This includes the prompt construction, the retrieval pipeline, the output handling, and the user interface. Most real-world AI failures are application-layer failures: the RAG system that retrieves the wrong tenant's documents, the agent with overbroad tool access, the chatbot that confidently presents fabricated citations.

The agentic layer: when the system can take actions, what can an attacker make it do? Tool misuse, privilege escalation through the agent's permissions, data exfiltration via tool parameters, and multi-step attacks where each step looks benign in isolation. Agentic systems need red teaming that thinks in attack chains, not single prompts.

The data and infrastructure layer: the training data, the retrieval corpus, the vector database, the logging pipeline. Poisoned documents in the corpus, unprotected endpoints, logs that leak PII — the AI system inherits the security posture of everything it touches.

Scope your engagement across all four layers, weighted by where your system's actual risk is. A customer-facing chatbot with no tools is mostly a model and application problem. An internal agent with database access is mostly an agentic and data problem.

## Building the team

Red teaming is a skill, and the skill is adversarial thinking applied to AI systems — not just security knowledge, not just ML knowledge, but the combination.

The minimum viable red team is two to three people who did not build the system. Independence matters: the builders have blind spots about their own design, and they unconsciously test the paths they already considered. The red team needs people who think like attackers: creative, persistent, and uninterested in how the system is supposed to work.

Composition: at least one person with application security experience (they understand attack chains, privilege boundaries, and exfiltration), at least one person who understands the AI system deeply (model behavior, prompt construction, agent architecture), and ideally someone with domain knowledge of the business context (they know what "bad" looks like in this specific deployment — which data is sensitive, which actions are consequential).

For teams that cannot staff this internally, external red-team providers exist and are worth using for high-stakes systems — but do not outsource it entirely. Your team needs to understand the findings deeply enough to fix them and to run lighter-weight testing continuously. External engagements are point-in-time; your risk is continuous.

## The methodology

A structured methodology beats ad-hoc poking. The shape that works:

Threat modeling first. Before testing, write down what you are worried about: the assets (what data, what capabilities, what actions), the threat actors (casual users, determined attackers, malicious insiders, compromised third-party content), and the attack surfaces (user input, retrieved content, tool responses, APIs). The threat model focuses the testing — without it, red teamers test whatever is interesting, which is not the same as what is risky.

Attack library. Maintain a library of attack techniques, organized by layer and by objective. Direct prompt injection, indirect injection via documents and tool outputs, jailbreak techniques, tool misuse patterns, data extraction probes, multi-turn manipulation, encoding and obfuscation bypasses. The library should grow with every engagement — each new technique your team discovers or reads about gets added. This is institutional knowledge; treat it as an asset.

Test execution in campaigns. Run focused campaigns against specific objectives rather than unfocused exploration. A campaign has a target ("exfiltrate another tenant's data through the support agent"), a time box, and success criteria. Campaigns produce comparable results across engagements; free exploration produces anecdotes.

Documentation of every finding with reproduction steps. A finding without reproduction steps is a rumor. Record the exact inputs, the system state, the outputs, and the impact. Severity-rate each finding based on exploitability and impact in your specific deployment — a jailbreak that makes the model say something rude is low severity; a prompt injection that triggers an unauthorized refund is critical.

## Attack techniques that matter in enterprise systems

Some techniques deserve emphasis because enterprise teams under-test them.

Indirect prompt injection through the corpus. Plant attack payloads in documents and verify whether the RAG system picks them up and acts on them. Test the realistic variants: instructions hidden in document text, malicious content in metadata fields, payloads in documents the system trusts because they came from an internal source. Internal sources get compromised too.

Cross-tenant data access. If your system serves multiple tenants, probe the boundaries relentlessly. Ask for another tenant's data directly, ask indirectly ("summarize the Q3 results" when Q3 results exist for multiple tenants), and test whether retrieval respects tenant filters under adversarial queries. Tenant isolation failures are the highest-impact findings in multi-tenant AI systems.

Tool chain exploitation. For agentic systems, test whether attacker-controlled content can influence tool selection and tool parameters. Can a document in the corpus cause the agent to call a tool it should not? Can a tool response containing injected instructions redirect the agent's subsequent actions? Test the full chain: injection in, consequential action out.

Privilege boundary testing. Map what the agent can do at each stage of a workflow, and test whether an attacker can get it to exceed its intended authority — accessing data outside the current user's scope, performing actions the user did not request, or persisting changes that survive the session.

Multi-turn attacks. Single-prompt tests miss the attacks that build over a conversation: establishing false context, gradually escalating requests, getting the model to commit to a premise and then exploiting it. Your test campaigns should include multi-turn scenarios, because real attackers are patient.

## Measuring and tracking

Red teaming without metrics is theater. Track what lets you make decisions.

Findings by severity and by layer, per engagement. This tells you where your risk concentrates and whether it is moving. If every engagement finds critical issues in the agentic layer, that is where your engineering investment goes.

Time-to-first-critical-finding. How long does it take a competent red teamer to find something serious? If it is minutes, your defenses are thin. If it takes days of creative work, you are in better shape. This metric is uncomfortable and useful.

Remediation rate and re-test results. What fraction of findings get fixed, and do the fixes hold when re-tested? A finding that gets "fixed" and reappears in the next engagement indicates a systemic problem — usually a missing architectural control being patched with prompt tweaks.

Attack technique coverage. What fraction of your attack library has been run against each system? Coverage gaps are where the next incident hides.

Report to leadership in risk terms, not technique terms. "The red team achieved cross-tenant data access through the support agent in under two hours" is a risk statement. "We tested 47 prompt injection variants" is activity. Leadership funds risk reduction, not activity.

## Tooling: automation as a force multiplier

Automated attack tooling has matured to the point where it belongs in every red team program — as a supplement to human creativity, not a replacement for it.

Use automation for breadth: running your full attack library against every build, fuzzing input variations at a scale no human sustains, and regression-testing previous findings after each change. Open-source and commercial tools now cover prompt injection suites, jailbreak technique libraries, and agent attack harnesses. Integrate the repeatable ones into CI so that every prompt change, tool change, and model upgrade gets adversarial smoke-testing before it reaches production.

Keep humans on depth. Automation finds the known attacks; humans find the novel ones — the multi-turn manipulation tailored to your business logic, the attack chain that crosses three of your system's components, the abuse case that requires understanding what your users actually value. The division of labor is clear: machines run the library, humans write the next chapter of it. A program that is all automation tests last year's attacks. A program that is all manual testing does not run often enough. You need both, and the humans need time budgeted for creative work, not just executing tool output.

## Integrating with the development lifecycle

Point-in-time red teaming is necessary and insufficient. The goal is continuous adversarial testing integrated with how you build.

Gate major releases. New AI features, new agent capabilities, new data sources, and model upgrades should pass red-team review before production. The review does not need to be a full engagement every time — a focused campaign against the changed surface is usually enough. But "we changed the agent's tool access and shipped it without adversarial review" should be a process violation.

Automate the repeatable attacks. A subset of your attack library — the direct injection variants, the known jailbreak patterns, the tenant isolation probes — can run as automated tests in CI. They will not catch novel attacks, but they catch regressions: the prompt change that accidentally weakened a guardrail, the refactor that broke tenant filtering. Automated red-teaming is regression testing for security.

Schedule full engagements periodically and after significant changes. Quarterly is a reasonable cadence for production AI systems; more often for high-risk deployments. Each engagement should build on the last: new techniques added to the library, previous findings re-tested, coverage expanded.

Feed findings into the secure development lifecycle. Red team findings should create the same kind of tracked, prioritized work items as any security finding, with owners and deadlines. Findings that live in a PDF nobody reads are the most expensive kind of waste — you paid for the testing and got nothing.

## Common failure modes of red team programs

Testing the model instead of the system. Engagements that focus on jailbreaking the base model while ignoring the application's tenant isolation, tool permissions, and data handling. The model is rarely the weakest link in an enterprise deployment.

One-and-done engagements. A single red team exercise before launch, then nothing. The system changes, the threat landscape changes, and the assurance decays. Red teaming is a program, not a project.

Findings without ownership. A report full of critical findings and no one assigned to fix them. Every finding needs an owner, a deadline, and a re-test.

Scope too narrow. "Test the chatbot" when the actual risk is the agent with database access, or "test for harmful content" when the actual risk is data exfiltration. Let the threat model set the scope, not the org chart.

Confusing compliance with security. Checking the boxes for a framework requirement is not the same as finding the vulnerabilities. Do the compliance work, but do not mistake it for adversarial testing.

## The honest assessment

Red teaming finds failures; it does not prove the absence of failures. Communicate this clearly. A clean red team report means "a competent team tried for a defined period and did not find critical issues in the tested scope" — not "the system is secure." Scope limitations, time limitations, and the creativity gap between your red team and real attackers all bound what the engagement proves.

What red teaming does give you is defensible diligence: evidence that you looked, found issues, fixed them, and keep looking. For regulated industries and enterprise buyers, that evidence base is increasingly a requirement, not a nice-to-have. And for your own engineering, there is no substitute for watching someone break your system — it teaches you where the real boundaries are, which is knowledge you cannot get any other way.
