---
title: "Skip-level meetings that work"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Engineering leadership
categories: [Engineering Leadership, Management, Communication]
---

Skip-level meetings — a senior leader meeting directly with the people two or more levels down, skipping the managers in between — are one of the most awkward rituals in management. Done badly, they are thirty minutes of polite small talk that produce nothing, or worse, a backchannel that poisons the relationship with the middle manager. Done well, they are the highest-signal sensor a leader has: the unfiltered view of what is actually happening, which no dashboard and no status report can provide.

The reason they exist is information physics. Every layer of management filters, summarizes, and — consciously or not — sanitizes what flows upward. A manager reporting to you will tell you the project is "mostly on track with some risks," which might mean anything from "fine" to "on fire." The individual contributor living inside the work knows which one it is. Skip-levels do not replace the management chain; they calibrate it. You are sampling the raw signal so you can interpret the filtered signal correctly.

```
information flow without skip-levels:

IC ──▶ manager ──▶ you
        (filters, summarizes, sometimes sanitizes)

information flow with skip-levels:

IC ──▶ manager ──▶ you
│
└──▶ you   (unfiltered sample — used to calibrate, never to overrule)
```

That last parenthetical is the entire discipline. The moment you use skip-level intel to overrule or blindside the manager, the program is dead — and deservedly so.

## The real problem: why most skip-levels produce nothing

Three failure modes account for most useless skip-levels. First, **no psychological safety**: the IC sits across from their boss's boss, understands perfectly well that anything critical might get back to their manager, and so says everything is fine. Second, **no follow-through**: the IC takes a risk, shares something real, and nothing happens — so they never do it again, and they tell their peers not to bother either. Third, **manager alienation**: the middle manager experiences the skip-level as surveillance, starts managing around it, and the trust triangle collapses.

All three are design problems, not people problems. Safety comes from format and confidentiality norms. Follow-through comes from a system for acting on what you hear. Manager trust comes from radical transparency about the program's purpose and boundaries. Get those three right and the conversations largely take care of themselves.

## Cadence and format: boring and regular beats clever and rare

**Cadence.** For most organizations, each IC gets a skip-level roughly quarterly — frequent enough to build familiarity, infrequent enough that it does not become a second management layer. With a large org, rotate: you cannot meaningfully skip-level fifty people, so sample across teams and rotate the sample each quarter. Monthly is too frequent (it becomes status reporting); annually is too rare (no relationship, no honesty).

**Format.** Thirty minutes, 1:1, private. Group skip-levels (roundtables, lunches) have their uses for surfacing shared themes, but people will not say anything sensitive in front of peers, so roundtables supplement rather than replace 1:1s. Video or in person both work; what does not work is squeezing it into a hallway chat or tacking it onto another meeting. The privacy of the setting is what makes honesty possible.

**Who sets the agenda.** They do, not you. Open with two minutes of context — what the skip-level is for, what is and is not confidential — then hand them the floor: "What's on your mind? What should I know that I probably don't?" If they have nothing, have your question bank ready (next section). Never turn it into a status update on their projects; you have other channels for that, and using the skip-level for status tells them the meeting is about your needs, not theirs.

**Logistics that matter more than they should.** You schedule it, not their manager — but the manager knows it is happening and why. Put it on a predictable rhythm so it is not a surprise summons (nothing says "you are in trouble" like an unexpected invite from the skip-level). And take notes — not a transcript, but themes and follow-ups. Notes are what turn a conversation into a system.

## Questions that surface real signal

Bad skip-level questions share a trait: they are either too broad to answer ("any concerns?") or they put the person on the spot about their manager ("how's your manager doing?"). Both produce the same output: "everything's fine."

Good questions are specific, forward-looking, and safe to answer honestly. A working bank:

- **"What's the most annoying part of your week?"** Annoyances are safe to admit and incredibly diagnostic — they point at broken processes, bad tooling, and coordination taxes the leadership layer never sees.
- **"What did we used to do that we should bring back — or stop doing that we should never have started?"** Surfaces cultural drift and process barnacles without asking anyone to criticize a person.
- **"If you could change one decision from last quarter, what would it be?"** Reveals which decisions landed badly at the ground level, which is information you cannot get any other way.
- **"What are you hearing from customers that isn't reaching us?"** ICs — especially those close to support, on-call, or customer-facing work — sit on raw customer signal that gets summarized into meaninglessness by the time it reaches you.
- **"What would you work on if you had a free month?"** Shows you where their energy actually is, which often differs from what the roadmap says their energy should be on. The gap between those two is a retention risk or an innovation opportunity.
- **"What do you wish your manager knew?"** Framed carefully and asked rarely, this is the highest-signal question in the bank — but only ask it once trust exists, and treat the answer with extreme care (see the confidentiality section).

Why these work: each one asks about *the work and the system*, not about people, which makes honesty low-risk. And each one assumes the IC knows something you do not — which, stated sincerely, is the respect that makes the whole ritual function.

## What to do with what you hear: the follow-through system

A skip-level without follow-through is worse than no skip-level: it teaches people that honesty is pointless. Triage everything you hear into three buckets:

