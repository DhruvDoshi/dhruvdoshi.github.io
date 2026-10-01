---
title: "Staff-plus archetypes: the four paths that actually exist"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Engineering leadership
categories: [Leadership, Staff Engineering, Career]
---

Ask ten staff engineers what their job is and you'll get ten different answers — not because they're confused, but because staff-plus isn't one job. It's a scope band containing several genuinely different roles that happen to share a level. Understanding which of the four archetypes you are — and which one your organization needs — is the difference between a staff career that compounds and one that stalls at "senior with a fancier title."

The four paths: the **Solver**, the **Tech Lead**, the **Architect**, and the **Right Hand**. None is better than the others. Each has a different shape of impact, different failure modes, and different career risks. Most staff engineers are primarily one of these with traces of a second. The mistake is performing one while being evaluated as another.

## The Solver: the one they call when it's on fire

The Solver is the engineer who lands on the hardest technical problems — the ones that have already defeated two teams. A cascading failure across services, a performance cliff nobody can explain, a data corruption issue with no reproduction. The Solver's impact is measured in problems that *stop existing*.

**What this path demands.** Genuine depth across the stack: the Solver reads kernel traces, query plans, distributed traces, and application code in the same session, and forms hypotheses faster than teams can gather data. The defining skill isn't knowledge — it's diagnosis under pressure: narrowing a possibility space ruthlessly, knowing which evidence to gather first, and being right often enough that people stop questioning the method. This is also the path most dependent on raw technical ability; you cannot fake your way through a production incident with process skills.

**How Solvers create leverage.** Counterintuitively, the Solver's leverage comes from making the problem class disappear, not from being the person who solves each instance. The great Solver writes the runbook, builds the diagnostic tooling, fixes the systemic cause — and then is never called for that problem again. The mediocre Solver becomes the permanent on-call for a category of fires, which feels like importance but is actually a trap: you've made yourself load-bearing for dysfunction.

**The failure mode.** Becoming the organization's incident janitor. If your calendar is all fires and none of it is prevention, you're not a Solver — you're a very expensive firefighter, and the organization has no incentive to fix the arson problem because you're so good at putting fires out. The Solver must periodically refuse the fire and demand the prevention work, even though the fire is more visible and more thanked.

**Career risk.** Solvers are the most visible archetype in a crisis and the least visible in calm quarters. Performance reviews written during quiet periods struggle to capture "the outage that didn't happen." Solvers must document prevention work obsessively — the incident that was avoided is invisible unless you write it down.

Verdict: the Solver path is for engineers whose superpower is technical diagnosis and who can discipline themselves to convert each fire into prevention. If you secretly enjoy the fire more than the fix, this path will eat your career.

## The Tech Lead: force multiplier for one team

The Tech Lead is the staff engineer embedded with a single team, raising that team's output and technical quality. Where the Solver parachutes in, the Tech Lead lives there — shaping the roadmap's technical content, setting the bar in code review, designing the systems the team builds, and growing the engineers around them.

**What this path demands.** The Tech Lead's core skill is judgment exercised through other people: knowing when to write the design doc yourself versus coaching a senior through writing it; when to block a PR versus leaving a comment; when the team needs a decision versus when it needs to struggle with the decision a bit longer. This is the archetype where "leverage" is most literal — your output is the team's output — and it requires genuine comfort with not being the one who writes the code.

**The Tech Lead sets the team's technical ceiling.** Teams converge toward their Tech Lead's standards: the rigor of their reviews, the depth of their design docs, their attitude toward testing and operability. This is slow, invisible, compounding work. A team with a strong Tech Lead for two years looks *fundamentally* different — better designs, fewer incidents, seniors who leveled up — but no single quarter shows it. That's the point, and that's the political vulnerability.

**How this differs from management.** The Tech Lead has no direct reports and no hiring/firing authority, but carries technical accountability for the team's systems. The boundary with the engineering manager must be explicit: the Tech Lead owns technical direction and quality; the manager owns people, priorities, and process. When the boundary blurs, the Tech Lead becomes a manager without the title or the authority — doing 1:1s and performance calibrations while being evaluated on technical output. Name the split out loud, in writing, early.

**The failure mode.** Becoming the team's bottleneck. The Tech Lead who must review every PR, approve every design, and answer every technical question has built a team that can't function without them — which is the opposite of leverage. The test: can the team ship a significant feature, well-designed, while you're on vacation? If not, you're not leading the team; you're carrying it.

