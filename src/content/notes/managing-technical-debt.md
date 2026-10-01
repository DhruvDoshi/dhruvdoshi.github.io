---
title: "Managing technical debt like a portfolio"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Staff engineering
categories: [Staff Engineering, Technical Debt, Strategy]
---

"Technical debt" is the most overused and least managed concept in software engineering. Every team says they have it. Almost none can say how much, where it is, what it costs, or what they're doing about it — beyond intending to "address it next quarter," as they did last quarter.

The portfolio metaphor is the way out, but only if taken seriously. A portfolio isn't a pile of regrets; it's positions, each with a rationale, a cost of carry, and an expected return. The job isn't eliminating debt — it's managing it: know what you hold, price it honestly, pay down what costs more than it's worth, and borrow deliberately when the return justifies it.

## The portfolio metaphor, done right

Ward Cunningham's original metaphor was precise: shipping first-time code is like going into debt — a little debt speeds you up, provided you pay it back promptly. The industry kept the word and lost the discipline: the prompt repayment, the deliberate borrowing, the accounting.

A real portfolio has three properties your debt management needs. **Positions are explicit**: the debt is written down — what was borrowed, why, what repayment looks like. Debt you can't enumerate isn't a portfolio; it's a swamp. **Positions have carry costs**: slower velocity, incident risk, onboarding friction — real whether or not you measure them. **Positions are managed**: a regular cadence where the team reviews its holdings and makes explicit hold, pay-down, and take-on decisions. Not a one-time audit — a cadence.

And the key insight: **the goal is not zero debt.** A company with zero debt isn't investing or isn't shipping. Leverage — deliberate, priced, managed — is how you move fast. The enemy isn't debt; it's *unpriced, invisible, unmanaged* debt.

## Classifying debt: the Fowler quadrants, with practical use

Martin Fowler's quadrant — deliberate vs. inadvertent, prudent vs. reckless — separates *intent* from *wisdom*. Each quadrant needs different handling:

**Deliberate and prudent.** "This design won't scale past current volume; we're shipping it anyway for the launch date, revisiting at 10x." This is leverage. It goes in the register with the repayment trigger. The only quadrant that belongs in a healthy portfolio without apology.

**Deliberate and reckless.** "We should write the migration, but let's ship and hope." Sometimes the right call under deadline — but record it as what it is, with who made the call and when it gets revisited. Sunlight is the treatment.

**Inadvertent and prudent.** "We designed it the best way we knew; we've since learned better." The quadrant of growth — right for five engineers, wrong for fifty. No blame; when you spot it, record it.

**Inadvertent and reckless.** "We didn't know what we were doing and didn't know it." Copy-paste, no tests, no understanding of failure modes. The most expensive quadrant because it's invisible to its creators — never recorded, compounding silently. The treatment is structural: review, pairing, hiring bars, architecture guidance. Prevention, because remediation is slow and expensive.

## Making debt visible

Invisible debt can't be managed. The toolkit, in order of leverage:

**The debt register.** A simple document listing known debts: what, where, why (which quadrant), what it costs, what repayment looks like, who owns the decision. Keep it short — 200 entries isn't a register, it's a backlog nobody reads. Curate ruthlessly: the register holds debts worth discussing. Review monthly with the team, quarterly with leadership.

**Architecture Decision Records.** ADRs capture the *decisions* behind deliberate debt: context, options, the trade-off accepted — and the conditions for revisiting. "We chose the simpler queueing design; revisit past throughput X or when ordering guarantees are needed." An ADR with a revisit condition is a debt entry with a built-in trigger.

**Code annotations that actually get read.** Bare `TODO`s are where debt goes to die. If you annotate in code, make it actionable: what, why, the fix trigger, a link to the register entry — and tie annotations to the register so a quarterly script reports open annotated debts and their ages. Annotations without a review mechanism are litter.

What doesn't work: automated "debt dashboards" nobody looks at, stale wikis, and oral tradition ("don't touch billing, it's fragile") — invisible debt with extra steps.

## Pricing debt: what interest looks like

Price interest in terms the org already uses:

**Slowed velocity.** Debt-heavy areas take longer to change. Crude measure: lead time for changes touching the module vs. the codebase average. "Roughly 3x" is enough to prioritize — you don't need precision.

**Incident risk.** Correlate post-mortems with the register: what fraction of incidents touched known debt? "Three of our last five SEVs were in the module we've been deferring" is the pricing that moves leadership.

**Hiring and onboarding drag.** New engineers take longer to ramp in debt-heavy areas; experienced engineers avoid them — concentrating the debt further. Ask in onboarding surveys which code was hardest to understand and why. The answers are a debt map.

