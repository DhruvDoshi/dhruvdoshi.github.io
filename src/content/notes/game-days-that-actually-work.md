---
title: "Game days that actually work"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: SRE
categories: [SRE, Reliability, Testing]
---

Most game days are theater. A team books a conference room, kills a database replica, watches the dashboard go green, declares victory, and learns nothing. The incident that actually wakes you up at 3 AM never looks like the scenario you rehearsed, because the scenario you rehearsed was designed to be survivable, not instructive. If you want failure-injection exercises that produce real reliability gains, you have to design them like experiments, not performances.

## The real problem

Game days fail for three reasons, and "we picked the wrong failure" is the least important of them.

First, they are optimized for the story afterward, not the learning during. Someone wants to be able to say the team runs chaos engineering. So the exercise is scoped so tightly — one node, one availability zone, with an observer watching the auto-scaling policy — that the outcome is known before the session starts. That is a demo, not a drill.

Second, there is no hypothesis. The team injects a failure and watches. Watching is not learning. Learning requires a prediction made in advance that can be proven wrong: "If we lose this availability zone, checkout p99 will stay under 800 ms and no page will fire." When the prediction breaks — and it will, somewhere interesting — you have learned something. Without a prediction, every outcome is "fine, I guess," which teaches nothing.

Third, findings evaporate. Someone says "huh, the failover took longer than expected," a note is half-remembered, and three months later the same assumption kills you in production. A game day without a findings-to-fix pipeline is just a very expensive team-building exercise.

## Decision framework: is this failure worth injecting?

Not every failure deserves a game day. Run this filter before scheduling anything:

1. **Is there a real unknown?** If the runbook has been executed successfully against this exact failure mode in the last quarter, you are re-running a known-good. Skip it.
2. **Is the blast radius bounded and recoverable?** You want genuine stakes, but you also want a stop button. If you cannot articulate the abort condition before you start, the scenario is not ready.
3. **Does the failure cross team or service boundaries?** The highest-value game days expose gaps in coordination: who pages whom, which dashboard each team trusts, whose runbook contradicts the other's. Single-service failures are unit tests; cross-boundary failures are integration tests.
4. **Can you run it in production, or production-like traffic?** Staging game days test staging. If the answer is no — and sometimes the business answer is legitimately no — at least run it against production-shadow traffic or replay. Be honest about what the environment proves.

Scenarios that pass this filter look like: losing the primary region of a multi-region service, a prolonged Kafka consumer lag during peak traffic, DNS poisoning of an internal resolver, a certificate expiring on the mTLS mesh. They are uncomfortable. That is the point.

## Designing the exercise

### Start from a hypothesis, not a failure

Write it down before anyone touches anything. Good hypotheses have the form: given this fault, we expect these specific signals, and these specific automated mitigations to engage within this time bound.

Example hypotheses:
- "If the Postgres primary in us-east-1 becomes unreachable, the standby promotes within 90 seconds, the app's connection pool drains cleanly, and p95 write latency recovers within 5 minutes. One page fires to the DB on-call; no other team gets paged."
- "If we cut 40% of worker capacity during the batch window, queue depth grows but stays under the alerting threshold, and the batch completes within its 2-hour SLA. Backfill workers spawn from the autoscaler, not from a human."

Notice that both hypotheses name the signals people will watch, the automation expected to fire, and the acceptable customer impact. When reality diverges — the standby promotes in 4 minutes instead of 90 seconds, or two other teams get paged because a health check flipped — the divergence is the curriculum.

### Pick a blast radius with intent

Blast radius is not just "how much breaks." It has three dimensions:

- **Scope**: which services, regions, and data paths are affected.
- **Duration**: how long the fault persists before you stop it, and how long recovery takes.
- **Fidelity**: how closely the injection resembles a real failure (process kill vs. SIGTERM vs. network partition vs. corrupted disk).

Match fidelity to the hypothesis. If you are testing failover, kill the process abruptly — SIGTERM with graceful drain is the easy case, and you already know the easy case works. If you are testing detection, introduce degraded behavior (latency, partial failures) rather than a clean crash, because clean crashes are the easiest thing to detect. Most teams default to the cleanest, most graceful fault injection and then wonder why their game days never surprise them.

### The facilitator role

You need a facilitator who is not on the responding team. Their job:

- Enforce the abort criteria. When the abort condition is hit, the exercise stops, no debate.
- Control information asymmetry. In a real incident, nobody has the full picture. The facilitator can withhold the injected fault's details from responders — "something is wrong with the payments path" rather than "we killed the Kafka brokers" — to test detection and diagnosis, not just response.
- Timebox observation phases. "We will let this run for 20 minutes before anyone looks at the injection logs." This is where you discover whether your observability actually answers the questions people ask during incidents, or only the questions you thought of afterward.
- Run the debrief within 24 hours, while memories are fresh, and write the findings down before the room disperses.

A facilitator who is also the on-call responder cannot do this job. They will either leak the answer or self-censor the chaos. Rotate the role, and treat facilitation as real work — it deserves preparation time, not whoever drew the short straw.

### What the timeline looks like

A realistic structure for a 2-hour exercise:

```
T+0:00  Facilitator confirms abort criteria and hypothesis with the team
T+0:10  Fault injected (responders are told symptoms, not cause)
T+0:10  Observation phase: responders diagnose from dashboards, logs, traces
T+0:35  (if unresolved) Facilitator may release partial info to unstick diagnosis
T+0:50  Abort / begin recovery regardless; measure time to full health
T+1:20  Recovery complete; stop all injection
T+1:30  Debrief: what did we predict, what actually happened, what surprised us
```

The observation phase is the whole game. Resist the urge to shorten it when things get uncomfortable. The discomfort is the exercise working.

