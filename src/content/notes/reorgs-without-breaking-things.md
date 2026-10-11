---
title: "Reorgs without breaking things"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Engineering leadership
categories: [Engineering Leadership, Organizations, Change Management]
---

Every engineering leader eventually faces the reorg: the moment when the current team topology no longer fits the work, and redrawing the boxes looks like the answer. Reorgs have a terrible reputation, and mostly they have earned it — not because reorganizing is inherently destructive, but because leaders treat it as an org-chart exercise when it is actually a change-management operation. The chart is the easy part. The hard parts are sequencing, communication, and the ninety days after the announcement when the new structure either takes root or quietly rots.

Think of a reorg as surgery: sometimes necessary, never harmless, and the outcome depends far more on preparation and aftercare than on the incision itself. This note is the field manual — when the surgery is indicated, how to sequence it, how to communicate it, and how to stabilize afterward.

## When a reorg is the right tool

The first decision is whether to reorg at all, because a reorg done for the wrong reasons does damage that takes quarters to repair. Legitimate triggers:

- **The strategy changed and the structure didn't.** The company pivoted from one product surface to another, or from growth to profitability, and teams are still organized around the old bets. Structure should follow strategy with a lag, not a permanent gap.
- **The topology fights the architecture.** Conway's law cuts both ways: if two teams must coordinate daily but sit in different orgs with different managers and different priorities, every joint decision pays a coordination tax. When the collaboration graph and the reporting graph are in chronic conflict, redraw one of them — and the reporting graph is usually the one you can move.
- **Span of control is broken.** A manager with fourteen reports is not managing; they are attending meetings. A layer with two people in it is not a layer; it is overhead. Structural math this basic still causes an astonishing share of dysfunction.
- **A persistent coordination tax with no owner.** Two teams stepping on each other's roadmaps, on-call rotations that page the wrong people, decisions that need five stakeholders because ownership is ambiguous. When the same friction recurs for quarters despite process fixes, the problem is structural.

And when a reorg is the *wrong* tool — the cases where leaders reach for it and regret it:

- **Morale is low.** Reorg as therapy does not work. Shuffling unhappy people into new boxes produces unhappy people who now also don't know who their manager is. Fix the underlying cause (bad manager, impossible workload, strategic whiplash) directly.
- **One bad quarter.** Restructuring around a transient miss optimizes for the last problem instead of the next one, and teaches the org that the structure is unstable.
- **Avoiding a hard personnel decision.** Reorganizing around an underperforming leader — moving the problem sideways instead of managing it — is cowardice with extra steps, and everyone sees through it. The new structure inherits the old problem plus fresh resentment.
- **The new leader's urge to "make their mark."** Incoming leaders who reorg in the first ninety days usually do it for legibility — to understand the org by rebuilding it — at maximum disruption cost. Learn the org first; reorg from knowledge, not from the need to act.

The test: can you write one paragraph explaining what specific, named problem the reorg solves that nothing short of restructuring can solve? If you can't, you don't have a reorg — you have restlessness.

## Sequencing: people, then work, then rituals

The order of operations is the most underrated part of reorg mechanics. Get it wrong and you get months of confusion; get it right and the new structure stabilizes in weeks. The sequence is: **people first, then work, then rituals.** Never reorder.

```
reorg sequencing (do not reorder)

 1. PEOPLE            2. WORK                 3. RITUALS
 who reports          service ownership,      standups, planning,
 to whom              on-call rotations,      reviews, retros
 (decided and         roadmap homes           (rebuilt around the
 communicated                                new ownership —
 privately first)     (reassigned             not inherited from
                      explicitly)             the old teams)
```

**1. People.** Decide the reporting structure and tell the affected individuals privately before any public announcement. Every person should hear "here is your new manager, here is what changes for you and what doesn't" from a human, in a conversation, with room for questions — never from a slide deck or an all-hands. Managers who are losing or gaining reports need time to absorb it before they have to perform confidence about it publicly. This phase is measured in days of private conversations, and it cannot be shortcut.

