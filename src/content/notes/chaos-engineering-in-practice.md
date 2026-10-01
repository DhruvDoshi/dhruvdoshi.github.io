---
title: "Chaos engineering that survives the pilot"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: SRE
categories: [SRE, Reliability, Chaos Engineering]
---

Chaos engineering has a pilot problem. A team runs a game day, kills some pods, finds a missing readiness probe, writes a triumphant blog-style internal post — and eighteen months later nothing has changed. The experiments stopped because they were manual, the findings stopped because nobody owned the fixes, and the next real outage was caused by something the pilot never tested. Chaos engineering that matters is not a series of events. It is a permanent verification loop wired into how the system ships. This note is about building the version that survives.

## What chaos engineering is actually for

**It's hypothesis testing, not destruction.** The discipline, stated plainly: form a hypothesis about steady-state behavior ("if we lose an availability zone, p99 checkout latency stays under 800ms and error rate stays under 0.1%"), inject a controlled fault, measure whether the hypothesis held. The fault injection is the least interesting part. The hypothesis and the measurement are the engineering.

**The goal is finding the gap between the architecture diagram and the running system.** Every system has a resilience story its owners believe: "we're multi-AZ," "the circuit breaker handles that," "traffic shifts automatically." Chaos experiments test whether the story is true. The common outcome of a first real experiment program: the story is 60% true, and the 40% is where the outages live — the failover that was never tested with real traffic, the retry policy that amplifies instead of absorbing, the dependency everyone forgot was single-homed.

**It is not load testing, not a game day, not "breaking things in prod for fun."** Load testing verifies capacity against expected demand. Game days verify humans — the runbooks, the incident command, the communication. Chaos engineering verifies the system's automated response to failure. All three are useful; conflating them produces programs that do none of them well.

## Why pilots die

**The pilot tests the easy faults.** Pod kills, node drains, container restarts — the faults Kubernetes already handles gracefully. These experiments pass, everyone feels good, and the program declares victory over the failure modes that were never the risk. The faults that cause real outages — AZ impairment, dependency latency (not failure), DNS poisoning, clock skew, partial network partitions, disk-pressure slowdowns — are harder to inject safely and get deferred to "phase two," which never arrives.

**Findings without owners rot.** The pilot finds twelve issues. Three get fixed by the enthusiastic volunteers. Nine sit in a doc because no team owns "the retry storm between service A and B" — it spans two teams' boundaries, and each team's backlog has higher-priority feature work. A chaos program without a findings-to-owner pipeline is a vulnerability-reporting program that reports to nobody.

**Manual experiments don't compound.** If each experiment takes a week of preparation, you run six a year, and the system changes weekly. Coverage decays from day one. The experiments must become code — versioned, scheduled, runnable by the owning team — or the program is a series of stunts.

**Leadership support is theatrical.** "We support chaos engineering" from leadership that won't approve production experiments, won't fund the fix backlog, and treats the first experiment-caused incident as a reason to stop rather than as the program working as designed. The program needs explicit, written agreement on blast radius, on what happens when an experiment finds a real problem in production, and on the fact that the first controlled incident is success, not failure.

Verdict: pilots die from easy faults, ownerless findings, manual execution, and conditional support. Design the permanent program against all four from the start.

## The steady-state hypothesis: the unit of work

**Every experiment starts with a measurable steady state.** Not "the system works" — specific metrics with thresholds: error rate, latency percentiles, throughput, business KPIs (orders per minute, successful logins). The steady-state definition is the experiment's contract: it says what "normal" means precisely enough that a deviation is unambiguous.

**Hypotheses must be falsifiable and specific.** "The system handles AZ failure" is not a hypothesis — it's a hope. "When AZ-a is impaired, traffic shifts to AZ-b within 90 seconds, p99 latency stays under 1s, and error rate stays under 0.5%" is a hypothesis: it names the fault, the expected automated response, and the measurable bounds. If the hypothesis can't be wrong in a way you'd notice, it's not testing anything.

**Blast radius is a design parameter, not an apology.** Every experiment declares: what fault, where, for how long, affecting what fraction of traffic, with what abort conditions. Start with the smallest radius that can falsify the hypothesis — one pod, one AZ's canary, 1% of traffic — and expand only when the small experiments pass. The abort conditions (the "we stop the experiment if X") are as important as the fault: automatic rollback when steady-state metrics breach the abort threshold, not when a human notices.

## The fault catalog: what to actually test

Ordered roughly by how often the real outage differs from the architecture story:

**Dependency failure vs dependency slowness.** Everyone tests the dependency being down (connection refused, fast failure). Almost nobody tests the dependency being slow — p99 latency of 30 seconds instead of 200ms. Slow dependencies are worse: they hold threads, exhaust connection pools, and cascade. Timeout and bulkhead configurations are validated against slowness, not failure. Test the slow case first.

**AZ impairment, not AZ absence.** Killing an AZ entirely triggers clean failover. The real-world version is uglier: the AZ is up but degraded — packet loss, slow EBS, flaky networking. Partial impairment produces the split-brain-ish behaviors that clean-failover tests never exercise: some requests succeed, some hang, health checks flap. If your multi-AZ story only covers the clean case, it's a story.

**DNS and service discovery failures.** Stale DNS, slow DNS, discovery returning dead endpoints. The system's behavior when it can't find its dependencies — does it cache, does it fail fast, does it retry into a storm — is rarely designed and often discovered during the incident.

