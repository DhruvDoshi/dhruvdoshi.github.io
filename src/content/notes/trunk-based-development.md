---
title: "Trunk-based development"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Platform architecture
categories: [Platform Engineering, CI/CD, Developer Productivity]
---

Every team eventually has the branching argument. One side waves the merge-conflict scars of long-lived feature branches; the other side waves the production incidents of "we merged straight to main." Both sides are arguing about the wrong thing. The branching model is downstream of your CI discipline, your deploy safety, and your culture. Pick the model your engineering practices can actually support, not the one the blog posts told you to want.

This note is the honest comparison: what trunk-based development demands, what makes it work (feature flags, fast CI, small batches), where it genuinely hurts, and what to do instead when it does.

## The real problem

Version control strategy is really a question about **integration risk**. Code written in isolation accumulates divergence from the codebase it will eventually join. The longer the isolation, the bigger the divergence, the more painful and risky the merge. Long-lived branches defer integration pain and concentrate it into a single, terrifying merge event. Trunk-based development forces integration to happen continuously, in small doses, every day.

The core claim of trunk-based development: **all developers commit to a single shared branch (trunk, usually `main`) at least daily, and releases are cut from trunk.** There are no feature branches that live for weeks. Short-lived branches (hours, a day or two at most) are fine — the rule is about integration frequency, not about never branching.

Why this matters more than it sounds: integration frequency is the dominant variable in delivery risk. A team merging daily has small, reviewable, revertable changes. A team merging monthly has a merge event that nobody fully understands and everybody fears. The fear is rational — big merges break things — and the fear then causes longer branches, which cause bigger merges. It is a doom loop, and trunk-based development is the deliberate decision to break it.

## The CI discipline it demands

Here is the part the advocates sometimes gloss over: trunk-based development is not a git workflow. It is a CI/CD discipline with a git workflow attached. Without the discipline, committing to trunk daily is just breaking main daily. The prerequisites are non-negotiable:

**1. Fast, reliable CI on every commit.** If your pipeline takes 45 minutes and flakes 10% of the time, developers will batch changes to avoid running it — and batching is exactly what trunk-based development forbids. The target: a commit-to-signal loop under 10 minutes for the fast checks (lint, unit tests, type checks), with slower suites (integration, e2e) running async but still gating release. Flaky tests must be quarantined or fixed aggressively; a flaky suite trains the team to ignore red builds, and a team that ignores red builds cannot do trunk-based development.

```yaml
# The shape of a trunk-friendly pipeline: fast signal first,
# slow signal async, release gated on all green

stages:
  - name: fast-checks          # must complete in < 10 min
    steps: [lint, typecheck, unit-tests]
    gate: block-merge-on-failure

  - name: build-and-scan       # container build, SBOM, CVE scan
    steps: [docker-build, trivy-scan, sign-artifact]

  - name: slow-checks           # async, gates release not merge
    steps: [integration-tests, contract-tests, load-smoke]
    gate: block-release-on-failure

  - name: progressive-release   # flag-gated, canary, auto-rollback
    steps: [deploy-canary, verify-metrics, promote-or-rollback]
```

**2. Main is always releasable.** This is the cultural contract. A red main is a stop-the-line event — whoever broke it fixes it or reverts, immediately, before any new work. Teams that let main stay red "because we'll fix it after lunch" do not have trunk-based development; they have chaos with a single branch. The revert-first norm is essential: reverting is not failure, it is the safety valve that makes small-batch merging safe.

**3. Small changes.** Trunk-based development forces a skill most teams lack: decomposing work into shippable increments. A three-week feature must become fifteen daily merges, each one safe behind a flag or structured as a pure refactor. This is genuinely hard and it is genuinely valuable — it is the same decomposition skill that makes good architecture. If your team cannot slice work this way, trunk-based development will be painful, and the pain is telling you something real about your engineering maturity.

**4. Feature flags as the release mechanism.** Branching by feature is replaced by flagging by feature. The flag system becomes load-bearing infrastructure: it needs targeting rules, kill switches, audit trails, and cleanup discipline. More on this below — it is the single biggest hidden cost.

## Feature flags: the enabler and the tax

You cannot do trunk-based development on any real product without feature flags. Incomplete work must be merged (to keep integration flowing) but must not be active (to keep main releasable). The flag is the mechanism that separates *deploy* from *release* — code can ship to production while remaining dark.

