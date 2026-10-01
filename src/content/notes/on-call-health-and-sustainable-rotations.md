---
title: "On-call health and sustainable rotations"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: SRE
categories: [SRE, On-Call, Team Health]
---

On-call is where every reliability decision your organization makes gets cashed out. Architecture debt, monitoring gaps, deploys without safety nets, feature velocity without operational headroom — all of it lands on the pager of whoever is on rotation this week. If on-call feels unsustainable, that is not a staffing problem. It is a systems problem, and the system includes the rotation itself.

## The real problem

The standard story is that on-call is hard because incidents are hard. That is backwards. Incidents are occasional. What makes on-call grinding is everything around incidents: the low-quality pages that fire at 2 AM for things that could have waited until morning, the alerts nobody trusts so everyone ignores, the tribal knowledge that means the new hire pages the senior engineer who pages the ex-employee's memory. The pager is the symptom; the load is generated upstream.

Three facts about on-call that organizations keep relearning:

1. **Alert volume is a choice.** Every alert is a policy decision someone made about what deserves to interrupt a human. Most alert configs are inherited, not designed. They fire because they fired last quarter and nobody pruned them.

2. **Rotation design is compensation.** Being on-call has a real cost: disrupted sleep, constrained evenings, background anxiety. If the organization does not account for that cost — in pay, in time off, in recognition — it is extracting a subsidy from whoever holds the pager. Subsidies run out.

3. **Heroics are a signal, not a solution.** When one engineer absorbs the on-call load because "they know the system best," the organization is not being resilient. It is concentrating single points of failure in a human being. The hero is the bus factor wearing a cape.

## Rotation design: the mechanics that matter

### Rotation length and frequency

The trade-off is context-switching cost versus fatigue. Longer rotations (2 weeks) mean the on-call person builds context across incidents and handles repeats well, but they are exhausted by day 10 and their sprint work has quietly collapsed. Shorter rotations (3–4 days) spread the load thinly but every rotation starts cold — diagnosis is slower because context rebuilds every handoff.

What actually works for most teams:

- **One-week rotations** as the default. Long enough to see patterns, short enough to survive. Anything longer needs explicit justification (tiny teams, very low page volume).
- **No back-to-back rotations.** The person who just finished a hard week should not be first backup the next week. Protect the recovery.
- **Handoffs are a ritual, not a calendar event.** A 15-minute sync — what is in flight, what is flaky, what deploy is landing mid-week — beats a schedule entry. New on-call should be able to state the current risks of the system before the old on-call disconnects.

### Team size and the math of sustainability

There is a minimum viable team size for sustainable on-call, and it is larger than most orgs admit. A useful heuristic: if any one person is on-call more than one week in four, the rotation is not sustainable — it is a countdown to attrition. That means a service with meaningful page volume needs at least four people who can independently hold the pager, and realistically five or six to absorb vacations, sick leave, and the inevitable hard week that needs recovery time.

Smaller than that? You have options, none of them free:

- **Combine rotations across related services**, with a documented escalation path and a real investment in runbooks so a neighboring team can genuinely triage.
- **Buy down the page volume** (see alert hygiene below) until the load matches the team you have.
- **Be honest that the service is operating below safe staffing** and make that visible to leadership, because the alternative is the quiet attrition that looks sudden but was a year in the making.

### Primary, secondary, and the escalation that actually works

Two-tier rotations fail when secondary is just "the person who gets woken up when primary is stuck." Define the trigger: secondary gets engaged after N minutes without progress, or when the incident exceeds a severity threshold, or when primary requests help. Unwritten rules mean primary either suffers alone too long or escalates too early and burns out secondary.

Write down the answers to three questions:

