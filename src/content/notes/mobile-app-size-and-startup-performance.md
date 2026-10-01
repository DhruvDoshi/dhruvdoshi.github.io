---
title: "Mobile app size and startup performance"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Mobile
categories: [Mobile, Performance, Optimization]
---

Your app gets judged twice before it does anything useful: once on the store page, where the download size sits next to the install button, and once at launch, where the user stares at a splash screen deciding whether to wait or leave. Both judgments happen in seconds, both are largely made up before your product code runs, and both are things backend-minded teams chronically underinvest in because the work is unglamorous and the wins are measured in hundreds of milliseconds.

Here is the uncomfortable truth: startup performance and app size are the same problem wearing two hats. Everything you ship — every SDK, every asset, every line of initialization — costs you twice: once in megabytes on the store page, once in milliseconds at launch. Treat them as one budget and you will make better decisions than teams that optimize each in isolation.

## The real problem: two clocks you don't control

The first clock starts on the store listing. The size number next to your install button is doing quiet work: on a phone with little free storage, a heavy download is not a download, it is a decision to delete something else first. Both major platforms gate large downloads behind Wi-Fi or an explicit user confirmation once you cross the cellular download threshold (on the order of a couple hundred megabytes), which means a bloated app silently loses every user who discovers it on a commute. And size compounds: every update re-pays the cost, delta updates blunt but do not eliminate it, and users on older or cheaper devices — the majority of the global market — feel every megabyte of storage pressure that a flagship-carrying team never notices.

The second clock starts when the user taps your icon. A cold start — process not alive, nothing cached in memory — walks through process creation, runtime setup, library loading, your initialization code, and first-frame render before the user sees anything they can interact with. The operating system enforces a hard launch deadline: take too long and the watchdog kills your launch outright, which the user experiences as a crash on first open. That is the worst possible first impression, and it is entirely preventable.

The trade-off that defines this whole area: everything that makes the app richer — SDKs for analytics, crash reporting, feature flags, attribution; high-resolution assets; preloaded data — makes both clocks worse. The job is not to say no to all of it. The job is to decide what earns its place on the critical path and what can wait, and to build the machinery that enforces that decision as the app grows.

## Measure startup honestly before touching anything

You cannot improve what you measure badly, and most teams measure startup badly in at least three ways.

First, define the phases precisely, because "startup time" without a definition is a vanity number:

- **Cold start**: the process is not alive. First launch after install, after a reboot, or after the OS reclaimed your process. Slowest, and the one that matters most.
- **Warm start**: the process is alive but the visible screen must be recreated. Faster, and common when returning to the app.
- **Hot start**: the screen is already in memory. Nearly instant. If your dashboard leads with hot-start numbers, it is lying to you.

Second, distinguish **time to initial display** (something is drawn) from **time to full display** (the screen is usable: data loaded, no spinners). Teams love reporting the first; users experience the second. Both platforms give you APIs to mark these moments in telemetry — report the framework's draw callback for initial display, and fire an explicit marker when the screen is genuinely interactive for full display. If those two numbers are far apart, your problem is data loading, not rendering, and no amount of UI optimization will fix it.

Third, measure on devices that resemble your users, not your desk. Startup on a current flagship tells you almost nothing: the pain lives on three-year-old mid-range hardware, where slower storage, less RAM, and thermal throttling multiply every inefficiency. Keep a small reference fleet — an old low-end device, a mid-range device, a flagship — and report p50, p90, and p99 from real field telemetry, not from the lab. Lab numbers are best-case by construction: warm device, fast network, nothing else running. Field data is where the uninstalls live.

A practical starting point: add startup markers to your existing telemetry pipeline (you already have one for crashes and analytics — reuse it), tag every launch with cold/warm/hot, and build a dashboard showing p90 cold-start time to full display on your reference low-end device. Until that dashboard exists, every optimization conversation is vibes.

## Deferred initialization: the highest-leverage pattern

Almost every slow startup has the same shape: a long, flat list of initialization calls executed eagerly and sequentially in the app's entry point, most of which are not needed to draw the first frame. Analytics, crash reporting, feature flags, push registration, database migrations, prefetching — all fired at once, all blocking, many waiting on the network with no timeout.