**Resource exhaustion in slow motion.** Disk filling over hours, memory leaking over days, connection pool draining under a traffic shift. Fast-kill experiments don't catch the slow-burn failures; sustained-pressure experiments do. These are the experiments that find the missing alerts.

**Clock skew and time jumps.** NTP failure, a leap second, a container clock drifting minutes. Timeouts, certificate validation, token expiry, scheduled jobs — all assume sane clocks. Skew experiments are cheap to run and find assumptions nobody documented.

**Cascading retry storms.** Inject latency into one dependency and watch whether the retry policies across the call graph amplify it into an outage. This is a system-level experiment — no single service's test catches it — and it's among the highest-value experiments you can run, because retry storms are a top-tier real outage cause.

**Data-layer faults.** Primary failover under write load, replica lag spiking, a partition becoming read-only. The database failover that "works" in the runbook but was never tested with production write throughput is a classic pilot-miss.

**Rule of thumb:** if the fault is in the runbook, it's probably already tested. Test the faults that aren't: slowness instead of failure, partial instead of total, slow-burn instead of instant.

## Building the permanent loop

**Experiments as code, in the service repo.** The experiment definition — hypothesis, fault, blast radius, abort conditions, schedule — lives versioned alongside the service it tests. The owning team runs it; the platform provides the fault-injection machinery. This solves the manual-execution death and the ownership death simultaneously: the team that owns the service owns its resilience verification.

**Scheduled, not episodic.** The experiments run on a cadence — weekly for critical paths, monthly for the rest — because the system changes continuously and resilience decays. A passing experiment from six months ago is historical trivia. Continuous verification is the point; the schedule is the mechanism.

**Findings feed the backlog automatically.** Every failed hypothesis creates a ticket assigned to the owning team, with the experiment evidence attached, prioritized by the blast radius of the real outage it predicts. Track the fix rate as the program's primary metric — experiments run is vanity; hypotheses fixed is value.

**Progressive delivery integration.** The highest-leverage placement for chaos checks: run the fault experiments against canary deployments before full rollout. A canary that survives dependency slowness gets promoted; one that doesn't gets rolled back automatically. This turns chaos engineering from a separate program into a deployment gate — and deployment gates don't die of neglect.

**Game days for the humans, experiments for the machines.** Keep the distinction: game days (simulated incidents with the on-call team) verify runbooks, communication, and decision-making under pressure. Automated experiments verify the system's behavior. Run both, measure both, confuse neither.

## Safety: the non-negotiable scaffolding

**Production experiments need explicit authorization.** Written, from the service owner and from leadership, covering: which faults are pre-approved at which blast radius, what requires additional approval, and who can abort. "Move fast and break prod" is not a chaos program — it's an incident with extra steps.

**Start in staging, but don't stay there.** Staging validates the experiment machinery — the fault injects correctly, the abort works, the measurements flow. But staging doesn't have production's traffic shape, data volume, or dependency behavior. Hypotheses about production resilience require production experiments. The progression: staging for machinery, production at minimal blast radius for truth, expanding radius as confidence builds.

**Abort conditions are automated and tested.** The experiment stops itself when steady-state metrics breach thresholds — tested by deliberately breaching them in staging first. Manual abort exists as backup. An experiment without a tested abort is just an outage you're scheduling.

**Business-hours experiments, announced.** Run during hours when the owning team is present and able to respond. Announce to stakeholders — not to game the results, but because a surprise during someone else's critical launch is a political incident, not a technical finding. Off-hours experiments are for mature programs with fully automated aborts and a track record.

**Blast radius accounting.** Track cumulative blast radius across concurrent experiments — two teams' "small" experiments on shared dependencies compose into a large one. A central schedule or at least a shared calendar prevents experiment interference, which is embarrassing when discovered during the postmortem.

## Measuring the program

**Hypothesis pass rate over time, per critical path.** The trend matters more than the absolute: a critical path whose experiments pass consistently is verified; one with recurring failures has a resilience debt problem.

**Mean time to fix findings.** A finding that sits for six months is a known vulnerability with a paper trail. Track it like any other SLA.

**Real-incident overlap.** After every real incident, ask: did we have an experiment covering this fault? If yes and it passed — the experiment was wrong (update it). If no — add it. The incident review feeding the experiment backlog is the loop that keeps the program relevant.

**What not to measure:** experiments run (vanity), faults injected (activity theater), "coverage percentage" (undefined denominator). Measure outcomes: hypotheses verified, findings fixed, incidents prevented or shortened.

## The maturity curve

**Level 1 — Ad hoc:** manual game days, easy faults, findings in a doc. This is where pilots live and die.

**Level 2 — Codified:** experiments as code in service repos, scheduled runs, findings ticketed to owners. The program survives personnel changes.

**Level 3 — Integrated:** experiments gate deployments (canary analysis), run against production continuously, feed incident reviews. Resilience verification is part of shipping.

**Level 4 — Systemic:** cross-service experiments (retry storms, cascading failures), dependency-slowness as standard, chaos findings influence architecture decisions. The organization designs for the faults it tests.

Most organizations should target Level 2 in the first year and Level 3 for critical paths. Level 4 is a multi-year investment — worth it for the systems where an outage is existential, overkill for the internal tooling.

## Closing

Chaos engineering survives the pilot when it stops being a program and starts being infrastructure: experiments as versioned code, owned by service teams, running on schedule, with findings that become tickets and tickets that get fixed. Test slowness not just failure, partial not just total, and the faults that aren't in the runbook. The measure of the program isn't experiments run — it's the outage that didn't happen because a hypothesis failed safely on a Tuesday afternoon instead of catastrophically on a Saturday night.
