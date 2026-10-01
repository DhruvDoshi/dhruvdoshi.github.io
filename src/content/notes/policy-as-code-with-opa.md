---
title: "Policy as code with OPA: guardrails without gatekeepers"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Platform architecture
categories: [Platform Architecture, Policy as Code, Security]
---

Most organizations enforce policy through people: a security review board that meets on Tuesdays, a Slack message asking "can we deploy this?", a spreadsheet of approved images that is out of date the day it is published. That works until deployment velocity crosses whatever throughput a human approval queue can handle — which, in practice, is about three teams.

Policy as code replaces the queue with a check. The policy lives in a repository, gets reviewed and tested like code, and gets evaluated by machines at the exact point a decision is needed: admission time, build time, request time. The gatekeeper disappears; the guardrail stays.

## What policy-as-code actually buys you

Three things. If your program doesn't deliver these, it is theater.

**Consistent enforcement.** A human reviewer approves a Terraform plan differently at 4 PM on a Friday than at 10 AM on a Tuesday. A policy engine does not. The same rule fires the same way in dev, staging, and production, for the junior's pull request and the principal's.

**An audit trail.** Every decision can be logged: what was asked, what was decided, which policy version decided it. When an auditor asks how you prevent public S3 buckets, you produce decision logs, not a wiki page and a prayer. This is the single biggest reason regulated industries adopt OPA — the evidence is a byproduct, not a project.

**Self-service.** Security stops being a queue and becomes a policy author. Developers get answers in seconds, at the point of work, instead of answers in days from a review board.

The ticket queue fails for a structural reason, not a cultural one: fixed throughput, and queueing delay grows nonlinearly with utilization. The fix is not more reviewers. It is moving the review into the machine.

## OPA and Rego fundamentals for the impatient

Open Policy Agent is a general-purpose policy engine. You give it a JSON document describing what someone wants to do (the **input**), it evaluates your policies (written in **Rego**), optionally against external context (**data**), and returns a decision. OPA does not know what Kubernetes or Terraform is. It knows documents and rules. That generality is the point: one policy language, many enforcement points.

Rego is declarative and Datalog-inspired. The mental model is small: a policy is a set of rules, and evaluation asks "is there a rule whose body is true for this input?" The canonical pattern, which you will write a thousand times:

```rego
package kubernetes.admission

default allow := false

deny contains msg if {
  input.request.kind.kind == "Pod"
  not input.request.object.spec.serviceAccountName
  msg := "pods must run with an explicit service account"
}

allow if {
  count(deny) == 0
}
```

No if/else chain, no early return. You define the set of denials; the decision follows. This is the idiomatic shape: **deny-by-default, explicit allow**. New code paths fall into the deny bucket automatically — exactly where unknown things belong.

Three more facts that save months of confusion. First, `data` loads separately from policies, so policy logic and policy *content* (allowlists, thresholds) change independently. Second, the `with` keyword substitutes `data` in tests — the backbone of policy testing. Third, Rego has no loops, no mutation, no side effects. If you are fighting the language to do something imperative, the policy is enforcing the wrong thing or at the wrong layer.

## Where to enforce: pick the enforcement point first

The most consequential decision in a policy-as-code program is not the tool or the language. It is where the decision gets enforced. Each point has different properties, and choosing wrong means policies that fire too late, too early, or at a cost nobody budgeted.

**Kubernetes admission control.** The most common starting point and usually the right one. A validating admission policy sits in front of the API server: every create or update passes through it. Enforcement is inescapable — assuming RBAC is sane — and feedback is immediate: `kubectl apply` fails with the violation message. Use this when the rule must hold for everything in the cluster. The trade-off: admission is on the critical path of every deploy, so policies must be fast (single-digit milliseconds) and must never depend on a service that can go down. A failed webhook in `Fail` mode blocks the cluster; in `Ignore` mode it silently stops enforcing. Evaluate locally with data baked into bundles, never over the network.

**CI gates.** OPA evaluates Terraform plans, Dockerfiles, and manifests before anything deploys — `conftest` runs Rego against arbitrary structured documents. Use this when the feedback belongs at authoring time: the developer sees the violation in the pull request, not in production. The trade-off: CI only covers what goes through CI. A human with production credentials bypasses it. CI gates and admission control are complements, not substitutes — CI catches authoring mistakes early, admission catches everything else late.

