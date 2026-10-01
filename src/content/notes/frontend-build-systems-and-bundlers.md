---
title: "Frontend build systems and bundlers"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Frontend architecture
categories: [Frontend, Build Systems, Performance]
---

Nobody chooses a build system because they love build systems. They choose one because the current one is slow, and then they discover that build tooling is a bundle of trade-offs wearing a trench coat. Dev speed versus production output quality. Simplicity versus control. The tool that makes your Tuesday pleasant versus the tool that makes your bundle small. There is no universally right answer, but there are honest ways to evaluate the options and dishonest ones, and most teams pick dishonestly: by hype, by what the last hire knew, or by optimizing the metric that was annoying them that week.

## The real problem

Build tooling sits at the intersection of two different jobs that want different things:

- **Development serving**: start fast, update fast on file change, give useful errors. The developer's inner loop. Measured in seconds and in frustration.
- **Production bundling**: small output, correct code splitting, long-term caching, dead code elimination. The user's experience. Measured in kilobytes and Core Web Vitals.

These jobs have different optimal tools. A dev server wants to do as little work as possible per file change — transform only what changed, serve native modules to the browser, skip bundling entirely. A production build wants to do global work — analyze the whole module graph, tree-shake across boundaries, split chunks for optimal caching.

The mistake is assuming one tool must be best at both, or that the tool that is fastest in dev will produce the best production output. Evaluate them separately. A team that picks its production bundler based on dev-server benchmarks is optimizing the wrong job, and a team that tolerates a 90-second dev startup because "the bundles are great" is taxing every developer, every day, in the most expensive way possible: attention.

## Decision framework: choosing build tooling honestly

Score candidates on these axes separately. Do not let one great axis compensate for a terrible one without saying so out loud.

1. **Cold start time.** How long from `dev` to interactive page. This is the number developers feel every morning and after every branch switch.
2. **Hot update latency.** Time from file save to visible change. Above ~500ms, developers context-switch; above 2s, they start batching saves, which is a workflow tax.
3. **Production output quality.** Bundle size, tree-shaking effectiveness, code-splitting control, asset optimization. Measure on your app, not on a benchmark todo-list.
4. **Ecosystem compatibility.** Plugins, framework integration, and — critically — how it handles your existing code. A tool that chokes on your legacy CommonJS dependency or your CSS setup is not fast; it is broken for you.
5. **Debuggability.** When the build does something wrong, can a human figure out why? Opaque bundlers produce opaque bugs. Sourcemaps that lie, chunks that appear from nowhere, and errors that reference internal plugin state are a real cost.
6. **Team familiarity and bus factor.** The build system is infrastructure. If one person understands it, you have a single point of failure on the tool every developer touches daily.

Weight these by your reality. A team of three shipping a marketing site should weight simplicity and familiarity above output quality. A team of forty shipping a product where every kilobyte costs conversion should weight production output heavily and invest in build expertise. There is no shame in either; there is shame in pretending the trade-off does not exist.

## Dev speed vs. production output: the actual trade-off

The modern landscape splits roughly into two philosophies:

**Unbundled dev (native ESM serving).** The dev server transforms files individually and lets the browser resolve imports natively. Cold starts are fast because there is no bundle step; hot updates are fast because only the changed file is re-transformed. The trade-off: dev behavior diverges from production behavior. Module resolution, circular imports, and bare-specifier handling can all behave differently in dev versus the bundled production output, and the bugs that come from that divergence are nasty — they only exist in one environment.

**Bundled dev.** The dev server bundles (usually with aggressive caching and in-memory builds). Slower cold start, but dev and production share the same module graph semantics. Fewer "works in dev, breaks in prod" mysteries.

Neither is strictly better. If your team is large and your module graph is complex, the consistency of bundled dev may be worth the slower start. If your team values iteration speed above all and your app is well-behaved ESM, unbundled dev is a genuine productivity win. The honest move: measure both on your codebase. Vendor benchmarks are marketing; your `node_modules` is reality.

One more consideration that teams underweight: **TypeScript handling.** Most fast dev servers strip types without type-checking (transpile-only), which means type errors surface in CI or the editor, not in the dev build. That is usually the right trade-off — type-checking on every save is slow — but it means your editor's TypeScript integration and your CI type-check step are load-bearing. If either is flaky, transpile-only dev will let type errors through to places they should not reach.

