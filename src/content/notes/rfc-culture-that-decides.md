---
title: "RFC culture that actually decides"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Engineering leadership
categories: [Leadership, Architecture, Process]
---

Most engineering organizations have an RFC process. Few have an RFC culture. The difference: a process produces documents; a culture produces decisions. I've seen RFC repos with hundreds of beautifully written proposals and no record of what was actually chosen — the documents were discussion theater, and the real decisions happened in hallways afterward. An RFC culture that works has one non-negotiable property: every RFC ends with a decision, an owner, and a date. Everything else is technique for getting there.

## Why RFCs exist (and what they're not for)

**RFCs are decision-making tools, not documentation tools.** The point of an RFC is to resolve a question that multiple reasonable engineers disagree on — or would disagree on if they talked about it. "Should we adopt this event schema?" "Which database for the new service?" "Do we build or buy the notification system?" If there's no real decision to make — if the answer is obvious, or one person can just decide — an RFC is waste. The most common RFC failure is writing one when a Slack message would do.

**RFCs are for decisions with a blast radius.** The threshold question: who is affected by this decision, and can they live with being surprised by it? If the decision affects one team and is easily reversible, decide it in the team. If it affects multiple teams, creates a precedent, or is expensive to reverse, it earns an RFC. This threshold should be written down — "decisions affecting more than one team or costing more than X to reverse need an RFC" — because unwritten thresholds get renegotiated every time someone doesn't feel like writing.

**RFCs are not design docs.** A design doc describes how to build something already decided. An RFC proposes what to decide and why. Conflating them produces 20-page RFCs that are really implementation plans with a decision smuggled in on page 17. If the decision is made, write a design doc. If it isn't, write an RFC — and keep the implementation detail out until the decision lands.

Verdict: before writing an RFC, answer one question in one sentence: "what decision does this document need to produce?" If you can't, don't write it.

## The anatomy of an RFC that decides

Every section of the RFC exists to serve the decision. Cut anything that doesn't.

**Context: the problem, in business terms first.** What breaks, costs money, or blocks progress if this isn't decided? Engineers skip context and dive into options; reviewers then argue about solutions to a problem they don't share an understanding of. Two paragraphs: what's happening, why it matters now. If the "why now" is weak, the RFC is premature — park it.

**Constraints and requirements.** What's non-negotiable? Compliance requirements, latency budgets, team skill constraints, timeline realities. Stating constraints explicitly does half the decision work — options that violate constraints eliminate themselves, and reviewers can't relitigate settled constraints disguised as option preferences. This is also where you state what you're *not* solving: scope boundaries prevent the RFC from becoming a referendum on adjacent systems.

**Options considered — with honest trade-offs.** Minimum two real options; three is the sweet spot. Each option gets: what it is (a paragraph, not a page), its advantages, its disadvantages, and its cost — in engineering time, operational burden, and risk. The critical discipline: **present the trade-offs of your preferred option honestly.** An RFC that makes one option look perfect and the others look stupid isn't a decision document — it's a sales pitch, and reviewers can tell. Nothing destroys RFC credibility faster than the discovery that the "obvious" choice had hidden costs the author minimized.

**Always include the "do nothing" option.** What happens if we don't decide, or decide to keep the status quo? Sometimes the answer is "things continue to work fine and this RFC was unnecessary" — valuable information. Sometimes it's "the current approach collapses under next year's load" — which sharpens the urgency. The null option grounds the discussion in reality instead of letting every proposal compete only against idealized alternatives.