**API gateways.** Enforcing at the edge — validating payloads, enforcing tenant constraints — turns OPA into an authorization layer for your services. Use this when decisions need request-time context (caller identity, tenant, resource) or when you want one authorization point in front of many services. The trade-off is latency: every request now includes a policy evaluation, which is where performance budgets get real and decision caching introduces its own correctness questions.

**Application authorization.** OPA embedded as a library or sidecar answering "can this user do this action on this resource?" Richest policies — and the hardest org question, because product teams now write authorization in a platform team's language. Do not start here. Start with admission and CI, where a bad policy blocks a deploy instead of breaking an authorization path.

The guidance: **enforce as close to the change as possible, and as inescapable as necessary.** CI is closest to the author; admission is the most inescapable. Most mature setups run both, and add gateway or application authorization later, once the org has learned to write, test, and version policies.

## Writing good policies

Bad policies are rarely wrong in what they check. They fail in how they communicate. Four properties of a good policy:

**Deny by default.** Start every package with `default allow := false` and require explicit passage. A policy you forgot to write blocks nothing, but an uncovered resource type gets denied — that complaint loop is how coverage grows.

**Composable rules.** Many small rules, not one big one. Each rule checks one thing and produces one message. Small rules can be enabled per environment and changed with a blast radius of one rule. The mega-policy file — forty checks, shared helpers, cross-cutting conditionals — is the policy equivalent of a god object, and it rots the same way.

**Helpful violation messages.** The message is the product. "Denied by policy K8S-014" is a ticket queue wearing a costume. A good message says what was wrong, why it matters, and how to fix it.

> Pod `payments-api` denied: containers must set `resources.limits.memory`. Without a limit, one misbehaving container can starve the node. Add `resources.limits.memory: "512Mi"` to each container spec.

Thirty seconds to write, hours of Slack threads saved. Treat violation messages as user-facing copy and review them in PRs like error strings.

**Data-driven, not hardcoded.** Allowlists, thresholds, environment exceptions go in `data`, not in rule bodies. This separates stable logic from volatile content, lets environments load different data against the same policy, and lets a security team update an allowlist without touching Rego.

## Policy testing: test-driven or it doesn't ship

Policies are code. Code without tests is a rumor. `opa test` evaluates policies against hand-written inputs and asserts on decisions, and it belongs in CI for the policy repository.

The discipline: **write the test first, from the violation you want to catch.** Before the rule requiring memory limits, write a test with a non-compliant pod (assert denied) and a compliant pod (assert allowed). This forces the two questions every policy needs answered: what does a violating input look like, and what does a compliant input look like?

Per rule, cover the positive case, the negative case, the boundary case (the label present but empty, the limit set to zero), and the regression case — the exact input from the last incident this policy would have prevented. Every incident a policy *should* have caught becomes a new test and a new rule; over time the suite becomes a codified history of everything the org has learned about what goes wrong.

Run tests in CI on every change — and run the *new* policy against *current production data and a sample of recent inputs* before deploying it. A policy that passes unit tests can still deny half your fleet if its assumptions about real inputs are wrong. Canary it: evaluate in audit mode against live traffic, watch the decision logs, then enforce.

## Distribution and versioning

Production OPA distributes policies as **bundles**: signed, versioned tarballs of policies and data that engines pull on a schedule. Bundles give you atomic updates (the engine activates the whole bundle or nothing) and rollback (pin the previous version).

The discipline: every merge to main produces a new bundle version. Engines pin a version in production and track latest in staging — policy changes roll through staging first, evaluated against staging traffic. Decision logs record the bundle version with every decision, so "what policy was in force on March 14th" has an exact answer. Data updates (allowlists, feeds) ship as separate bundles on their own cadence — an updated image allowlist should not require re-releasing every rule.

Design against the **split-brain policy**: different engines enforcing different versions, which surfaces as "worked in dev, denied in prod." Pin versions, log versions, and make the deployed version visible on platform dashboards.

## The org question: who writes policy

This is where programs die, and it has nothing to do with Rego. The structure that works: **platform owns the framework, security owns the guardrails, product owns the domain.**