**Career risk.** The Tech Lead's impact is deeply legible *inside* the team and nearly invisible *outside* it. Promotion cases built on "the team is great now" need translation into organizational language: incident reduction, delivery predictability, engineers promoted. Tech Leads must maintain relationships two levels up, or their impact gets attributed to the manager.

Verdict: the Tech Lead path is for engineers who get more satisfaction from a team shipping well than from personal technical heroics — and who can resist the gravitational pull into management while still exercising its technical half.

## The Architect: technical direction across teams

The Architect operates above any single team: defining the technical direction that multiple teams build toward, resolving cross-team technical conflicts, and making the decisions that are too big or too cross-cutting for any one team to own. If the Tech Lead is depth in one place, the Architect is coherence across many.

**What this path demands.** Systems thinking at organizational scale: seeing how twelve teams' independent decisions compose into an architecture, and spotting the composition failures before they happen. The Architect's tools are different from the Solver's — not debuggers but RFCs, architecture reviews, platform strategies, and the political skill to get autonomous teams to converge without formal authority. The hardest part: your decisions are only as good as the teams' willingness to follow them, and you have no org chart to compel anyone.

**Architects decide by writing.** The architecture review, the strategy doc, the RFC that frames the options — this is where the Architect's work lives. The discipline is writing decisions that are *actually decisions*: options considered, trade-offs stated, a choice made, consequences owned. Architects who write beautifully vague strategy docs that commit to nothing are performing the role without doing it. Every architecture document should end with someone being able to say "so we're doing X, not Y" — and the Architect's name next to that choice.

**The Architect's relationship with teams is advisory until it isn't.** Most of the time, the Architect influences: reviews, guidance, shared patterns. But some decisions need teeth — security baselines, data contracts, platform migrations — and the Architect must know which decisions require enforcement and secure that enforcement from engineering leadership *before* the conflict, not during it. An Architect who discovers mid-dispute that they have no authority has already lost.

**The failure mode.** The ivory tower. The Architect who stops reading code, stops understanding the systems they're directing, and issues guidance from increasing altitude. The symptoms: designs that ignore operational reality, teams that nod in reviews and build something else, and a growing gap between the architecture diagrams and production. The cure is non-negotiable: stay close enough to implementation that your guidance survives contact with it. Review real PRs. Sit in real incidents. Know what the systems actually do.

**Career risk.** Architects produce the most documentation and the least directly attributable output of any archetype. "We went with event-driven architecture for the new platform" is a decision whose value materializes over years — and whose failures get blamed on execution, not the decision. Architects need long feedback loops and sponsors who understand them.

Verdict: the Architect path is for engineers who think in systems of teams and can make binding technical decisions without positional authority — while staying close enough to the code that their decisions are grounded.

## The Right Hand: the leader's technical partner

The Right Hand is the staff engineer partnered with a director or VP: the technical brain for organizational decisions. They shape the engineering strategy, run the technical side of planning, handle the cross-cutting initiatives that don't fit in any team, and translate between leadership's goals and engineering reality. This is the archetype closest to management without being management.

**What this path demands.** Organizational awareness: understanding how decisions actually get made, who needs to be aligned, what the business constraints are, and where the bodies are buried. The Right Hand reads the organization the way the Solver reads a stack trace. They also need the communication range to write a strategy memo for the VP in the morning and debug a design disagreement between two teams in the afternoon — and the judgment to know which mode each situation needs.

**The Right Hand makes leadership's technical decisions good.** Engineering leaders make consequential technical calls — reorgs that split systems, platform bets, build-vs-buy, hiring plans for specialized roles — often without deep technical context. The Right Hand is the person who ensures those calls are grounded: "that reorg will split the team that owns the payment pipeline's two halves," "that platform bet requires skills we don't have and can't hire this year." This is enormous leverage when it works, and it's almost entirely invisible.

**The failure mode.** Becoming the leader's shield. The Right Hand who absorbs all the organizational friction — delivering bad news upward, absorbing complaints downward, sitting in every meeting — becomes indispensable to one person and invisible to the organization. When that leader leaves, the Right Hand's position evaporates, because their authority was borrowed, not earned. The discipline: build direct relationships and visible impact independent of the leader, even while serving them.