**Opportunity cost.** The features you can't build safely because the foundation won't support them. Often the largest cost, hardest to price. The framing: "to build X, we first pay down Y, costing Z" — converting abstract debt into a concrete gating item on something product wants.

**Morale cost.** Engineers know where the debt is; working in it daily while flagged issues go unaddressed is a retention risk. Rarely on a spreadsheet; frequently in exit interviews.

One paragraph per significant position. That's the pricing.

## Deciding what to pay down: expected value, not guilt

Teams pay down the wrong debt constantly — usually what's most *annoying* rather than most *expensive*. Guilt and irritation are bad portfolio managers. Expected value is the discipline:

**Expected value = (interest saved + risk retired + capability unlocked) − cost of paydown**, each estimated roughly, in business terms.

Rank the register by this. The results surprise: the ugly-but-stable module everyone hates may have near-zero interest (nobody touches it, it never breaks) — satisfying to fix, accomplishing little. The boring data-access layer every feature touches may carry enormous interest.

Three filters before committing:

1. **Is it actually costing us?** Debt in untouched, unbroken code has near-zero interest. Leave it — or tombstone it: "we know, we're not fixing it, here's why."
2. **Will the paydown stick?** Paying down an area about to be rewritten or deprecated is wasted work. Check the roadmap first.
3. **Is paydown cheaper than containment?** Sometimes the right move is isolating the debt behind an interface so its interest stops spreading — the strangler pattern applied to debt — rather than full repayment.

And the meta-rule: **pay down debt the business feels, or that blocks something the business wants.** Engineer-only pain is real but harder to fund — bundle it: "we'll harden the data layer as part of feature X, making X faster to build."

## The 15–20% capacity rule, and when to break it

Standard guidance: reserve 15–20% of capacity continuously for debt paydown and tech investment — not occasional "debt sprints." Continuous paydown prevents the accumulation that forces crisis rewrites and avoids feast-or-famine attention.

Three legitimate exceptions. **Break it upward when interest compounds**: if each sprint's velocity is visibly lower than the last, 20% won't catch up. Time-box a focused quarter at 40–50% with explicit goals and an exit criterion. **Break it downward when deliberately borrowing**: launches and market windows are for *taking on* deliberate/prudent debt — said out loud, in planning, with the repayment quarter named. **Break it for architectural debt**: service-boundary and data-model debt doesn't fit in 20% slices; it needs dedicated, staffed investment with its own plan.

The failure mode isn't the percentage — it's treating the percentage as the *plan* instead of the *budget*. "We spend 20% on tech debt" says nothing about *which* debt or *why*. The register plus expected-value ranking is the plan; the capacity is just funding.

## Paydown strategies

**The boy scout rule, with limits.** Leave code cleaner than you found it — small opportunistic improvements in code you're already touching. Works for code-level debt; never reaches stable-but-rotten areas or architectural debt. Enforce the limit: "while I'm here" refactors that balloon PR scope are scope creep. Touch what you're touching; file a ticket for the rest.

**Dedicated paydown sprints.** Work when debt is well-understood and decomposable into sprint-sized chunks. Fail when they become permanent — endless "debt sprints" admit the normal process can't handle debt, and train product to treat paydown as cuttable. Time-box them, goal them, end them.

**Platform-led remediation.** Cross-cutting debt — the deprecated library in forty services, the insecure pattern everywhere — never gets prioritized by individual teams, because each team's share of pain is small while the aggregate is large. This is a platform-team job: centrally driven, with codemods and automation where possible, migration tooling and deadlines where not.

**Containment.** Isolate the debt behind an interface, stop new code depending on it, let it serve its remaining life without spreading. The right strategy for low-interest debt in stable systems nearing end of life — often the highest-expected-value move.

**The debt budget per project.** Every significant project gets an explicit allowance: "you may take on X days of deliberate debt, recorded, with repayment scheduled." Normalizes deliberate borrowing — and makes *undeclared* debt visible by contrast.## Negotiating with product: translate debt into roadmap risk

Engineering says "we need to pay down tech debt"; product hears "stop shipping features to polish code." The fix is translation — debt is never the subject; *roadmap risk* is.

Don't say: "The service layer is a mess; we need two sprints to refactor."
Say: "Features X, Y, Z all touch the service layer. Changes there take 3x our average lead time and caused two of our last five incidents. Two weeks hardening now, or X, Y, Z each slip with elevated incident risk. Here's the math — your call."

The pattern: **debt → consequence → options → recommendation.** Name what it threatens on *their* roadmap, offer the trade-off explicitly, recommend. This respects product's actual job instead of asking them to care about code quality as an abstract virtue.

Three tactics that work: **bundle paydown with features** ("hardening auth as part of X adds a week but de-risks X and everything after"). **Use incident currency** — the post-incident window is when systemic fixes get approved; have the register ready. **Make the cost of *not* paying visible in estimates** — "5-day feature plus 3-day debt tax." Over time product starts asking *you* when the paydown happens. That's the conversation inverting in your favor.