1. **Act directly.** Things within your power: a broken process you can fix, a tooling request you can fund, a decision you can revisit. Do it visibly and quickly, and close the loop with the person: "You raised X; here's what I did." Visible action is what makes the next skip-level honest.
2. **Escalate or route, anonymized.** Things that belong to their manager or another leader: a team process issue, a resourcing gap. Route it as a theme, never as a quote — "I'm hearing across a few conversations that code review latency is a pain point" — and never in a way that identifies the source. Then tell the person what you did with it, in general terms.
3. **Note and watch.** Things that are one data point: a grumble about a reorg rumor, a concern that might be nothing. Log it. If three separate skip-levels surface the same theme, it graduates to bucket 1 or 2. This is the compounding value of notes — patterns invisible in any single conversation emerge across quarters.

**Confidentiality rules, stated upfront and kept absolutely:**

- Nothing attributable leaves the room without explicit permission. "Can I share this with your manager, attributed to you?" — ask, every time, and accept no gracefully.
- Themes are shareable; quotes and identities are not. "Several folks mentioned onboarding is rough" is fine. "Priya said onboarding is rough" is a betrayal.
- The exception is serious misconduct or safety issues — state this upfront so it is never a surprise: "The one thing I can't keep confidential is anything involving harassment, safety, or legal risk. Everything else stays between us unless you say otherwise."

**Close the loop or lose the channel.** Within a week of the skip-level, the person should hear back: what you did, what you routed, or honestly that you could not act and why. "I looked into X; it's blocked on Y, which I don't control — but I've raised it with the team that does" preserves trust far better than silence. Silence is interpreted, always, as "nothing happened."

## The trust dynamics with the middle manager: the core tension

Everything above fails if the middle manager experiences skip-levels as surveillance. The manager's fear is rational: their boss is meeting their reports privately, hearing unfiltered complaints, and might use any of it against them. Your job is to make that fear unreasonable through structure, not reassurance.

**Before the program starts**, tell every manager: you are doing skip-levels, why (calibration signal, leadership development, org health — not performance surveillance), what the confidentiality rules are, and what they will get out of it (themes, shared back, that help them manage better). Managers who hear about the program from their reports instead of from you will — correctly — read it as a trust violation.

**Share themes back with the manager.** After a round of skip-levels, sit down with the manager: "Here's what I'm hearing across your team — review latency and on-call load came up several times. No names, but I wanted you to have the pattern." This does three things: it gives the manager useful signal, it proves the program is not a secret tribunal, and it lets the manager act on things before they fester. A manager who receives themes is an ally; a manager kept in the dark is an adversary.

**Never use skip-level intel to blindside the manager.** If an IC tells you their manager is the problem, do not confront the manager with it. Coach the IC to raise it directly where possible; if it is serious (the confidentiality exception), handle it through proper channels with the IC's knowledge. The day a manager gets ambushed with "your report told me in a skip-level that..." is the day every manager in the org starts coaching their reports on what to say — and your sensor goes permanently dark.

**Never skip downward to assign work.** The fastest way to destroy a manager's authority is to hand their report a task directly in a skip-level. If something urgent comes up, route it through the manager. The chain of command is not bureaucracy here; it is the trust structure the whole program rests on.

Handled right, good managers come to *value* skip-levels: it is free org-health data and leadership development for their reports. Handled wrong, it is the most efficient trust-destruction machine in management.

## Anti-patterns

- **The complaint box with no follow-through.** Asking for honesty, hearing real problems, doing nothing. One cycle of this and the channel is dead for a year.
- **The engagement-survey special.** Running skip-levels for a month after bad survey results, then stopping when the heat dies down. People notice the pattern, and the next real attempt inherits the cynicism.
- **Surveillance mode.** Using skip-levels to check up on the manager. People smell this instantly — the questions give it away — and the honest ones stop coming.
- **No notes, no compounding.** Thirty minutes of insight evaporates because nothing was written down. Themes across quarters are where the strategic value lives; without notes, every skip-level starts from zero.
- **The ambush invite.** An unexpected skip-level summons reads as "you're in trouble." Predictable rhythm or it doesn't happen.
- **Solving the person's problem for their manager.** Even with good intentions, intervening directly on something the manager owns teaches everyone — the IC and the manager — to route around the manager. Coach, route, and share themes; don't bypass.

## What good looks like

A working skip-level program has a recognizable shape:

1. **A predictable rhythm.** Quarterly 1:1s per IC (rotating sample in large orgs), on the calendar, never a surprise. Managers know the schedule and the purpose.
2. **A question bank and a format** that puts the IC's agenda first: two minutes of framing, then their topics, then your questions only if time remains.
3. **A notes system** capturing themes and follow-ups per conversation, reviewed before the next round so patterns compound across quarters.
4. **A follow-through discipline**: every conversation gets a closed loop within a week — acted, routed (anonymized), or honestly explained as not actionable.
5. **A manager partnership**: themes shared back with managers routinely, confidentiality boundaries respected absolutely, and no work ever assigned downward through the channel.

Start here: pick one team, tell its manager exactly what you are doing and why, and run one quarter of 1:1s with the question bank above. Take notes. Close every loop within a week. Share the themes back with the manager. At the end of the quarter, ask the ICs whether it was worth their time — and believe their answer. If it worked, expand; if it didn't, you will know exactly which of the failure modes above to fix. Skip-levels are a sensor you build through trust, and trust is built through kept promises at small scale first.