**Recommendation with reasoning.** The author recommends an option and says why — connecting the recommendation to the constraints and trade-offs above. The recommendation is not the decision (that's what the process produces), but an RFC without one is abdication. "Here are some options, you decide" pushes the author's job onto the reviewers, who have less context. Have a position. Defend it. Be willing to lose.

**Decision record.** The RFC ends with a section filled in *after* the process: what was decided, by whom, on what date, and what the dissent was. This is the part most RFC cultures skip, and it's the part that makes the whole thing work — because a decision nobody wrote down didn't happen.

```markdown
## Decision (filled by the decider, not the author)

- **Decided:** Option B — event-sourced inventory with Postgres outbox
- **Decider:** [name], [date]
- **Rationale:** Meets the audit-trail constraint; team already operates
  Postgres; rejected Option A (Kafka Streams) on operational-cost grounds
  given current team size — revisit when the team grows past 15.
- **Dissent:** [name] preferred Option A for throughput headroom; agreed to
  revisit if p99 produce latency exceeds 50ms for two consecutive quarters.
- **Review date:** 2027-04-01 (revisit triggers documented above)
```

Verdict: an RFC template without a decision section is a discussion template. The decision section is what makes it an RFC.

## The decision mechanics: who decides, and by when

This is where RFC cultures live or die, and it's the part most process docs leave vague.

**Every RFC has a named decider.** Not "the team," not "consensus" — a person. The decider is whoever owns the consequences: the tech lead for team-scoped decisions, the architect or staff engineer for cross-team ones, the engineering manager or director when the decision is really about priorities. Name them in the RFC header. "Decider: TBD" means the RFC isn't ready to circulate.

**Every RFC has a decision deadline.** Two weeks is the default for cross-team RFCs; less for urgent ones, more for genuinely strategic ones. The deadline is real: when it passes, the decider decides with whatever input exists. Deadlines without enforcement are wishes — the enforcement is cultural (the decider is expected to decide) and procedural (an untriaged RFC shows up in a review meeting's backlog).

**Default to the decider, not to consensus.** Consensus is wonderful when it happens naturally and paralyzing when it's required. The RFC process gathers input and surfaces disagreement; it does not require everyone to agree. The decider's job is to make the call *after* hearing the input, including overruling reasonable objections. Organizations that require consensus get either endless discussion or false consensus — everyone nods, nobody commits, and the decision gets relitigated the moment implementation gets hard.

**Disagree and commit is a real obligation.** Once the decider decides, the dissenters commit — genuinely, not performatively. This requires two things: the dissent is recorded (so people feel heard), and the decision is revisited if the dissent's predicted failure materializes (so committing isn't surrender). "Disagree and commit" without a revisit path is just "shut up and comply," and engineers can tell the difference.

Rule of thumb: if an RFC is open for more than a month without a decision, the problem is never the RFC's quality — it's that nobody with authority is willing to decide. Escalate the *decider*, not the document.

## Async-first, meetings last

**The RFC process runs async by default.** The document circulates; reviewers comment in their own time; the author responds and revises. Async review produces better technical feedback than meetings — people think before they write, the reasoning is recorded, and timezone-distributed teams participate equally. The meeting is the exception, not the venue.

**Call a meeting only for specific deadlocks.** "We need to talk about the RFC" is not a reason. "Options A and B are tied on technical merit and the choice comes down to a priority call between two teams' roadmaps" is a reason — and the meeting has the decider, the two option champions, and a 30-minute timebox. The meeting's output is a decision, not more discussion. If the meeting ends without one, the decider decides async within 48 hours.

**Comment quality is a cultural norm worth enforcing.** "LGTM" on a consequential RFC is abdication. Good RFC comments: point out a missed constraint, challenge a trade-off assessment with evidence, propose an option the author missed, or state explicit approval with reasoning. Tech leads should model this — their comments set the standard — and should privately coach reviewers who consistently add noise or silence.

**The author curates, not just collects.** As comments arrive, the author updates the RFC: incorporates valid corrections, adds considered-but-rejected options to an appendix, and summarizes threads. The RFC at decision time should read as a coherent document, not a comment thread stapled to a proposal. This curation work is real work — budget time for it, and recognize it.

Verdict: an RFC process that defaults to meetings will produce decisions at the speed of calendar availability. Async-first is what lets a 500-person org decide things in two weeks.

## What earns an RFC (and what doesn't)

Write the threshold down, or everything becomes an RFC and nothing gets decided quickly.

**Earns an RFC:** cross-team API contracts and event schemas; database and infrastructure choices for new systems; build-vs-buy decisions above a cost threshold; security architecture changes; deprecations affecting other teams; any decision that's expensive to reverse (data migrations, public API shapes, multi-quarter commitments).

**Doesn't earn an RFC:** implementation details within a decided architecture; library choices within a team (unless they create org-wide precedent); anything one person can decide and easily reverse; urgent production fixes (decide now, write the retrospective later); decisions where the options are genuinely equivalent (flip a coin and document it — the RFC's value is in *deciding*, not in agonizing).

