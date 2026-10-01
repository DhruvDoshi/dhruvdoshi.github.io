---
title: "Performance management for engineers"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Engineering leadership
categories: [Engineering Leadership, Management, Careers]
---

Most engineers become managers because they were good at building systems. Then they discover that performance management is the system they understand least, has the fewest dashboards, and fails most silently. A miscalibrated review, a delayed hard conversation, a PIP that should have been a role change — these cost a team quarters of momentum and, occasionally, its best people.

This note is the honest version: how calibration actually works, how to write feedback that changes behavior, how to run a PIP without cruelty or theater, and how to tell the difference between someone you should coach and someone you should manage out. No HR platitudes. The trade-offs are real and I will name them.

## The real problem

Performance management in engineering fails for a structural reason, not a motivational one. The work is collaborative, long-horizon, and deeply interdependent, but the evaluation artifacts are individual, annual, and compressed. A promotion packet tries to summarize nine months of entangled work into a few paragraphs and a rating. The gap between "what happened" and "what gets written down" is where bias, recency, and politics all enter.

Three failure modes dominate:

1. **The delayed conversation.** A manager notices a gap in March, says nothing, and then surfaces it in November as a "pattern." The engineer hears, correctly, that this is ambush — feedback delivered at a moment when it can no longer help. Trust erodes permanently.
2. **The calibratable engineer.** Reviews get written for the calibration room, not for the engineer. Strengths get sanded down to "solid contributor," real growth edges get hidden because they'd hurt the rating. The feedback becomes useless as coaching and mediocre as evaluation.
3. **The surprise PIP.** A PIP should never be the first time someone hears they are underperforming. When it is, it is not a performance tool — it is a legal process wearing a coaching costume.

The honest framing: performance management is two systems sharing one set of paperwork. System one is **evaluation** (ratings, calibration, compensation, promotion). System two is **development** (feedback, coaching, growth). They conflict. Evaluation needs comparability; development needs honesty. A single review cycle tries to do both and does each worse than it would separately. The best managers I have seen do not resolve this tension — they manage it explicitly, telling their reports: "This conversation is about your growth. That conversation, the one in calibration, is about your rating. They are related but not the same."

## Decision framework: what kind of problem is this?

Before any performance action — praise, feedback, rating, PIP — diagnose which quadrant you are in. Most management mistakes are category errors: treating a coaching problem as a firing problem, or an expectations problem as a skills problem.

```
                     Performance gap is SKILL-based
                     (can't do it yet)
                          |
   Coaching works         |         Role mismatch likely
   Invest: mentoring,     |         Consider: scope change,
   pairing, courses,      |         role change, transfer
   stretch with support   |
--------------------------+--------------------------
                          |
   Motivation /           |         Behavior / values
   clarity problem        |         problem
   Fix: expectations,     |         Hardest quadrant:
   autonomy, context,     |         document, confront
   sometimes compensation |         directly, PIP or exit
                          |
                     Performance gap is WILL-based
                     (won't do it, or doesn't care)
```

Two notes on this grid. First, **skill problems are almost never fireable** on their own — if someone cannot do something yet, that is usually a hiring or scoping error, and the fix is coaching, training, or a different role. Second, the hardest quadrant is not low skill; it is high skill with a values or behavior gap — the brilliant engineer who poisons the team. That quadrant cannot be coached away by more technical challenge. It requires direct confrontation, and most new managers avoid it for months. The cost of avoiding it is paid by everyone else on the team, in morale and in departures.

A practical diagnostic checklist before you act:

- **Is the expectation documented and mutually understood?** If you cannot point to where you stated it, the problem may be yours.
- **Is this a pattern or an incident?** One bad sprint is an incident; three quarters of declining delivery is a pattern. Manage patterns, note incidents.
- **Would a reasonable person with this person's information have done the same?** If yes, it is a context or expectations problem, not a performance problem.
- **Have I given direct feedback with a specific ask and a deadline?** If not, you have not managed yet — you have only observed.

## Calibration, done honestly

Calibration is the meeting where managers across an org align ratings so that "exceeds expectations" means roughly the same thing in every team. In theory it corrects for generous and harsh graders. In practice it has its own failure modes.

**How to do it well:**

