---
title: "Battery-aware mobile design"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Mobile
categories: [Mobile, Performance, Systems]
---

Energy is the only resource your app consumes that the user feels in their body: a warm phone in the pocket, a dead battery at 4 PM, the low-power-mode scramble before a night out. Users do not file bug reports about your wake-up patterns. They uninstall, leave a one-star review that says "drains battery," and never think about you again. Battery blame is sticky, often technically wrong about the cause, and completely indifferent to being wrong — perception is the metric here, and the only winning move is to genuinely earn a clean bill.

The deeper point: the operating system is not a neutral platform for your background work. It is an adversary with hard power management — doze modes, background execution limits, app-standby buckets — and it always wins. Teams that design *with* the OS get cheap, batched, reliable background work. Teams that fight it with hacks get throttled, flagged, and eventually killed mid-task. This note is about designing for the first outcome.

## The real problem: a shared, finite resource with an armed landlord

Your app is one tenant among dozens on the device, all drawing from one battery the user cannot swap. The OS manages this commons aggressively: it defers your background work, coalesces your timers with other apps', restricts your location access, and puts your app to sleep when the user ignores it. These are not suggestions. On both major platforms, background execution is a privilege granted in narrow, declared windows — and the exact timing the OS gives you is deliberately inexact, because exact timing for every app would keep the device awake forever.

This creates the central tension of mobile systems design: product wants freshness (latest data, timely notifications, live location), and the OS wants stillness. Every background feature you ship sits somewhere on that spectrum, and the naive position — "poll every minute, just in case" — is the most expensive one. The art is in finding, for each feature, the *laziest correct design*: the minimum energy that still delivers the user-visible promise.

One more framing that helps: energy cost on mobile is dominated not by how much work you do, but by how often you wake the device up to do it. A hundred tiny wake-ups cost far more than one batched burst of the same total work, because each wake-up drags the CPU out of deep sleep and — critically — powers up the radio, which then lingers. Internalize that sentence and half of this note follows from it.

## How energy actually gets spent

Four consumers matter, in rough order of how much trouble they cause application developers:

**The cellular radio and its tail.** This is the single most important energy concept on mobile, so slow down here. When your app performs a network transfer, the cellular radio powers up to a high-energy state. When the transfer finishes, the radio does *not* power down immediately — it lingers in that high state for seconds (the "tail") in case more data is coming, because powering up again is itself expensive. A 200-millisecond request can trigger 10–20 seconds of high-power radio time. Ten small requests spaced a minute apart do not cost ten transfers; they cost ten full tails. Wi-Fi has a much shorter tail, which is one reason "works fine on Wi-Fi, drains on cellular" is such a common complaint pattern.

```
energy cost of one small network request (cellular)

power ▲
      │    ┌──┐
      │    │Tx│░░░░░░░░░░░░░░░░░░░  ← tail: radio stays hot
      │    │  │░░░░░░░░░░░░░░░░░░░     long after a tiny transfer
      │────┘  └───────────────────┐
      │                           └──────────────→ time
      └────┬──┘
       transfer (~200ms) is dwarfed by the tail it triggers
```

The implication: the unit of energy cost is not the byte, it is the *wake-up*. Batching ten requests into one does not save 90% of the transfer energy — it saves roughly 90% of the *total* energy, because you pay one tail instead of ten.

**CPU wake-ups.** Same principle. The cost of waking the application processor from deep sleep dwarfs the cost of the instructions you run once awake. Timers, alarms, and push-triggered handlers that fire frequently are the usual culprits. Coalescing five jobs into one wake-up is nearly free relative to five separate wake-ups.

**Sensors, especially GPS.** Location is the hungriest sensor by a wide margin: a GPS fix keeps the radio and processor active continuously. The accelerometer and step counters are cheap by comparison. The rule is simple — request the coarsest accuracy that satisfies the feature, and stop updates the instant the feature is done. The most common location bug in production is not wrong accuracy; it is starting updates and never stopping them.

**The screen.** Mostly user-controlled and mostly not your problem — except when you abuse keep-screen-on during long operations. Do not.

## Background work budgets: design around the OS

Both platforms give you a deal: declare your background work through the official deferrable-task APIs, state its constraints (requires charging, requires Wi-Fi, requires idle), and the OS will run it — batched together with other apps' work, at a moment that minimizes wake-ups. What you give up is exact timing. Your sync will run "sometime in the next few hours while charging," not "at 2:00 AM sharp."