## Code splitting strategy

Code splitting is where build configuration meets product architecture, and it is the highest-leverage production optimization most teams under-invest in.

The levels, in order of increasing sophistication:

**Route-level splitting.** Each route is its own chunk, loaded on navigation. This is the baseline every app should have. It is nearly free — most frameworks do it by default — and it converts "download the whole app" into "download the current page." If you do nothing else, do this.

**Component-level splitting for heavy islands.** The rich text editor, the chart library, the PDF viewer, the 3D visualization: components that are large and rarely used should be split out and loaded on interaction, not on page load. The pattern:

```typescript
// Loaded only when the user actually opens the editor
const RichTextEditor = lazy(() => import('./RichTextEditor'));

function CommentBox() {
  const [editing, setEditing] = useState(false);
  return editing
    ? <Suspense fallback={<EditorSkeleton />}><RichTextEditor /></Suspense>
    : <button onClick={() => setEditing(true)}>Write a comment</button>;
}
```

The rule: **split at the point of user intent, not at the point of code organization.** The chunk boundary should correspond to "the user asked for this," because that is when the loading state is acceptable.

**Vendor splitting.** Separating third-party dependencies into their own chunk(s) so app code changes do not invalidate the cached vendor bundle. This used to be manual configuration; modern bundlers do a reasonable job automatically. The thing to watch: a single giant vendor chunk that changes every time any dependency updates. If your dependency churn is high, consider splitting vendors by stability — framework code (rarely changes) separate from utility libraries (change more often). But do not over-engineer this; HTTP/2 and good caching headers have made the marginal gains smaller than they were five years ago.

**What to avoid:**

- **Splitting too granularly.** Hundreds of tiny chunks mean hundreds of HTTP requests and a waterfall of doom on slow networks. There is a floor to useful chunk size; below it, the request overhead exceeds the savings.
- **Prefetching everything.** Prefetching the next likely route is good. Prefetching every route on load is just downloading the whole app with extra steps.
- **Splitting without measuring.** Every split point should be justified by a bundle analysis: this chunk is X KB, it is loaded on Y interaction, it saves Z KB from the initial load. Splits that do not move the initial-load number are theater.

### Bundle analysis as a habit

Run a bundle analyzer in CI and track the numbers over time. Not as a gate that blocks every PR — that breeds resentment and gaming — but as a visible trend. When the initial bundle grows 200 KB in a month, the trend line makes the conversation easy: "what did we add?" The most common culprits: a date library imported wholesale instead of per-function, an icon set imported as a barrel, a dependency that pulled in a duplicate of something you already had. A quarterly dependency audit that asks "do we still need this, and are we importing it correctly" pays for itself.

## Module federation trade-offs

Module federation — multiple independently deployed frontends sharing code at runtime — promises independent deploys and shared dependencies. It delivers them, at a cost that teams consistently underestimate.

**When it makes sense:** genuinely independent teams shipping genuinely independent parts of a product, where coordinated deploys have become the bottleneck. The classic case is a platform with plugin-like surfaces owned by different teams, or a post-merger product portfolio that must look unified before the codebases are.

**The costs, honestly:**

- **Runtime coupling replaces build-time coupling.** You removed the monorepo deploy coordination and replaced it with a runtime contract: version compatibility between host and remotes, shared-dependency version negotiation, and failure modes where a remote fails to load in production. The coordination did not disappear; it moved to a harder place to debug.
- **Shared dependencies are a negotiation, not a given.** Two teams on different major versions of the same library is the normal state of a large org. Federation handles this with version ranges and fallbacks, which means sometimes loading two copies of the library — the exact duplication you were trying to avoid.
- **Debugging crosses deployment boundaries.** The stack trace points into code deployed by another team, from a version you cannot see in your repo. Your observability must be federation-aware: which remote version served this module, from which deploy.
- **Local development gets harder.** Running the full federated app locally means running multiple dev servers or mocking remotes. Teams end up developing against stale remote mocks and discovering integration issues in staging.