- **Write evidence-based packets.** Every rating claim needs a cited artifact: the migration they led, the incident they resolved, the design doc that changed a decision. "Strong collaborator" without evidence is a vibe; "unblocked three teams by rewriting the deploy pipeline in Q2" is a record. Calibration rooms respect records.
- **Calibrate against impact, not activity.** The engineer who shipped the most PRs and the engineer who killed a doomed project in week two can both be top performers. Calibrate on outcomes and leverage — what changed because this person was here — not on volume.
- **Bring the distribution with you.** Know where your team sits on the forced curve before you walk in. If you argue that all six of your engineers exceed expectations, you will be heard as naive or political. Pick your battles: one or two ratings you will defend with evidence, the rest you accept. This is ugly and it is true.
- **Debrief your reports after.** The engineer should never learn their rating's journey from a hallway rumor. Tell them what you argued for, what the room decided, and — this is the part most managers skip — what it would take for the rating to be different next cycle. That last sentence is the difference between a rating that demotivates and one that directs.

**What goes wrong in calibration:**

- **The recency tax.** The engineer who shipped a visible win in October gets rated on it; the engineer whose foundational work shipped in February gets forgotten. Managers should keep a running log per report — a simple markdown file with dated entries — precisely to fight this. If your evidence all comes from the last eight weeks, you have not been managing all year.
- **The loudness premium.** Visibility is not impact. The engineer who presents well in all-hands and the engineer who quietly keeps the critical path unblocked are different people; calibration rooms over-reward the first unless someone speaks for the second. That someone is you.
- **Compression.** Every org has a band where ratings pile up — usually "meets expectations" absorbing people who should be at either adjacent band. Compression is a management failure: it means you lacked the courage to differentiate, and your top performers notice. They always notice.

## Writing feedback that changes behavior

Good feedback has a structure. Not a template for HR's sake — a structure because unstructured feedback becomes either vague praise or character assassination. The pattern that works:

**Situation, behavior, impact, ask.** Observe a specific moment, name the behavior (not the person), describe the impact it had, and make a concrete ask.

```markdown
# Feedback log entry (keep one per report, dated)

## 2026-09-14 — Design review for the ingestion service

**Situation:** Thursday's architecture review, ~15 people present.
**Behavior:** You interrupted the platform team twice during their
              walkthrough to correct minor points about the schema.
**Impact:** They stopped contributing for the rest of the session,
           and we lost the one perspective that could have caught
           the retention-policy issue.
**Ask:** In reviews, note corrections and raise them at the end or
         in the doc. I want your technical eye; I want it timed so
         the room keeps talking.

Follow-up: revisit in the 1:1 on 2026-10-05.
```

Rules that matter:

- **Behavior, not identity.** "You interrupted" is a behavior. "You're arrogant" is an identity attack. Feedback on identity triggers defensiveness and changes nothing.
- **Timely or useless.** Feedback has a half-life measured in days. If you wait three weeks, the moment is dead and the conversation becomes archaeology. The running-log habit exists to make same-week feedback cheap.
- **Bidirectional by design.** Ask every report, regularly: "What is one thing I should do differently as your manager?" If you cannot take feedback, you cannot give it credibly. This is not softness; it is the price of admission.
- **Written for the hard ones.** Verbal feedback for routine growth; written feedback for anything that might end up in a PIP, a promotion packet, or a dispute. If it matters, write it down and share the written version with the person. Surprises are a management failure, not a management tool.

One more opinion: **the feedback sandwich is garbage.** Padding criticism with praise teaches people to distrust your praise. Say the hard thing plainly and kindly, in its own conversation, and give genuine praise in its own conversation. People can handle directness. They cannot handle manipulation.

## PIPs: the last resort, done right

A performance improvement plan is a formal, time-boxed plan — typically 30 to 90 days — with specific goals, weekly check-ins, and a binary outcome: improvement demonstrated, or employment ends. Let me be blunt about what a PIP is and is not.

**What a PIP is not:** a coaching tool. By the time a PIP is appropriate, informal coaching has already been tried and documented. A PIP that appears without prior documented feedback is not a PIP — it is a termination with paperwork.

**What a PIP is:** a final, explicit, fair chance with clear terms. The ethical core of a PIP is that the person knows exactly what "good enough" looks like and has a genuine opportunity to reach it. Most PIPs fail this test. They are written with moving goalposts, goals the person cannot plausibly hit in the timeframe, or — the most common failure — a decision already made, with the PIP as legal cover.

**Running one honestly:**