**2. Work.** Once people know where they stand, reassign work ownership explicitly: which team owns which services, who carries the pager for what, where each roadmap item lives now. Ambiguity here is the number-one source of post-reorg dysfunction — two teams each assuming the other owns the migration, or nobody owning it. Write the ownership map down. The old on-call rotations keep running until the new ones are staffed, briefed, and shadowed; you do not hand a pager to someone who has never seen the runbook.

**3. Rituals.** Only now do you rebuild the operating cadence: standups, planning, reviews, retros, shaped around the new teams and their actual work. Rituals inherited unchanged from the old structure are theater — a standup of twelve people from three former teams is not a standup. Let each new team design its rituals with its manager in the first two weeks; the leader's job is to require that rituals exist and that they serve the new ownership map, not to dictate their form.

Why this order: people need to know where they stand before they can care about work assignments, and rituals only function once ownership is clear. Announce work reassignment to people who don't yet know their manager and you get anxiety; rebuild rituals around unclear ownership and you get process that serves nobody.

## Communication cadence: the cascade and the rumor phase

A reorg is communicated in a cascade, and the cascade has exactly one correct order:

1. **The managers first** — with the full rationale, time to absorb it, and room to ask hard questions. They have to carry this message to their teams within hours; a manager who first hears the reorg alongside their reports cannot lead through it.
2. **Affected individuals** — privately, from their current or future manager, before the general announcement. Nobody should learn their own reporting change from a group meeting.
3. **The org** — the full announcement with rationale, the new structure, what changes, what doesn't, and the timeline.
4. **The company** — the wider organization gets the summary version, focused on who to work with now.

**Write the doc before you say a word.** The reorg memo should cover: why (the one-paragraph problem statement), what changes, what explicitly does *not* change (stability anchors — "your compensation, level, and current projects are unchanged" — calm people down enormously), the timeline, and an FAQ addressing the obvious anxieties (will there be layoffs? does my manager change? what happens to my project?). If you can't write the FAQ, you're not ready to announce.

**Assume it leaks and plan for the rumor phase.** Reorgs leak — always, through someone's calendar invite or a misaddressed message. The gap between the leak and the official announcement is the most corrosive period: speculation fills the vacuum, and the speculation is always worse than the reality. Mitigations: compress the cascade into the shortest humane window (managers in the morning, individuals by afternoon, org announcement the next morning — not a week-long rollout), have the doc ready *before* the first private conversation so you can publish immediately if it leaks, and when it does leak, announce early rather than letting rumors run.