The decision rule: **do not adopt module federation to solve a code-organization problem.** If the real issue is that the monolith is hard to work in, fix the monolith's boundaries, build times, and ownership first. Federation is for deploy independence between teams that truly cannot coordinate releases — and even then, start with the thinnest possible integration (a shell app loading one remote) and prove the operational model before federating everything.

Alternatives that solve 80% of the use cases with 20% of the cost: a well-structured monorepo with independent deploy pipelines per app, web components for cross-team UI sharing, or plain old iframes for the truly independent surfaces (yes, really — for isolated widgets with no shared state, an iframe's hard boundary is a feature).

## Caching in CI

CI build time is a tax on every PR. The levers:

1. **Dependency install caching.** Cache `node_modules` (or the package manager's store) keyed on the lockfile hash. This is table stakes. If your CI reinstalls dependencies from scratch on every run, fix that before anything else.
2. **Build output caching.** Cache the bundler's cache directory between runs. Most modern bundlers have persistent filesystem caches that make rebuilds dramatically faster when the cache hits. The cache key should include the lockfile hash and the bundler version — stale caches produce the worst kind of CI bug: green builds of wrong code.
3. **Don't build what didn't change.** In a monorepo, only build affected projects. This requires a real dependency graph of your workspace, not a shell script that guesses. The tooling for this exists; the failure mode is teams that hand-roll it and get the graph wrong.
4. **Separate the jobs.** Type-checking, linting, unit tests, and the production build do not need to run sequentially. Parallelize aggressively. The wall-clock time of CI is what developers feel.
5. **Watch for cache poisoning.** A cache that is too aggressive — keyed too loosely, shared across branches incorrectly — will produce builds that pass CI and fail in production. When a "clean rebuild fixes it," your caching is wrong, and "just clear the cache" is not a strategy.

A useful target: PR CI (lint, type-check, unit tests, build) under 10 minutes. Above that, developers start context-switching while they wait, and the cost is not the minutes — it is the lost focus, multiplied by every PR, every day.

## When the build becomes the bottleneck

Builds become bottlenecks gradually, then suddenly. The warning signs:

- Developers avoid running the full build locally and rely on CI to catch issues. The feedback loop has moved from seconds to minutes.
- The production build takes longer than the test suite. Something is wrong with the build configuration, not with the tests.
- Build-related PRs ("fix the build," "bump the bundler," "work around the plugin") appear regularly. The build system is consuming engineering time instead of serving it.
- New hires take a day to get the dev server running. The build has undocumented requirements.

When you hit this point, the fix is rarely "switch bundlers." It is usually one of: the module graph has grown without splitting strategy, a plugin is doing synchronous work it should not, TypeScript is checking too much too often, or assets are being processed without caching. Profile the build before replacing it. Most bundlers have profiling or timing output; use it. The 80/20 rule applies aggressively to build performance — one or two slow steps usually dominate.

And sometimes the honest answer is architectural: the app has outgrown a single build. That is when you split into multiple apps with clear boundaries (and accept the duplication), or invest in the monorepo tooling that makes multi-project builds incremental. Both are bigger decisions than a bundler swap, and both should be made deliberately, not as an escape from a slow build.

## How to start: what good looks like

If you are evaluating or fixing build tooling:

1. **Measure your current state.** Cold start, hot update latency, production build time, initial bundle size, CI wall-clock time. Write the numbers down. You cannot evaluate a change without a baseline.
2. **Fix CI caching first.** It is the cheapest win and it benefits every developer immediately.
3. **Establish route-level splitting and bundle tracking.** Baseline bundle analysis in CI, trend visible to the team.
4. **Attack the slowest dev-loop pain.** Profile, find the dominant cost, fix that one thing. Repeat quarterly.
5. **Revisit the bundler choice on a schedule, not on hype.** Every 12–18 months, spend a day evaluating whether the current tool still fits. The ecosystem moves fast; your evaluation should be periodic and evidence-based, not reactive.

What good looks like: dev startup in seconds, hot updates that feel instant, a production build whose output you understand chunk by chunk, CI under 10 minutes, and a bundle-size trend that the team watches the way it watches uptime. The build system is invisible when it works — and that invisibility is the goal. Every hour a developer spends thinking about the build is an hour the build system failed at its one job: getting out of the way.