What doesn't work: craftsmanship sermons, threats, unilateral slowdowns, or giant rewrite proposals with no incremental path. All destroy trust — and trust is the currency.

## Architectural debt vs code debt

**Code debt** lives in implementation: tangled functions, missing tests, outdated dependencies. Holders: the owning team. Fixes: refactoring and upgrades that fit in sprints and the 20% budget. Visible to engineers working in it; payable incrementally without coordination.

**Architectural debt** lives in structure: service boundaries mismatched to team boundaries, data models that can't express what the business needs, the shared database coupling five teams. Holders: *no single team* — it spans ownership, which is why it accumulates. Fixes need coordination, migration plans, dedicated staffing, leadership sponsorship.

Consequences: code debt is manageable team-by-team with a register and the capacity rule. Architectural debt needs a named owner (usually staff+) and milestones. Code paydown is low-risk and reversible; architectural paydown — extraction, migration, interface changes — needs strangler patterns, dual-write periods, rollback plans. And code debt is found by reading code; architectural debt is found by *pain* — the unbuildable feature, the three-service incident, the team that can't deploy independently. When you feel it, name it explicitly instead of letting it masquerade as unrelated code problems.

The classic failure: treating architectural debt as code debt — background tasks, the 20% budget, surprise when it never gets paid down. If the debt spans teams, the fix must span teams, with someone holding the coordination.

## Measuring debt without drowning in tooling

Skip the "technical debt ratio" dashboards in invented currencies. Minimum viable instrumentation: **the register itself** — open positions, age distribution; growing faster than shrinking is the signal. **Lead-time delta** for debt areas vs. average, recomputed quarterly. **Incident correlation** — fraction of incidents touching register items. **Rework rate** in debt areas. If measuring costs more than the insight, the measurement is debt.

## When to declare bankruptcy: rewrite criteria

Rewrites fail because they discard accumulated bug fixes and edge-case handling embedded in old code, take longer than estimated while the old system still needs maintenance, and accumulate second-system-effect scope. Declare bankruptcy only when most of these hold:

1. **The architecture can't support the next 2–3 years of roadmap** — one blocked feature is a paydown problem, not a rewrite problem.
2. **The technology is end-of-life or unhirable** — abandoned framework, or nobody will work in it. A forcing function, not a preference.
3. **Incremental paydown was genuinely attempted and failed** — a real staffed effort, not "we never got around to it."
4. **You can bound it**: clear scope, a strangler path for coexistence, and organizational patience for a multi-quarter effort with dropped feature velocity.
5. **The domain is well-understood.** Rewriting a poorly-understood domain rediscovers every requirement the hard way.

Otherwise: strangler, containment, targeted paydown. The clean slate is a lie — the complexity came from the domain, and the domain comes with you.

## Anti-patterns

**Debt sprints that never end.** Permanent "paydown mode" means paydown was never integrated into planning — and it gets cancelled at the first deadline, teaching everyone it's optional.

**The rewrite fantasy.** A full rewrite proposed whenever the debt conversation gets uncomfortable — procrastination disguised as ambition. Apply the bankruptcy criteria ruthlessly.

**Invisible debt.** No register, no ADRs, no annotations — just oral tradition. If it's not in the register, it doesn't exist for planning.

**Paying down debt nobody feels.** The pristine refactor of the stable module while the incident-causing one rots — engineer preference over expected value. Trust the ranking, not the itch.

**Debt as a moral category.** Debt as sin and paydown as virtue produces guilt-driven prioritization and contempt for teams that borrowed deliberately. It's leverage — manage it without moralizing.

**The big-bang paydown.** "Stop features for a quarter and fix everything" never survives the roadmap, and all-or-nothing framing makes partial progress count as failure. Continuous, prioritized paydown wins.

**Blaming the past.** "Who wrote this garbage?" — probably deliberate and prudent given what was known then. Blame turns the register into a weapon; people stop recording debt when recording gets them attacked. The register is blameless by policy.

## Closing

Manage debt like a portfolio: explicit positions, priced carry costs, a regular rebalancing cadence, deliberate leverage when the return justifies it. Classify with the quadrants so the conversation is about management, not guilt. Make it visible — register, ADRs with revisit conditions, annotations tied to review. Price interest in business terms, rank paydown by expected value, keep 15–20% flowing, and negotiate with product in roadmap risk.

Not zero debt — the *right* debt: deliberately taken, honestly priced, visibly managed, paid before the interest eats the roadmap. The team with a clean register and steady cadence ships faster than the team with no debt, because it isn't afraid of leverage. That's the whole game.
