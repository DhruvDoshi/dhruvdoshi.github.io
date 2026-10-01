---
title: "Monorepo decisions"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Platform architecture
categories: [Platform Engineering, Developer Productivity, Architecture]
---

Monorepo versus polyrepo is one of those decisions teams treat as a fashion choice. It is not. It is a decision about your build system, your ownership model, and how much tooling tax you are willing to pay. Get it right and cross-service changes become trivial; get it wrong and you have either a hundred repos nobody can keep in sync or one repo whose build takes an hour and whose CODEOWNERS file is a war zone.

This note treats it as the real decision it is: what each model demands, where each wins, the tooling tax nobody budgets for, how ownership works inside a single repo, and how to migrate in either direction without stopping the world.

## The real problem

The question is not "one repo or many." The question is: **how do changes that span multiple components get made, tested, and shipped safely?** In a polyrepo, a change touching the API and its three consumers means coordinated PRs across four repos, version bumps, and a release train. In a monorepo, it is one PR, one CI run, one atomic commit. That atomicity is the entire argument for monorepos, and it is a genuinely powerful one.

But atomicity is not free. A monorepo concentrates problems that polyrepos distribute: build times, test times, access control, ownership clarity, and the blast radius of a bad commit. The decision is about which set of problems you would rather have, given your team size, your build tooling, and your architecture.

A useful framing: **the repo structure should follow the change coupling, not the team chart.** If your services change together constantly — shared libraries, API contracts, cross-service refactors — a monorepo removes real daily friction. If your services evolve independently with stable contracts between them, a polyrepo's isolation is a feature, not a bug. The mistake is choosing the structure first and discovering the coupling later.

## Decision framework

Score your situation on these axes. No single axis decides, but the pattern across them usually points clearly.

```
Axis                                    Favors monorepo ←→ Favors polyrepo
─────────────────────────────────────────────────────────────────────────
Cross-component change frequency        Daily ────────── Rare
Team size                               < ~200 ───────── > ~500
Shared code / libraries                 Heavy ────────── Minimal
Build system maturity                   Strong ───────── Weak
Need for per-repo access control        Low ──────────── High (regulated, multi-tenant teams)
Independent deployability required      No ───────────── Yes (separate release trains)
Contract stability between components   Fluid ────────── Stable, versioned
```

Two of these deserve emphasis because teams underestimate them:

**Build system maturity is the load-bearing axis.** A monorepo without an incremental, hermetic build system (Bazel, Buck2, Pants, Nx, Turborepo — pick your ecosystem) is just a large directory that takes 40 minutes to test. The build system must answer two questions correctly and fast: *what changed?* and *what is affected by the change?* If it cannot, your CI runs the world on every PR and developers start avoiding the repo. In the Node.js/TypeScript world, tools like Nx or Turborepo with remote caching get you most of the way; in Python, Pants or Bazel. The point is not which tool — it is that "just run everything" stops working somewhere between 50 and 200 engineers, and you need the affected-graph before you get there, not after.

**Access control is the axis that kills monorepo dreams in regulated environments.** If different teams' code has different compliance requirements — one service handles PCI data, another is a public marketing site — a single repo means everyone with repo access can read everything. Git's permission model is per-repo, not per-directory (sparse workarounds exist but they are workarounds). When auditors or contracts require real separation, polyrepo is not a preference, it is a requirement. Be honest about this early.

## Patterns and trade-offs

### What monorepos do well

- **Atomic cross-cutting changes.** Rename an API field, update all five consumers, update the shared client library, all in one PR with one CI signal. In a polyrepo this is a multi-day coordination exercise with version windows where things are half-migrated. This is the killer feature and it compounds: teams in monorepos refactor more aggressively because refactoring is cheap.
- **One toolchain.** One lint config, one formatter, one dependency-update bot, one CI template. The consistency dividend is real — onboarding is "clone one repo, run one command," and platform teams maintain one pipeline instead of N.
- **Code discoverability.** `grep` across the whole codebase. Finding every caller of a function, every usage of a deprecated API, every place a config value is read — trivial in a monorepo, a multi-repo search project in a polyrepo. This matters more than people expect for deprecations and migrations.
- **Shared libraries without the versioning tax.** Internal libraries can be consumed at head. No publishing, no version bumps, no "which version of the auth client is service X on" archaeology. The trade-off, honestly stated: consumers get breaking changes immediately rather than at upgrade time. You have traded versioning overhead for breakage risk, and you manage it with CI running consumers' tests against library changes (which the monorepo makes possible).

### What polyrepos do well