The platform team owns the *infrastructure*: bundles, distribution, decision logging, the CI test harness, shared libraries and message formats. The security team owns the *non-negotiable* policies — the CIS-benchmark-style admission rules, the compliance gates — in a security-owned repo with a small, fast review process. Product teams own their *domain* policies: authorization rules for their services, team-specific constraints, contributed under the same review and testing standards.

Use CODEOWNERS on the policy repos so the right team reviews the right rules — and give security a self-service path to propose a change, see test results, and watch it roll out, without filing a ticket to platform. The moment policy changes require a ticket, you have rebuilt the gatekeeper queue with extra steps.

## Decouple policy from code releases

A policy change is not an application change; coupling their releases couples their failure modes. If updating the image allowlist requires redeploying the admission controller, the allowlist will be wrong and teams will work around the policy. Bundles are the mechanism, but the discipline is the point: **policy ships on its own cadence, versioned and rollbackable independently.**

One exception: **breaking policy changes need a deprecation path.** Tightening a constraint is a breaking change to every team. Ship it in audit mode first: log what *would* be denied, give teams a two-week window with a list of affected workloads, then enforce. Teams that get a heads-up with an exact fix list will fix it; teams that get a surprise denial will route around the policy.

## Performance and latency budgets

Policy evaluation sits on hot paths, so budget it like one: single-digit milliseconds p99 for Kubernetes admission (the API server waits for your webhook), low single-digit milliseconds for request-time authorization (or move the decision out of the request path — cache it, decide at token issuance), seconds at most for CI gates.

What keeps policies fast: local evaluation, small indexed `data` documents, no per-request iteration over large sets, partial evaluation to precompute what can be precomputed. What makes them slow, in order: network calls during evaluation, large `data` scanned per decision, regex-heavy rules over big inputs.

Monitor decision latency like API latency — p50/p99 per policy package, alert on regression. A policy getting slower every quarter is accumulating special cases, and the latency graph is the early warning. Evaluation must be deterministic: no wall-clock reads, no randomness. If a policy needs "now," pass it in as input.

## Decision logs as audit evidence

Log every decision: the input (or a reference to it), the decision, the policy versions evaluated, the timestamp. Two practices make logs useful instead of merely voluminous. First, **log enough to reconstruct, not enough to leak** — authorization inputs may contain PII, so log the decision, the version, the rule that fired, and a request reference, with redaction settled before the auditor asks. Second, **keep them queryable** — "which policy denied this deploy" must be answerable by the teams themselves, not via a support ticket.

## Migrating from manual approvals

Nobody starts with policy as code. The migration that works has four phases. **Shadow mode:** run the policy against real inputs, enforce nothing, log everything. The disagreements with human decisions are your test cases. **Advisory mode:** surface results as warnings in CI while humans still approve; measure agreement rate. **Enforce with escape hatches:** turn on enforcement with a documented, logged bypass for emergencies — recurring bypasses are policies that are wrong. **Tighten:** review bypass usage quarterly and fix what it reveals. Skip the first two phases and day-one enforcement generates surprise denials and political backlash.

## Anti-patterns

**One mega-policy file.** Forty rules nobody can review or test independently. Split by domain and enforcement point; a file over a few hundred lines is two policies pretending to be one.

**Policies nobody can read.** Rego is already unfamiliar; dense idiomatic cleverness guarantees only the author can maintain it. Prefer boring, explicit rules. Comment the *why* — the incident, the requirement — not the *what*.

**Deny without explanation.** A bare deny, or a message that is just a policy ID, converts your guardrail back into a gatekeeper: the developer can't self-serve, opens a ticket, and you've rebuilt the queue. Every deny produces an actionable message. No exceptions.

**Policy as code with no tests.** Untested policies carry the authority of automation with the reliability of a guess. If it's worth enforcing, it's worth testing.

**Enforcing what you can't explain.** If nobody can say which incident or requirement a rule exists for, it is obsolete or was never justified. Every policy links to its reason.

**Policies that call the network.** Evaluation-time external calls make every decision a distributed-systems problem — timeouts, fail-open vs. fail-closed. Bake data into bundles; evaluate locally.

## Closing

Policy as code is not about OPA or Rego. It is about moving decisions from queues to machines — consistently, auditably, at the point of work. Start with admission and CI, write small tested policies with messages humans can act on, roll them out shadow then advisory then enforced, and log every decision. The goal was never more control — developers getting answers in seconds from a system they can read, test, and trust.