**What to say repeatedly:** the why (say it until you're sick of it — most people hear it once and forget), what isn't changing, and what happens next with dates. **What not to say:** promises you can't keep ("nothing will change for ICs" — something always changes), criticisms of the old structure that insult the people who built it, or the real reasons if the real reasons are "the previous leader failed" — frame forward ("we're organizing around the new strategy"), never backward.

## The 90-day stabilization plan

The announcement is day zero. The reorg succeeds or fails in the ninety days after, and most leaders declare victory at the announcement and move on — which is why so many reorgs quietly fail. Run the stabilization explicitly:

**Days 0–30: clarity.** The only goal is that every person can answer three questions: who is my manager, what does my team own, and who do I talk to about X. New managers hold 1:1s with every new report in the first two weeks. The ownership map is published and corrected. On-call transitions are shadowed, not flipped. Leadership resists the urge to make *additional* changes — no stacked reorgs, no "while we're at it" process overhauls. Stability is the product in month one.

**Days 30–60: rhythm.** The new rituals should be running and roughly working. This is when you run the first retros *about the reorg itself*: what's confusing, what's broken, what ownership is still ambiguous. Expect to find real issues — the plan never survives contact with reality — and fix them visibly. This is also when you watch for the quiet failures: the engineer whose work lost its sponsor in the shuffle, the cross-team relationship that broke because the two people now report to different chains.

**Days 60–90: evaluation.** Now you can ask whether the topology is working, because the noise of transition has settled. Measure what the reorg was supposed to fix: decision latency on the previously-stuck decisions, incident handoff quality, the coordination tax you named in the one-paragraph problem statement. Run a lightweight pulse survey — not a full engagement survey, just "is the new structure helping or hurting your work, and what's one thing to fix." Make one round of adjustments based on what you learn; small corrections now prevent the slow rot of living with a known-bad structure.

Throughout: **over-communicate and name the awkwardness.** "We know the last month has been disruptive; here's what we've fixed and what's still in flight" — said monthly by the leader — does more for trust than any amount of pretending the transition was seamless.

## Anti-patterns: how reorgs destroy trust

- **Announcing before managers know.** The cascade exists for a reason. Managers blindsided in the all-hands cannot answer their teams' questions, and their teams conclude — correctly — that leadership doesn't trust them.
- **Reorg theater.** New boxes, same work, same friction. If the collaboration graph doesn't change, you didn't reorg — you renamed things, and everyone knows it. Theater burns the credibility you'll need for the reorg you actually need later.
- **Splitting a team mid-incident or mid-launch.** Reassigning ownership while the pager is firing or the launch is weeks out is how you get dropped incidents and slipped dates. Freeze structural changes around critical operational periods; the reorg can wait six weeks.
- **Reorging twice in six months.** Change fatigue is real and cumulative. Each reorg spends trust; the second one in quick succession spends it at a premium, because people reasonably conclude the leadership doesn't know what it's doing. If you must adjust, make small corrections inside the stabilization window — don't relaunch.
- **Using the reorg to quietly manage out.** Burying a performance problem in a restructuring — the underperformer ends up on a new team, unmanaged — poisons the new team's trust the moment they figure it out. Handle personnel issues as personnel issues, openly.
- **Ignoring Conway's law.** Drawing team boundaries that cut across architectural seams — one team owns the API, another owns the only client, different managers, different priorities — manufactures the exact coordination tax the reorg was supposed to eliminate. Design team boundaries around service boundaries, or accept the tax explicitly.
- **The big-bang announcement with no private phase.** Revealing everyone's new manager on a slide to three hundred people. Efficient for the presenter; traumatic for everyone else. The private conversations are not optional kindness — they are load-bearing.

## What good looks like: the checklist

A well-run reorg, compressed to a checklist:

- [ ] **One-paragraph problem statement** — the specific, named problem only restructuring can solve. Written before anything else.
- [ ] **The doc** — why, what changes, what doesn't (stability anchors), timeline, FAQ. Ready before the first private conversation.
- [ ] **Private phase** — managers briefed with time to absorb; every affected individual told privately by a human before any group announcement.
- [ ] **Compressed cascade** — managers → individuals → org → company, in days, not weeks. Leak plan ready (publish the doc early if needed).
- [ ] **Ownership map** — services, pagers, roadmap items explicitly reassigned in writing. Old on-call runs until new on-call is shadowed and ready.
- [ ] **Ritual rebuild** — new teams design their cadence in the first two weeks, shaped around new ownership.
- [ ] **90-day stabilization** — clarity (0–30), rhythm (30–60), evaluation (60–90), with retros about the reorg itself and a pulse check at the end.
- [ ] **No stacked changes** — no second reorg, no major process overhaul, no critical-period disruptions during stabilization.

And the meta-rule: a reorg is a tool you should need rarely. If you find yourself reorganizing every year, the problem isn't the org chart — it's strategy churn, leadership instability, or the habit of reaching for structure when the real issue is people or priorities. The best reorg is the one you almost didn't need, executed so boringly well that six months later people struggle to remember what the old structure was. Boring is the goal. Surgery you barely notice afterward is surgery done right.