- **Blast-radius isolation.** A bad commit, a broken build, a compromised credential affects one repo. CI failures are local. This is not just operational — it is psychological: teams feel safe moving fast when they cannot break strangers.
- **Independent versioning and release trains.** When components genuinely evolve at different speeds with stable contracts, per-repo versioning is the honest model. Forcing them into lockstep releases through a monorepo creates coupling the architecture does not need.
- **Clear ownership boundaries.** Repo boundaries are the strongest ownership signal in software. "This is the payments repo, the payments team owns it" needs no CODEOWNERS file, no documentation, no enforcement. In a monorepo, ownership must be constructed and maintained deliberately (see below) — it does not come for free.
- **Access control and compliance.** Per-repo permissions are real. Contractors get the repos they need. Regulated code stays in repos with restricted access. Auditors understand repos; they do not understand directory-level conventions.

### The honest middle

Most organizations over ~200 engineers end up with a hybrid: a small number of monorepos (per domain, per platform, per large team) rather than one repo to rule them all or a repo per service. "Monorepo per bounded context" gets you atomicity where change coupling is highest and isolation where it matters. Do not let purity override pragmatism — the goal is easy cross-cutting changes, not repo-count minimalism.

## Ownership boundaries in one repo

This is where monorepos actually fail in practice — not in build times (solvable with tooling) but in ownership. Without repo boundaries, you need to construct ownership explicitly:

**CODEOWNERS with teeth.** Every directory has an owning team, enforced by required reviews. But CODEOWNERS alone rots: teams change, directories drift. The rules that keep it alive:

```
# CODEOWNERS — ownership is a living document, reviewed quarterly
/apps/checkout/          @org/payments-team
/apps/checkout/ci/       @org/platform-team      # platform owns CI config everywhere
/libs/auth/              @org/identity-team
/libs/ui/               @org/design-systems-team
/infra/terraform/        @org/platform-team
# Default: unowned code requires platform-team review (forces explicit ownership)
*                        @org/platform-team
```

- **The default-owner rule.** Unowned code defaults to a review from the platform team, which creates social pressure to claim ownership explicitly. Code without an owner is a liability; make the liability visible.
- **Cross-team change protocol.** Changing another team's directory requires their review (CODEOWNERS enforces it) *and* a heads-up in their channel for anything beyond a trivial fix. The monorepo makes cross-team changes easy; the protocol keeps them respectful.
- **Directory-level conventions as architecture.** In a polyrepo, the repo boundary enforces "don't reach into another service's internals." In a monorepo, you need conventions with the same force: public APIs per package (an `index.ts` or `__init__.py` that defines the surface), no deep imports across team boundaries enforced by lint rules (e.g., eslint import restrictions, or Bazel visibility). Without this, the monorepo quietly becomes a big ball of mud with a single git history.

**The stewardship model.** Beyond per-directory ownership, successful monorepos have stewards for cross-cutting concerns: the build system, the CI templates, dependency upgrades, the flag inventory. These are platform-team responsibilities, and they need to be staffed — a monorepo with no build steward degrades into a slow, flaky mess within a year. This is part of the tooling tax: budget the headcount, not just the tools.

## The tooling tax, itemized

Nobody budgets for this and everyone pays it. A monorepo requires, at minimum:

1. **Incremental build/test selection.** CI must compute the affected graph and run only what changed plus dependents. Without this, CI time grows linearly with repo size and developer velocity dies. This is the single most important investment.
2. **Remote caching and execution.** Build artifacts and test results cached across developers and CI machines. The second engineer to build a commit should not rebuild the world. (Bazel's remote execution, Nx Cloud / Turborepo remote cache, or equivalents.)
3. **Trunk-based discipline.** Monorepos and long-lived branches are a miserable combination — the merge conflicts scale with repo size. Short-lived branches, daily integration, feature flags. (See the trunk-based development note.)
4. **Large-repo git ergonomics.** Sparse checkout, partial clone, and scalar-style tooling so developers are not cloning gigabytes to change one service. This is table stakes past a certain size and it needs to be set up *before* developers feel the pain.
5. **Dependency management at scale.** One lockfile (or a coherent set) for the repo, with automated updates and CI that verifies dependents. The upside is no diamond-dependency hell across repos; the cost is that one bad dependency upgrade breaks everyone simultaneously. Canary the upgrades, keep the revert path fast.
6. **Code search and navigation.** At scale, `grep` stops being enough; invest in indexed code search. Developers who cannot find code will duplicate it, and duplication in a monorepo is especially corrosive because everyone assumes shared code exists.

Honest accounting: for a team under ~30 engineers, this tax mostly is not worth paying — a polyrepo of modest size with good templates gives you 80% of the benefit with 20% of the tooling. The monorepo payoff starts when cross-repo coordination becomes a daily tax, which is usually somewhere past 50 engineers or past ~15 actively-changing services.

## Migration strategy

**Polyrepo → monorepo.** Do not do a big-bang migration. The pattern that works:

1. Start with the highest-coupling cluster: the services and libraries that change together most often. Move those first.
2. Preserve git history (use `git subtree` or filter-repo merges, not copy-paste). History is institutional memory; throwing it away has a real cost in archaeology.
3. Migrate CI per-component: each moved component gets the monorepo CI template, with affected-graph selection from day one. Do not migrate code before the incremental CI works — you will get exactly one chance to make the "monorepo CI is fast" first impression.
4. Keep the old repos as read-only archives with a pointer to the new location. Do not delete for at least two quarters; someone always needs the old history or the old CI config.

**Monorepo → polyrepo (extraction).** Sometimes the right move — a team needs isolation, a component gets spun out, compliance demands separation:

1. Extract along existing ownership boundaries (your CODEOWNERS file tells you where the seams are — if it does not, that is a finding).
2. Set up the extracted repo's CI *before* the move, templated from the monorepo's.
3. Version the seam: the extracted component's interface to the monorepo becomes a versioned contract (published library, API version). This is the real cost of extraction — you are giving up atomicity across that seam permanently.
4. Expect a 2–4 week productivity dip for the extracted team. Plan for it; do not let it become evidence the extraction was wrong.

## When polyrepo is the right call

Say it plainly — polyrepo wins when:

- Components have **stable, versioned contracts** and evolve independently. Forcing lockstep on independent things is pure cost.
- **Compliance or contracts require access separation.** PCI, healthcare data, defense work, or simply enterprise customers with data-handling clauses. Do not fight this with clever git workarounds.
- The org is **small enough that coordination is cheap** (< ~30 engineers). The monorepo tooling tax buys you nothing you do not already have via a Slack message.
- Teams need **genuinely independent release trains** with different risk profiles — the team shipping regulated financial software and the team shipping the marketing site should not share a release process.
- You are **acquiring companies or working with external vendors** whose code cannot live in your repo for legal or practical reasons.

## Anti-patterns

- **The monorepo without the build system.** Just a big repo with `npm test` at the root running everything. CI takes an hour, developers stop running tests locally, main breaks constantly. This is the most common monorepo failure and it is entirely predictable.
- **CODEOWNERS as wallpaper.** Ownership files that nobody reviews, with teams that no longer exist owning directories nobody maintains. Ownership must be re-verified quarterly or it is fiction.
- **Deep imports across team boundaries.** The monorepo makes it *possible* to reach into another team's internals; without lint-enforced package boundaries it becomes *normal*, and then you have a distributed monolith with extra steps.
- **The repo-per-microservice extreme.** 200 repos for 200 services, each with its own CI config, its own dependency versions, its own onboarding. The coordination tax exceeds any isolation benefit. If you cannot `grep` across your system, you do not have a system — you have a rumor of one.
- **Migrating for fashion.** "Company X does monorepo" is not a reason. Company X also has a dedicated build team of 50 people. Match the decision to your coupling, your size, and your willingness to pay the tooling tax.
- **Shared libraries at head without consumer CI.** Consuming libraries at head is the monorepo superpower, but only if library changes run consumers' tests. Without that, "at head" means "broken without warning."

## How to start / what good looks like

If you are deciding now, for a growing org:

1. **Measure the coupling first.** For one month, track how many PRs span multiple repos. If it is a daily occurrence, you have a monorepo-shaped problem. If it is rare, you do not.
2. **Pilot with the coupled cluster.** Move the 3–5 most entangled services and their shared libraries. Stand up affected-graph CI and remote caching before or with the move.
3. **Write the ownership rules on day one.** CODEOWNERS, the default-owner rule, the cross-team change protocol, package boundary linting. It is ten times harder to retrofit ownership than to establish it.
4. **Staff the stewardship.** Name the build/CI steward. Put the monthly dependency-upgrade and flag-inventory reviews on the calendar. Budget this as real work, not volunteer work.
5. **Revisit annually.** The right answer at 40 engineers is not the right answer at 400. Put the repo-strategy question on the architecture review calendar once a year and re-score the decision framework honestly.

What good looks like: a developer clones one repo, runs one command, and has a working environment. A cross-service change is one PR with a CI signal that runs in minutes and tests exactly what is affected. Ownership of every directory is unambiguous and current. The build steward's dashboard shows green. And when someone asks "why monorepo," the answer is a measured coupling diagram, not a blog post.

---

*More platform engineering notes at https://doshidhruv.com — including build systems, CI/CD design, and developer productivity.*