**The lightweight path.** Not every cross-team decision needs the full RFC ceremony. A "mini-RFC" — problem, options, recommendation, decider, one-week deadline — handles the middle ground. The existence of the lightweight path is what keeps the heavyweight path credible: if every decision requires the full process, people route around it.

**Appeals.** Someone affected by a decision who wasn't consulted gets one appeal: new information the RFC didn't consider, presented to the decider within a defined window. Appeals are not re-votes — "I disagree" isn't new information. This balances inclusivity against finality, and the window (say, two weeks post-decision) keeps it from becoming permanent relitigation.

Rule of thumb: if your RFC backlog keeps growing, the threshold is too low or the deciders are too slow. Fix the threshold first — it's the cheaper change.

## The RFC and the ADR: how they connect

RFCs decide; ADRs record. The RFC is the deliberation — options, debate, dissent. The ADR is the outcome — what was decided and why, in a permanent, discoverable record. Every decided RFC should produce (or link to) an ADR. The RFC can then be archived; the ADR is what future engineers find when they ask "why is it built this way?"

**Don't make people read the RFC to find the decision.** The ADR contains the decision, the key trade-offs, and the context needed to understand it — self-contained. The RFC link is there for the archaeologists who want the full debate. If understanding a decision requires reading 80 comments, the ADR failed.

**ADRs are revisited, not rewritten.** When a decision's revisit trigger fires (documented in the decision section), the outcome is a new ADR that supersedes the old — linked, not edited. History stays intact. This is how the organization learns: the chain of superseded ADRs is the actual architectural history, more honest than any wiki.

## Running the culture: the unglamorous parts

**Someone owns the RFC backlog.** A rotating role — often a staff engineer or architect — triages incoming RFCs: is the decider named? Is the threshold met? Is the deadline set? Untended RFCs rot; a lightweight triage (30 minutes weekly) keeps the pipeline moving. This is pure process hygiene, and it matters more than any template.

**Review RFC health quarterly.** How many RFCs were opened? How many decided on time? How many decisions got revisited within six months (a sign of bad decisions) versus never revisited (a sign of either good decisions or dead process)? The metrics aren't for performance evaluation — they're for tuning the process. An RFC culture that never examines itself calcifies.

**Celebrate good dissent.** When someone's recorded dissent turns out to be right and the revisit trigger fires, say so publicly. This is the single highest-leverage cultural act in an RFC culture: it proves that dissent is safe and that decisions are genuinely revisable. Organizations that punish "I told you so" — even subtly — teach everyone to stay silent, and silent reviewers are how bad decisions ship.

**Onboard people into it.** New engineers should read three decided RFCs (with their ADRs) in their first month — not as process training, but as organizational history. "This is how we decide things, and here's what we've decided" is the fastest way to give someone the context to contribute. The RFC archive is the closest thing most orgs have to institutional memory; treat it that way.

## Anti-patterns

**The RFC as CYA.** Writing an RFC to distribute blame for a decision already made — "we consulted everyone" — rather than to actually decide. Reviewers sense it immediately, and it poisons the well for genuine RFCs.

**Design by committee.** Letting the comment thread redesign the proposal until it's a compromise nobody wanted. The author owns the proposal; reviewers advise; the decider decides. When the RFC becomes a group authoring exercise, accountability dissolves.

**The eternal draft.** An RFC that sits in "draft" for months because the author keeps polishing. Ship the draft at 70% — the review process is what improves it. Perfectionism in RFCs is procrastination with better formatting.

**Decisions without deciders.** The RFC that ends with "the team agreed" — no name, no date. Six months later, nobody remembers what was agreed, and the decision gets relitigated. Every decision needs a name next to it.

**RFC theater for mandates.** Leadership has already decided; the RFC is staged to create the appearance of input. This is worse than not having an RFC process — it teaches engineers that participation is performative, and they'll stop participating in the genuine ones too.

## Closing

An RFC culture that decides is built from unglamorous parts: named deciders, real deadlines, honest trade-offs, recorded dissent, and the discipline to write the decision down. None of it is complicated. All of it is rare — because it requires people with authority to actually exercise it, and people with objections to actually commit. The organizations that do this well don't have better templates. They have the habit of deciding, and the RFC is just where the habit lives.