Take the deal. The trade-off is overwhelmingly in your favor:

- **You get OS cooperation instead of OS hostility.** Work scheduled through official APIs survives doze modes and battery optimizations. Work scheduled through hacks (tight alarms, foreground-service abuse, wake locks held open) gets throttled harder with every OS release, because the platform vendors are in an arms race against exactly those hacks.
- **You get batching for free.** The OS coalesces your deferred work with other apps' deferred work into shared wake-ups. Your 3 AM sync rides along with a dozen others on one radio tail.
- **You lose precise scheduling.** If your feature genuinely needs to-the-minute background timing, question the feature — the OS will not honor it reliably anyway, and the workarounds will cost you more in user trust than the feature is worth. The honest exceptions are narrow: alarms the user explicitly set, navigation actively in progress, a workout being recorded. Everything else can be inexact.

Practical rules: never hold a wake lock across a network operation you do not control (a slow server then owns your battery budget); always declare the tightest constraints the work tolerates (if it can wait for Wi-Fi, say so — the OS rewards honesty with better scheduling); and treat "run while the app is in the background" as a permission you must continuously re-earn, not a right.

## Batching and coalescing: the master pattern

Nearly every energy optimization on mobile is batching in disguise. The pattern has three moves:

1. **Batch outbound network.** Analytics events, log uploads, sync deltas — collect them and flush on size *or* time thresholds, never per event. A per-event flush is a radio tail per event.
2. **Piggyback on existing wake-ups.** If the user just opened the app and the radio is already hot, that is the cheapest possible moment to sync, prefetch, and flush queues. Design your schedulers to notice "the device is already awake and on network" and do opportunistic work then.
3. **Coalesce timers.** Five components each with their own 15-minute timer produce up to five wake-ups per cycle. One scheduler that runs all five jobs in a single wake-up produces one.

```ts
// Batch outbound events: one radio wake-up instead of dozens.
class EventBatcher {
  private queue: AnalyticsEvent[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;

  track(event: AnalyticsEvent) {
    this.queue.push(event);
    // Flush on size OR elapsed time, whichever comes first — never per event.
    if (this.queue.length >= 50) return void this.flush();
    this.timer ??= setTimeout(() => void this.flush(), 30_000);
  }

  private async flush() {
    const batch = this.queue.splice(0);
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    if (batch.length === 0) return;
    try {
      await sendBatch(batch);
    } catch (err) {
      // Requeue with backoff — a failing endpoint must not spin the radio.
      this.queue.unshift(...batch);
      scheduleRetryWithBackoff(err);
    }
  }
}
```

Note the failure path: a naive batcher that retries immediately on failure becomes a retry storm — the radio held hot indefinitely against a dead endpoint. Every background network operation needs exponential backoff with jitter and a circuit breaker. This is not optional polish; against a real outage, it is the difference between "app uses more battery today" and "phone is dead by noon."

## Push vs poll: the decision framework

This is the highest-stakes energy decision most teams make, and most teams make it by default rather than by decision — someone writes a 60-second polling loop "to keep data fresh" and it ships.

**Polling** is simple, predictable, and stateless on the server. It is also the classic battery killer: every poll wakes the CPU and radio and pays a full tail, usually for a response that says "nothing changed." Its cost scales with frequency × user count, which is the worst possible scaling shape.

**Push** (server-initiated messages through the platform push services) has near-zero idle cost: the device maintains one shared, OS-managed connection, and your app wakes only when there is actually something to deliver. The costs are elsewhere: server complexity to track what changed for whom, delivery that is best-effort rather than real-time (the OS may delay or coalesce pushes for a backgrounded app), and harder debugging.

The decision framework:

- **Poll only when** the data changes on a schedule you control, staleness tolerance is measured in hours, and the user count is small. Configuration refreshes and daily content digests are fine.
- **Push when** freshness matters to the user (messages, alerts, collaboration) or the audience is large. At scale, polling is not just expensive per device — it is a self-inflicted DDoS on your own API.
- **Prefer the hybrid: push-to-invalidate, then fetch.** The server sends a tiny push saying "something changed"; the app then performs a normal fetch. You get push's near-zero idle cost with polling's simple request/response debugging. For most apps, this is the right default.