1. **Before the PIP:** months of documented feedback, specific asks, deadlines, and check-ins. The PIP meeting should contain zero new information for the employee.
2. **The plan itself:** three to five measurable goals, each with a definition of done and a date. "Improve code quality" is not a goal. "Ship the auth refactor with zero sev-1/sev-2 regressions attributable to the change, reviewed and merged by week 6" is a goal.
3. **Support, genuinely offered.** A PIP without support is a setup. Pairing time, a mentor, reduced scope elsewhere, weekly 1:1s with honest progress reads. If you would not invest this support, admit the decision is made and skip the theater — a clean, generous exit is kinder than a rigged PIP.
4. **Weekly written check-ins.** Progress against each goal, in writing, shared with the employee. No ambiguity at the end about what happened.
5. **The outcome conversation.** If they pass, say so clearly and reset the relationship — a PIP survivor who is treated as damaged goods will leave anyway. If they fail, end it quickly, respectfully, and with a fair package. Dragging it out helps no one.

The hardest truth about PIPs: **a well-run PIP usually ends in departure anyway**, because the trust required for a healthy working relationship has already broken down. That does not make the PIP pointless — it makes honesty the point. The person deserves to know where they stand, to have a real shot, and to leave with dignity if the shot misses. Anything less is cowardice dressed as process.

## Coaching vs. managing out

This is the distinction new managers get wrong most often, in both directions. They coach when they should manage out (keeping a failing hire for a year, destroying team morale), and they manage out when they should coach (firing a junior for a gap that mentoring would have closed in a quarter).

**Coach when:** the gap is skill or clarity, the person is engaged, they respond to feedback with changed behavior, and the trajectory is positive even if the current level is below bar. Coaching is an investment with a visible return curve. Give it time — real skill growth takes quarters, not weeks.

**Manage out when:** the gap is sustained despite clear feedback and real support, the behavior is a values problem (undermining colleagues, dishonesty, chronic unreliability), or the role fundamentally does not fit the person and no adjacent role exists. Managing out is not failure — keeping someone in a role where they cannot succeed is the failure. The kindest thing is clarity, delivered early, with a fair runway.

The test I use: **"If this person gave notice tomorrow, would I fight to keep them?"** If the answer is an immediate yes, coach harder. If the answer is relief, you have already made the decision — you are just delaying the conversation. Delayed exits are a tax on everyone: the team carries the load, the person stagnates in a role that does not fit, and your credibility as someone who deals with reality erodes.

## Anti-patterns

- **The annual ambush.** Saving feedback for review season. Feedback delivered when it can no longer change anything is not feedback; it is a verdict.
- **Managing by rating.** Letting the desired rating drive the narrative instead of letting the evidence drive the rating. The packet should be written before the rating is decided, not after.
- **The halo/horns effect.** One strong trait (great presenter, fast coder) coloring the entire evaluation, or one incident poisoning it. The per-report log is the antidote — it forces you to look at the whole record.
- **Promoting your best engineer into management by default.** The skills are different. A brilliant IC who does not want to manage will become a mediocre manager and you will lose a brilliant IC. Make the management track opt-in with eyes open, and keep the IC track genuinely parallel — staff and principal levels with real scope, not consolation titles.
- **The "brilliant jerk" exception.** Tolerating corrosive behavior because the output is high. The math never works: one toxic high-performer costs you two or three good engineers who quietly leave, plus the collaboration tax on everyone who stays. Address it or accept that you are choosing it.
- **Calibrating in a vacuum.** Rating your team without understanding how other teams' "exceeds" looks. Spend time with peer managers before calibration, not just during it.

## What good looks like: how to start

If you are a new engineering manager inheriting a team, here is the first-90-days version:

1. **Week 1–2:** Start a dated feedback log per report (a simple markdown file is fine). Read their last two review cycles. In 1:1s, ask each person: what does great look like in your role, and what is getting in your way?
2. **Week 3–4:** Write down explicit expectations per person — what "meeting expectations" means for their level and role, in concrete terms. Share it with them. Most performance problems I have seen were expectations problems in disguise.
3. **Ongoing:** Give feedback weekly — small, specific, both directions. Log it the same day. Never let an observation age more than a week without a conversation.
4. **Monthly:** Review your logs. Is anyone's trajectory changing? Is anyone stuck? One stuck quarter is a coaching conversation; two is a plan; three without change is an exit conversation.
5. **Before calibration:** Write the packet from evidence, decide the rating from the packet, and pre-align with peer managers on what the bands mean this cycle.

And the meta-habit: **manage the system, not just the people.** If the same performance problem appears in three reports, it is probably an org problem — unclear strategy, broken tooling, overloaded on-call — wearing a performance costume. Fix the system and the "performance issues" often evaporate. The best performance management is frequently not about performance at all.

---

*More engineering leadership notes at https://doshidhruv.com — including hiring, growing staff engineers, and running effective reviews.*