The fix is to treat startup as a scheduled dependency graph, not a script:

1. **Classify every init into a phase.** `interactive` means the first frame cannot be drawn without it: restoring the session, loading cached config. `deferred` means it can run after first draw: analytics init, prefetching, non-critical SDK setup. `on-demand` means it should not run at startup at all — initialize it when the feature that needs it is first used.
2. **Parallelize what is independent.** Most inits do not depend on each other; running them sequentially is pure waste. Run the interactive set concurrently.
3. **Race every network-dependent init against a timeout, and fail open.** A remote-config fetch must never hold the UI hostage. If it times out, draw with last-known-good defaults and apply the fresh config when it arrives.

```ts
// A startup sequencer: only what the first screen needs blocks first draw.
type Phase = "interactive" | "deferred" | "on-demand";

type StartupTask = {
  name: string;
  run: () => Promise<void>;
  phase: Phase;
  timeoutMs: number;
};

const startupTasks: StartupTask[] = [
  { name: "session-restore", run: restoreSession,  phase: "interactive", timeoutMs: 2000 },
  { name: "cached-config",   run: loadCachedConfig, phase: "interactive", timeoutMs: 1000 },
  { name: "analytics",       run: initAnalytics,    phase: "deferred",    timeoutMs: 5000 },
  { name: "prefetch-feed",   run: prefetchHomeFeed, phase: "deferred",    timeoutMs: 8000 },
  // Anything "on-demand" never appears here at all.
];

async function runStartup(drawFirstFrame: () => void) {
  const critical = startupTasks.filter(t => t.phase === "interactive");
  // A slow dependency must not hold the UI hostage: race each against its timeout.
  await Promise.all(critical.map(t => withTimeout(t.run(), t.timeoutMs, t.name)));
  drawFirstFrame();
  // Deferred work runs after the user sees something. Failures are logged, not fatal.
  for (const t of startupTasks.filter(t => t.phase === "deferred")) {
    void withTimeout(t.run(), t.timeoutMs, t.name).catch(err => logStartupError(t.name, err));
  }
}
```

The trade-off to be honest about: deferred initialization moves work, it does not delete it. Push too much past first draw and you trade a fast first frame for jank and spinners thirty seconds later, when the user actually touches the features you deferred. The discipline is to defer by *necessity for first frame*, not by "make the number go down," and to watch time-to-interactive, not just time-to-first-frame.

Where the time actually goes in a typical unoptimized cold start:

```
cold start timeline (time →)

[process spawn][runtime init][  app entry: init storm  ][first frame][ usable ]
      ▲               ▲                    ▲                   ▲           ▲
      │               │                    │                   │           │
   OS forks,     load native          dozens of SDK       draw with    deferred
   maps code     libraries,           inits, sequential,  cached       tasks finish,
                 verify code          several hitting     data         live data lands
                                      network w/o timeout
                 ── mostly fixed ──   ── your leverage ──
```

The left two blocks are largely platform-determined. The init storm is where your team lives or dies.

## Asset and dependency discipline

Every third-party SDK you add costs three things: binary size, initialization time, and risk surface. The size is visible; the init time hides in your startup trace; the risk surface shows up the day the vendor's SDK starts crashing on a specific OS version and you cannot ship a fix without them. Audit ruthlessly:

- **Trace what each dependency costs at startup.** If an SDK's init is synchronous and expensive, wrap it, defer it, or replace it. Analytics and attribution SDKs are the classic offenders — they are almost never needed before first draw.
- **Ship fewer pixels.** Prefer vector assets where the platform renders them cheaply, serve raster images at the densities you actually support, and question every bundled asset: could it be downloaded on demand when the feature is first used instead of inflating every install? On-demand assets trade install size for runtime complexity and a new failure mode (the fetch fails on a bad network), so reserve this for genuinely heavy, infrequently used content — tutorial videos, optional content packs, large on-device models.
- **Turn on every shrinker the platform gives you.** Release builds should strip dead code, minify, and drop unused resources. This is a build-configuration checkbox that teams somehow leave unchecked for years. Check it this week.
- **Split the binary.** Both platforms support delivering feature modules on demand rather than in the base install. The base app should be the smallest thing that delivers your core loop; everything else is a candidate for on-demand delivery.