And whatever you choose, make the interval adaptive: back off aggressively when the app is backgrounded, when the battery is low, or when successive polls return no changes. A polling loop that never adapts is a confession that nobody thought about it.

## Location strategies: accuracy is a budget

Location deserves its own section because it is where good intentions go to die — "we might need precise location later" becomes a permanent high-accuracy background subscription.

Match the accuracy tier to the use case, and re-evaluate per feature:

- **City-level / coarse**: local content, weather, regional defaults. Cheap, and on modern platforms it does not even require the precise-location permission, which users grant far more readily.
- **Fine, foreground-only**: navigation, ride pickup, "nearby" search — while the feature is actively in use. Request it when the feature starts, release it when the feature ends.
- **Fine, background**: almost never. Reserve for features where background tracking *is* the product: active navigation, workout recording. If your product manager asks for it "for analytics," that is a no with a clear conscience.

Prefer event-driven location over continuous tracking: geofences ("notify me when the user enters this region") and significant-change updates cost a fraction of continuous fixes because the OS can use low-power signals and wake you only on transitions. And the iron rule: **stop location updates the moment the feature completes**. Audit this in code review like you audit auth — a leaked location subscription is a battery bug with a permission dialog attached.

## Measuring energy impact without guessing

Energy work without measurement is superstition. The good news: both platforms ship energy profiling tools (the iOS energy gauge in Instruments and MetricKit reports; Android's battery stats and historian-style tooling). The method:

1. **Profile a scripted scenario**, not freeform use. Define a realistic 15–30 minute session: launch, browse, background the app, receive a push, foreground again. Run it identically against baseline and candidate builds on the same device, same OS version, same network.
2. **Compare wake-ups and radio time, not just milliamp-hours.** The profiler will show you wake-up counts, GPS time, and network activity. The optimization target is almost always "fewer wake-ups," and the profiler tells you exactly which component is waking the device.
3. **Treat field data as monitoring, not decision-making.** OS-provided per-app battery attribution is coarse and confounded (it blames the app that happened to be in the foreground). Use it to detect regressions and to triage user complaints, but make optimization decisions from controlled profiles.

One honest caveat: user-reported battery complaints are signal, not diagnosis. "Your app drained 20% overnight" usually means the app held a wake lock or retried against a dead endpoint — both discoverable in a profile in minutes. Take every such report seriously enough to profile, and you will fix most of them the same day.

## Anti-patterns: the battery hall of shame

- **Polling on a fixed timer** for data that rarely changes. The canonical battery bug. Push-to-invalidate exists for exactly this.
- **Retry storms.** No backoff, no jitter, no circuit breaker — a failing endpoint keeps the radio hot until the battery gives out. Every network call in background code needs a backoff policy; review it like error handling, because it is error handling.
- **Wake locks and background modes held longer than the task.** Acquire late, release early, and never hold one across unbounded network I/O.
- **Flushing analytics per event.** Each flush is a radio tail. Batch, always.
- **Full-accuracy location "just in case."** Coarse until proven otherwise; continuous only while the feature is live.
- **Fighting the OS.** Exact alarms where inexact would do, abusing foreground services to stay alive, requesting background modes your feature does not use. The platform vendors close these loopholes every release, and each closure breaks your app in a new and exciting way. The OS always wins the arms race — stop enlisting.

## What good looks like

A battery-respecting app has five properties:

1. **All background work goes through the platform's deferrable-task APIs** with declared constraints. No bespoke alarm infrastructure, no wake-lock heroics.
2. **Network is batched by default.** Events, logs, and sync deltas flush on size/time thresholds; fetches piggyback on user-initiated sessions.
3. **Freshness is push-driven.** Polling exists only where staleness tolerance is high and scale is small; everything else is push-to-invalidate.
4. **Location is off by default**, coarse unless the feature demands fine, and always released when the feature ends.
5. **Energy is profiled like performance.** A scripted energy scenario runs against release candidates, wake-up counts are tracked over time, and regressions get the same urgency as crashes.

How to start this week: profile one realistic session on a real device and sort by wake-up count. The top offender is usually analytics flushing, a polling loop, or a leaked location subscription — all fixable in a day. Fix it, re-profile, and watch the single biggest bar on the chart collapse. Then make batching the default in code review, so the next feature starts efficient instead of getting optimized later. Battery discipline, like all discipline, is cheaper as prevention than as cure.