**Career risk.** This is the archetype most likely to be *perceived* as "not a real engineer" by peers — too many meetings, too few commits. Some of that perception is wrong (organizational work is real work), and some of it is a warning: if you've stopped being able to evaluate technical work deeply, you've drifted from staff engineer into chief of staff. The Right Hand must keep a technical practice — reviews, designs, incident involvement — or lose the credibility the role depends on.

Verdict: the Right Hand path is for engineers with organizational instincts and communication range who want maximum leverage through leadership — and who can keep their technical edge sharp while living in meetings.

## How the archetypes relate

```
                    scope of impact
                         ▲
                         │     Architect
                         │    ╱
                         │   ╱  Right Hand
                    ─────┼─────────────────► organizational
                         │   ╲    ╱            vs technical
                         │    ╲  ╱             depth
                         │  Tech Lead
                         │    │
                         │  Solver
                         │
              technical depth ◄────► org breadth
```

The map isn't a hierarchy — it's a landscape. Solver and Tech Lead are deep in technical execution; Architect and Right Hand trade some depth for breadth. Movement between archetypes is normal and often necessary: the Solver who keeps getting pulled into prevention work is becoming an Architect; the Tech Lead whose team is thriving may be needed as a Right Hand. The danger is drifting without deciding — doing Right Hand work while being evaluated as a Solver, for instance — because each archetype is judged by different evidence.

**Organizations need all four, but rarely staff for all four.** Most companies hire "staff engineers" and get whichever archetype shows up, then wonder why their architecture is incoherent (no Architect), their teams aren't leveling up (no Tech Lead), their incidents recur (Solver doing firefighting, not prevention), or their strategy is ungrounded (no Right Hand). If you're hiring at staff-plus, hire for the archetype you need, not the level.

## Choosing your path honestly

**Start with what energizes you, not what's prestigious.** The industry romanticizes the Architect and undervalues the Tech Lead; your career shouldn't follow the industry's status hierarchy. The Solver who loves the hunt will be miserable writing strategy docs. The Right Hand who loves organizational chess will be miserable in a debugger. Energy is data — a decade-long career runs on it.

**Then check what your organization rewards.** Some companies promote Architects and treat Tech Leads as "not strategic enough." Others only recognize the Solver's firefighting. You can fight your organization's reward system, but know that you're fighting it — and decide whether the fight is worth it or whether the archetype/organization fit is just wrong.

**Play to a primary, keep a secondary.** The most effective staff engineers have a clear primary archetype and a functional secondary: the Architect who can still Solver when it matters, the Tech Lead with Right Hand instincts about organizational dynamics. The secondary is what makes you adaptable when the organization's needs shift — and they will.

**Reassess every 18 months.** Archetype fit isn't permanent. The team you tech-led is now senior and self-sufficient; the organization just hired a VP who needs a Right Hand; the platform migration needs an Architect. Careers compound when you move deliberately between archetypes as needs change, and stall when you cling to one past its usefulness.

Rule of thumb: if you can't name which archetype you're currently performing — in one sentence, without hedging — you're probably performing none of them well.

## Anti-patterns

**The shadow VP.** A Right Hand who starts making people decisions — influencing hiring, driving performance narratives — without the accountability of management. Influence without accountability is the most corrosive dynamic in engineering leadership.

**Title without scope.** A "staff engineer" whose scope is one service and whose decisions affect one team is a senior engineer with a title bump. The archetypes all require scope beyond a single team — that's what the "plus" means. If the scope isn't there, the honest move is to grow into it, not to perform it.

**Archetype hopping for visibility.** Doing a quarter of Solver work, then a quarter of Architect work, chasing whatever is most visible. Each archetype's impact compounds over time; hopping resets the compounding. Pick one and commit for at least a year.

**The permanent interim.** Filling a gap — "we need someone to tech-lead this team until we hire" — and staying in it for two years because nobody hired. Interim work is real, but it should have an expiry date, or the organization learns that gaps get filled for free.

## Closing

Staff-plus is not a promotion; it's a change of profession, and the profession has four specialties. The Solver, the Tech Lead, the Architect, and the Right Hand each represent a different answer to the question "how does one engineer create outsized impact?" Know which answer you're giving, make sure it's the one your organization needs and rewards, and be honest when it's time to change your answer. The engineers who stall at staff-plus almost never stall for lack of ability — they stall because they're performing an archetype nobody asked for.