1. What does primary own outright, without escalation? (Restart the pod, run the runbook, page the dependent service's on-call.)
2. What always engages secondary? (Customer-facing impact over X minutes, any data-loss risk, any incident primary cannot diagnose in 20 minutes.)
3. When does the incident commander role transfer, and to whom?

## Alert hygiene: where on-call load is actually generated

Every page should be a decision a human needs to make now. If the correct response to an alert is "acknowledge and wait," it is not a page — it is a ticket. If the correct response is "restart the thing," the alert is a bug report against your automation. If the correct response is "ignore, this fires every deploy," the alert is lying and must be fixed or deleted.

Run this exercise quarterly. It is the highest-leverage on-call work you can do:

1. **Export every alert that paged in the last 90 days.** For each one, ask: did a human need to act within 30 minutes? If not, demote it to a ticket or a dashboard.
2. **Find the alerts that fire and are always ignored.** These are worse than useless — they train the team to distrust paging, which means the real page gets answered slower. Delete them or fix the threshold. There is no third option.
3. **Check alert-to-runbook coverage.** Every remaining page should link to a runbook that is current. A page without a runbook is a page that says "good luck." If the runbook does not exist, the alert should not page until it does.
4. **Measure alert fatigue directly.** Track pages per person per week, and the percentage of pages that required no action ("noise rate"). A noise rate above 20–30% is a system in failure, even if uptime looks fine.

The dirty secret: most teams can cut their page volume in half with one hygiene pass and lose zero real coverage. The pages that remain will be answered faster, because they will be trusted again.

## Measuring on-call burden

You cannot fix what you do not measure, and "how was on-call this week" in a retro is not measurement. Track these:

- **Pages per person per week**, including off-hours vs. business-hours split. Off-hours pages are the expensive ones.
- **Time to acknowledge and time to mitigate**, per alert. Degrading trends here usually mean alert fatigue or runbook rot, not laziness.
- **Interruption rate**: how often is the on-call person's sprint work displaced by incidents? If it is more than ~20–30% of their week, their planned work is fiction and the sprint plan is lying to everyone downstream.
- **Post-incident recovery**: does the on-call person get the next day lighter, or do they roll straight into a full sprint day after a 3 AM page? The recovery day is not a perk. It is maintenance on the human.

Put these numbers in front of engineering leadership regularly. On-call burden is invisible to everyone except the people carrying it, and invisible costs get cut first.

## Compensation and recognition

Being on-call is work. It constrains where you can be, what you can do, and how you sleep. Organizations that treat it as "part of the job" without any accounting are relying on goodwill, and goodwill is not a compensation strategy.

What good looks like, from least to most formal:

- **Explicit time accounting.** On-call weeks count in capacity planning. The on-call person takes fewer sprint points, and this is normal, not a favor.
- **Recovery time.** A rough night means a late start or a light day, no questions, no hero narrative required.
- **On-call pay or bonuses** for off-hours burden, where the org's structure allows it. Even modest on-call pay changes the psychology: the organization has acknowledged the cost.
- **Recognition in performance review.** Sustained, quiet on-call work — the weeks where nothing paged because the person fixed the flaky alert last quarter — should be visible in reviews, not just the dramatic 3 AM saves.

The path from heroics to sustainability runs through making the invisible work visible. The engineer who spent their rotation deleting noisy alerts and fixing runbooks did more for reliability than the one who heroically debugged a 4 AM incident. The review system should know that.

## Anti-patterns: how on-call cultures rot

**The hero rotation.** One person holds the pager most of the time because they are the best at it. This feels efficient and is actually fragility: the team's reliability is now one person's health and employment status. Fix it by making heroism unnecessary — runbooks, automation, shadowing — not by asking the hero to train a replacement in their spare time (they have no spare time).

**Paging as monitoring.** "Just page me if it breaks" is not an observability strategy. It is the absence of one. Every incident that was discovered by a page should prompt the question: what signal existed before the page fired, and why did no automation or dashboard surface it first?

**The silent backlog of toil.** Toil — manual, repetitive operational work — accumulates quietly. Track it. A common target: on-call toil should be shrinking quarter over quarter. If the same manual steps appear in every incident, they are not "part of the job," they are automation candidates that keep getting deprioritized.

**Blameless in name only.** If the incident review focuses on what the on-call person did wrong at 3 AM, people will stop reporting near-misses, stop admitting confusion, and start quietly absorbing risk. The review is of the system that produced the incident, including the system that put a tired human in front of it.

**Follow-the-sun as a staffing shortcut.** Follow-the-sun rotations across time zones can genuinely reduce off-hours burden, but only if every region's on-call is equally empowered: same runbook access, same deploy permissions, same authority to make the call. A follow-the-sun rotation where the night shift cannot act without waking up the day shift is just off-hours paging with extra steps.

## Shadow rotations and onboarding: growing the on-call bench

The fastest way to make a rotation unsustainable is to have too few people who can hold the pager. The fix is a deliberate pipeline, not hope.

**Shadow rotations** are the mechanism: a new team member shadows the primary for one full rotation — they watch, they ask questions, they do not get paged. The next rotation, they are primary with the previous primary as a highly-available secondary. The rotation after that, they are on their own. Three rotations to independence is a reasonable pace; rushing it produces an on-call engineer who pages the senior engineer for everything, which just moves the load around.

Shadowing only works if the runbooks are real. A shadow rotation against stale runbooks teaches the new hire that runbooks cannot be trusted, which is the opposite of the lesson. Before putting someone through shadowing, the team should do an alert-hygiene pass and a runbook review. The new hire's fresh eyes are actually an asset here — every "wait, this runbook step doesn't match reality" is a finding.

**The onboarding checklist** for pager-readiness should be explicit and written down: can independently triage the top five alert types, knows the escalation paths, has run the failover procedure in a game day or drill, knows where the dashboards are and which ones to trust. "They've been here three months" is not a readiness criterion. Demonstrated competence is.

And the reverse matters too: **offboarding the pager.** When someone leaves the rotation — team change, parental leave, burnout recovery — there should be a handoff, not a gap. The remaining team absorbs the load explicitly, with leadership visibility into the increased burden, not silently.

## The path from heroics to sustainability

Sustainability is not a state you achieve; it is a direction you move. The sequence that works:

1. **Measure the load.** Pages per person, noise rate, interruption rate. You need the baseline before you can argue for change.
2. **Cut the noise.** One alert hygiene pass. This is the fastest win and it builds trust in the pager.
3. **Fix the rotation mechanics.** Minimum team size, no back-to-backs, real handoffs, defined escalation.
4. **Automate the toil.** Every manual step in the top five runbooks is a candidate. You do not need AI; you need a script that restarts the thing and a check that verifies it worked.
5. **Make the cost visible.** Report on-call burden to leadership the way you report uptime. When the cost is visible, the staffing and compensation conversations get easier.

None of this is glamorous. That is the point. Sustainable on-call is not built from incident war stories; it is built from a hundred small decisions — a deleted noisy alert, a current runbook, a recovery day that nobody had to ask for. The teams that last are the ones that treat the pager as a system to be engineered, not a burden to be endured.