The decision framework for each dependency and asset: ask *when the user first needs it* and *what breaks if it is absent*. If the answers are "the third session" and "nothing," it does not belong in the install or the startup path.

## The download-size conversion cliff

Size does not degrade conversion linearly; it falls off a cliff at specific thresholds. Cross the cellular-download limit and you lose the impulse install. Approach the storage limits of low-end devices and the OS itself starts warning the user, or quietly deprioritizes your updates. Large updates are arguably worse than large installs: the user already has your app, and a heavy update on a nearly-full phone is the moment they discover how little they need you.

Delta updates — where the store ships only what changed — blunt this, but they do not fix a bloated base: the base still downloads once, and deltas are computed against it. The teams that win here treat size like a budget with a named owner: a size gate in CI that fails the build when the release artifact grows past the agreed ceiling, and a regular review of what grew and why. Without the gate, size grows monotonically. Nobody ever makes an app smaller by accident.

There is also a compounding interaction with startup: the same SDK bloat that inflates your binary usually inflates your init storm. Cutting a dependency often buys you megabytes *and* milliseconds in one change, which is why the combined budget framing from the top of this note matters. When you evaluate a new SDK, price it in both currencies.

## Platform-specific levers worth knowing

The principles are shared, but the sharp edges differ per platform:

- **On iOS**, dynamic frameworks are the classic startup tax: each one adds loader work before your code runs, so prefer static linking unless you have a real reason (such as sharing code with an extension). Keep the number of dynamic libraries low, avoid eager hooks that execute before your entry point, and use the platform's prewarming support so the OS can prepare your app before the user taps.
- **On Android**, the layout of your code matters: the platform supports startup profiles that record which code paths run at launch so the runtime can pre-compile exactly those paths at install time — one of the highest-ROI optimizations available, and mostly a configuration task. Keep heavy work out of the application entry point, and prefer lazy initialization for components the first screen does not need.

Neither platform rewards cleverness here; both reward boring discipline: fewer libraries, less eager work, measured on old devices. If a "startup optimization" cannot be explained in one sentence and measured on your reference low-end device, it is probably folklore.

## Anti-patterns: how teams lose this game

- **The branded splash screen that waits.** A splash that blocks on initialization is a loading screen wearing marketing. Draw your real UI as fast as possible; if you must show branding, show it *while* the first frame loads, never *instead of* it.
- **Synchronous SDK init in the app entry point.** The five-line integration snippet in the vendor's README is written to minimize their support tickets, not your startup time. Wrap it, defer it, time-box it.
- **Measuring on emulators and flagships.** Emulators have your workstation's CPU; flagships have thermal headroom your users do not. Both flatter every number that matters.
- **Optimizing warm starts.** Warm starts are already fast and already dominate your own testing. The uninstalls come from cold starts.
- **"We'll optimize later."** Startup debt compounds like all debt: every new SDK and feature lands in the eager path by default, and the init storm only grows. The fix is structural — the sequencer pattern above — not a one-time cleanup.

## What good looks like

A team that has this under control has four things:

1. **A startup dashboard** showing p50/p90/p99 cold-start time to full display, segmented by device tier, from field telemetry. Reviewed regularly, owned by someone named.
2. **Two budgets enforced in CI**: a startup-time budget on the reference low-end device (fail the build on regression past an agreed threshold) and a download-size budget on the release artifact. Budgets without enforcement are wishes.
3. **A phased startup sequencer** where every init declares its phase and timeout, and adding a new blocking init requires justification in code review.
4. **A recurring dependency audit**: for each SDK, what it costs in size and startup time, and whether it still earns it.

How to start this week: instrument the markers, ship the dashboard, and find your single biggest startup offender — it is usually one synchronous network call or one heavy SDK sitting in the entry point. Fix that one thing, watch the p90 move, and you will have the credibility to ask for the structural work. Startup performance is won in that order: measure, cut the worst offender, then systematize so it never grows back.