The pattern that works:

```
main branch ──▶ CI ──▶ artifact ──▶ production
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
              flag: new-checkout  flag: new-search  flag: OFF
              status: 10% rollout status: internal  (code present,
              targeting: beta                       behavior unchanged)
              cohort
```

Flag hygiene rules that separate teams that thrive from teams that drown:

- **Every flag has an owner and an expiry date.** A flag without an expiry is permanent complexity. Review the flag inventory monthly; stale flags are tech debt with a kill switch attached.
- **Short-lived flags for releases, long-lived flags for operations.** Release flags (the new checkout flow) should die within weeks of full rollout. Operational flags (maintenance mode, kill switches, tier-based entitlements) are permanent by design. Do not manage both the same way.
- **Flag evaluation must be fast and local.** Flags fetched over the network on every request add latency and a new failure mode. Evaluate from a local snapshot (a sidecar, an in-memory config refreshed on interval) with a sane default when the flag service is unreachable. The default for a release flag should be *off* — fail closed.
- **Test the matrix, not just the flag.** With N flags you have 2^N combinations; nobody tests them all. Test the combinations you actually ship (all-off, all-on, and each flag's rollout states), and keep the number of simultaneously active release flags small. Flag sprawl is the trunk-based equivalent of merge-hell — you traded one complexity for another.

A minimal flag definition, the kind of thing that belongs in version control next to the code:

```typescript
// flags.ts — release flags live with the code, with metadata
export const flags = {
  'checkout-v2': {
    owner: 'payments-team',
    created: '2026-08-12',
    expires: '2026-11-01',   // kill date: remove flag or extend deliberately
    kind: 'release',
    default: false,          // fail closed
    targeting: { percentage: 10, cohorts: ['beta'] },
  },
  'maintenance-mode': {
    owner: 'platform-team',
    kind: 'operational',     // permanent by design
    default: false,
  },
} as const;
```

## The honest comparison

| Dimension | Trunk-based | Long-lived feature branches |
|---|---|---|
| Integration risk | Low, continuous | High, concentrated at merge |
| CI requirements | Demanding (fast, reliable) | Tolerant (can be slow/flaky) |
| Release control | Feature flags | Branch selection |
| Revert granularity | Small, safe | Large, scary |
| Works with incomplete features | Yes, behind flags | Yes, on the branch |
| Team coordination cost | Low (everyone on same code) | High (who has what, when does it land) |
| Flag discipline required | High | Low |
| Suits | Teams with strong CI, deployable services | Regulated flows, huge refactors, weak CI |

The honest read: trunk-based development is the better default for most product teams, *conditional on the CI discipline*. It is not morally superior. A team with a 45-minute flaky pipeline that adopts trunk-based development because a conference talk said to will have a worse time than they had with branches. Fix the pipeline first; the branching model follows.

## When trunk-based hurts (and what to do instead)

There are legitimate situations where strict trunk-based development is the wrong call:

**1. You cannot flag it.** Some changes resist feature flags: database migrations with destructive DDL, protocol changes, large-scale data backfills, changes to shared libraries consumed by pinned versions. For these, the answer is not "give up on trunk" — it is patterns that make trunk safe: expand-contract migrations (add the new column, dual-write, migrate, drop the old), backward-compatible protocol changes, backfills as idempotent jobs. But when a change genuinely cannot be made incremental — a big-bang vendor migration, say — a short-lived release branch cut from trunk at the last responsible moment is the pragmatic answer. Trunk stays the source of truth; the branch exists only to stabilize the cut.

**2. Regulated or audited release trains.** Some environments require a named, frozen artifact to go through a formal approval process. The pattern: trunk stays trunk, and you cut a release branch for the approval window, cherry-picking only fixes onto it. The branch is a stabilization artifact, not a development line. It dies after release. If your release branches live for months, you have re-invented the long-lived branch problem.

**3. Massive, coordinated refactors.** Renaming a core abstraction touched by 40 services is miserable as 200 daily trunk commits — every intermediate state must compile and pass. Sometimes a focused integration branch, worked on by a small team for a week or two with daily merges *from* trunk into the branch, is more honest. The key discipline: merge trunk into the branch daily (never let it diverge), keep it under two weeks, and have a named owner responsible for landing it.

**4. Your CI cannot support it yet.** This is the most common real-world blocker and the most legitimate. If builds are slow and flaky, mandating trunk-based development is mandating main-branch breakage. The sequencing matters: invest in CI speed and reliability first (parallelize, cache, quarantine flakes, split fast/slow suites), then switch the branching model. The CI investment pays off regardless.

## The cultural prerequisites

The tooling is the easy part. Trunk-based development fails on culture more often than on technology:

- **Collective code ownership, actually practiced.** When everyone commits to trunk, everyone can break everyone else's work. This requires a genuine norm that the codebase is shared — anyone can fix, anyone can revert, and "that's not my code" is not an acceptable sentence. Without this, trunk becomes a tragedy of the commons.
- **Psychological safety around reverts.** If reverting someone's commit is treated as an insult, people will avoid reverting and instead stack fixes on top of broken code — exactly the behavior that makes trunk dangerous. Reverts must be boring, blameless, and routine. "Reverted your commit, main was red, let's pair on it" should be the most normal sentence in the team's vocabulary.
- **Comfort with incomplete work being visible.** Junior engineers especially can find it exposing to merge half-finished work behind a flag. The team has to genuinely treat in-progress commits as normal, and code review has to adapt: reviewing incremental slices requires reviewers to hold the larger design in their heads, often from a design doc rather than from the diff.
- **Discipline over heroics.** Trunk-based development rewards boring reliability: small commits, green builds, flag hygiene, fast reverts. Teams that celebrate heroic all-night merge sessions will struggle, because the model eliminates the conditions that produce heroes. That is a feature, but it requires the reward system to catch up — recognize the engineer who kept main green all quarter, not just the one who shipped the big feature.

## Anti-patterns

- **Trunk in name only.** Short-lived branches that still live for two weeks and merge in a big bang. If your average branch lifetime is measured in weeks, you have long-lived branches with better marketing.
- **Flag-and-forget.** Merging flagged code and never cleaning up. Six months later the codebase is a maze of dead flags and nobody knows what the default behavior is. The monthly flag review is not optional.
- **The red-main shrug.** Normalizing a broken trunk. Every hour main is red, every other developer is either blocked or building on a broken foundation. Stop the line, fix or revert, then resume. No exceptions for "it's just a flaky test" — especially not for that.
- **Giant "small" commits.** Merging 3,000 lines to trunk and calling it trunk-based because it went to main. The model only works if changes are small enough to review and revert. Enforce it in review culture, not with a line-count rule (which people will game), but with the question: "could we revert this safely if it breaks?"
- **Skipping the design doc because "we iterate on trunk."** Fast integration does not replace upfront design for genuinely complex changes. Trunk-based development makes *delivery* incremental; the *thinking* still needs to happen before the first commit.

## How to start / what good looks like

Migrating a team from long-lived branches to trunk-based development:

1. **Fix CI first.** Get the fast suite under 10 minutes. Quarantine or fix the top flaky tests. If you do nothing else, this step alone improves life under any branching model.
2. **Introduce the flag system.** Stand up flag infrastructure (there are good managed options, or a simple config-backed evaluator to start) and migrate one in-flight feature to flag-gated trunk commits. Prove the pattern on something real but low-risk.
3. **Set the branch-lifetime rule.** Branches live a maximum of two days, then they merge or die. Enforce it socially at first — a daily standup question: "anyone holding a branch older than two days?" Make the rule visible before making it strict.
4. **Establish the revert norm.** The first time main goes red, the whole team watches how it is handled. Make it exemplary: fast revert, blameless note, pair on the fix. This moment sets the culture more than any document.
5. **Shrink review scope.** Move the team to reviewing small diffs quickly (same-day review SLA) rather than large diffs eventually. Review latency is the silent killer of trunk-based flow — a developer waiting two days for review will batch the next change.

What good looks like, six months in: developers commit to main multiple times a day without thinking about it. Main is green essentially always. Releases are flag flips and progressive rollouts, not merge events. The flag inventory is reviewed monthly and stays small. Reverts happen weekly and nobody remarks on them. And when someone proposes a two-week feature branch, the team's reaction is not a policy citation — it is genuine confusion about why anyone would want that.

---

*More platform engineering notes at https://doshidhruv.com — including CI/CD design, progressive delivery, and developer productivity.*