## Anti-patterns: how game days become theater

**The rehearsed script.** Every step is pre-planned, roles are assigned, and the team walks through a runbook they already validated. This is a drill for a parade. If the outcome is certain, cancel the exercise and spend the time on something with an unknown.

**The blameless postmortem that blames nothing and changes nothing.** Findings get captured as "opportunities" and assigned to nobody. Every finding from a game day needs an owner and a deadline, same as a production incident action item. If a finding is not worth an owner, it was not worth the exercise.

**The quarterly checkbox.** Running game days on a schedule regardless of what changed in the architecture trains the team to treat them as compliance. Tie exercises to real changes: a new region, a new dependency, a new data path. "We just cut over to the new queue topology; next week's game day will test what happens when the new consumer group lags."

**Fault injection without steady-state verification.** You kill the primary and discover the system was already unhealthy before you started — someone's deploy had partially failed an hour earlier. Always verify steady state first: error rates, latencies, queue depths, and deploy health. Otherwise you are debugging two failures and learning about neither.

**Testing the thing you built the guardrail for.** If you built autoscaling specifically to survive node loss, testing node loss proves the guardrail works. It does not test the system. Test adjacent to the guardrail: the scaling event itself during peak traffic, the warm-up time of new nodes under real load, the behavior when the guardrail's own control plane degrades.

## What to do with findings

Findings fall into four buckets, and each bucket has a different home:

1. **Detection gaps** ("we didn't notice for 18 minutes"): go to the observability backlog. The alert, dashboard, or runbook step that would have closed the gap is the fix.
2. **Automation failures** ("the failover script errored on the second host"): go to the reliability backlog with a severity comparable to a production bug, because the next production incident will hit this exact path.
3. **Coordination gaps** ("we paged the wrong team, and the right team found out on Slack"): go to runbooks and escalation policies. These are cheap to fix and expensive to leave.
4. **Architecture findings** ("the cache stampede on recovery nearly took us down"): these are the highest-value outcomes and the hardest to act on. Give them to the owning team with a proposed design change, not just a complaint.

Track game-day action items in the same system as incident action items, with the same review cadence. A finding without a deadline is a finding you have chosen to ignore.

## The debrief: where the learning actually happens

The exercise itself generates raw experience. The debrief converts it into knowledge. Run it within 24 hours, while the confusion is still fresh — confusion is data, and it fades fast.

Structure the debrief around three questions, in this order:

1. **What did we predict, and what actually happened?** Walk the hypothesis line by line. Every divergence is a finding. Resist the urge to start with opinions; start with the gap between prediction and reality.
2. **What surprised us?** Surprises are the highest-value output. "We expected the standby to promote in 90 seconds; it took 4 minutes because the health check interval was longer than anyone remembered" is worth more than the entire rest of the exercise. Surprises reveal the difference between the documented system and the real system.
3. **What would have happened if this were real?** This is the question that converts a game-day finding into an incident-prevention action item. If the answer is "the same thing, but at 3 AM with customers affected," the action item writes itself.

One facilitator discipline matters here: separate observations from judgments. "The failover took 4 minutes" is an observation. "The failover was too slow" is a judgment that ends the inquiry. Stay with the observation long enough to find the cause: was the health-check interval wrong, was the runbook stale, did the automation have a bug? The cause determines the fix; the judgment determines nothing.

Write the findings down before anyone leaves the room. A debrief that ends with "I'll write it up later" ends with nothing written up. The facilitator owns the notes, the owners own the action items, and the action items get dates.

## Frequency and cadence: how often is enough?

More game days are not better. Game days are expensive — they consume senior engineering time, carry real (if bounded) production risk, and generate action items that need capacity to fix. The right cadence is driven by change, not by the calendar:

- **After significant architectural changes**: new region, new data path, new dependency, new failover topology. The system you tested last quarter is not the system you have today.
- **When the on-call team reports fear**: if the on-call engineer says "I don't know what would happen if X failed," that is a hypothesis waiting to be written. The game day is the answer.
- **Quarterly at most for the big ones**, with smaller tabletop exercises in between. A tabletop — walking through a scenario verbally, no injection — is cheap, takes an hour, and catches the coordination gaps (who pages whom, which runbook is stale) that are half the value anyway.

And track the ratio that matters: action items completed versus action items generated. If the team generates twenty findings per game day and completes three, the bottleneck is not discovery — it is fix capacity. Slow down the exercises and speed up the fixes. A game day whose findings do not ship is just a more expensive way to learn nothing.

## How to start: what good looks like

If your team has never run a game day, do not start with a multi-region failover. Start small and real:

1. Pick one hypothesis about a failure mode nobody is sure about. Ask the on-call engineer: "What failure are you most afraid of?" That is your first scenario.
2. Write the hypothesis in one paragraph. Define the abort condition. Verify steady state.
3. Run it with a facilitator from a neighboring team, not your own.
4. Debrief within 24 hours. Write down every surprise. Assign every finding an owner and a date.

Good looks like: the hypothesis was wrong in at least one interesting way, the debrief surfaced a detection or coordination gap you had not named before, and the action items actually shipped within a quarter. If your first game day confirms everything you already believed, your scenarios are too safe. Make the next one scarier.

And remember what game days cannot do: they cannot substitute for boring reliability work. The team that skips capacity planning, lets runbooks rot, and ignores alert noise will not be saved by a quarterly chaos exercise. Game days are a feedback mechanism on top of a solid foundation, not a replacement for it. Get the fundamentals right — monitoring that works, runbooks that are current, deploys you can roll back — and the game day becomes the place where you discover the failures your fundamentals did not anticipate. That is the only job it has, and it is a good one.
