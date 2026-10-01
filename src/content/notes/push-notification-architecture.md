---
title: "Push notification architecture at real scale"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Mobile
categories: [Mobile, Architecture, Messaging]
---

Push notifications look simple — your server calls a provider API, the phone buzzes — until the second million devices, the first incident where a notification storm wakes a continent, and the product review where marketing asks why their campaign reached 40% of the audience. At scale, push is a distributed messaging system with its own token lifecycle, fan-out architecture, delivery semantics, and failure modes. The provider APIs (APNs for Apple, FCM for Android) are the last hop; everything before them — targeting, rendering, rate limiting, dedup, observability — is yours to build. This note covers that system.

## The last hop: what the providers actually guarantee

**APNs and FCM are best-effort delivery systems.** Internalize this first: neither provider guarantees delivery, ordering, or latency. They accept your message, attempt delivery, and may drop it silently under load, on expired tokens, or when the device is unreachable past their retention window. Your architecture must treat provider acceptance as "accepted for attempt," not "delivered." Any business logic that assumes a push arrived — "we notified them, so the timeout starts" — is built on a falsehood. Critical communications need an in-app fallback (an inbox, a badge count synced on next open) because the push might never arrive.

**Tokens are the addressing layer, and they churn.** Each device gets a provider token identifying your app on that device. Tokens change: app reinstalls, OS upgrades, device restores, provider-initiated refreshes. Your server must treat the token registry as a living dataset — updated on every app launch (the app reports its current token; the server upserts), pruned on provider feedback (invalid-token responses mean delete or disable, promptly, or you pay to send into the void and risk provider throttling).

**Provider feedback loops are mandatory plumbing.** Both providers tell you which tokens are dead and (in various forms) which sends failed and why. Consume these feedback channels continuously and act on them: invalid tokens get deactivated, and repeated failures feed your monitoring. Teams that "send and forget" accumulate dead tokens until a large fraction of their fan-out is wasted — and providers notice senders with high failure rates.

```
  Your systems                          Providers                    Devices
  ┌──────────┐   ┌───────────┐    ┌──────────────┐   ┌────────────┐
  │Event     │──►│Notification│──►│ Fan-out &    │──►│APNs / FCM  │──► phones
  │sources   │   │ service   │    │ token store  │   └────────────┘
  └──────────┘   └───────────┘    └──────────────┘
       trigger     render+target     per-device send,
                   dedupe+throttle   provider feedback
```

## The notification service: your side of the system

**Separate the notification service from product services.** Product code should emit domain events ("order shipped," "message received"); a dedicated notification service decides who gets notified, on which channels, with what content, and when. This separation is what lets you add quiet hours, frequency caps, and channel preferences without touching every product service — and it's what makes notification logic testable and observable as a system rather than scattered side effects.

**Rendering is a template pipeline.** Notification content comes from templates with localization, personalization variables, and per-platform variants (title/body/length limits differ; actions and images have platform-specific payloads). Templates are versioned content with an approval flow — an unreviewed template change is how a production incident sends "Hi {{first_name}}" to two million people. Preview against real device frames before any template ships.

**Targeting is a query, not a list.** "All users who abandoned a cart in the last 24h and haven't been notified in 48h and are in an eligible timezone" — targeting resolves at send time against user attributes and behavioral state, not from a static CSV. The targeting layer needs access to fresh user data with clear semantics on staleness: targeting on yesterday's attributes is usually fine; targeting on last month's is how you notify churned users.

## Fan-out: the scaling problem

**Fan-out is per-device, and devices multiply.** A campaign to 5 million users is 8 million device sends (users have multiple devices). The fan-out layer expands audience → devices via the token registry, shards the send workload, and paces provider API calls within rate limits. This is a queue-and-worker architecture: durable queue (the campaign survives a deploy), parallel workers, per-provider rate limiting, and backpressure when providers throttle.

**Pace within provider limits and your own reputation.** Providers enforce rate limits; exceeding them gets you throttled or worse. But the subtler limit is user tolerance: 5 million pushes in one minute is also a thundering herd against your own backend when users tap through simultaneously. Pace large sends (over minutes, not seconds) and coordinate with backend capacity — the notification that drives a traffic spike your API can't absorb is a self-inflicted DDoS with extra steps.

**Collapse and replace, don't spam.** Providers support collapsing: a new notification replaces the previous one with the same collapse key (the latest score update replaces the earlier one; the "3 new messages" summary replaces "2 new messages"). Use collapse keys aggressively for update-type notifications. Without them, a flurry of events becomes a flurry of buzzes, and users disable notifications — the one metric you can't recover.

**Deduplicate across the pipeline.** Retries, duplicate events, and multi-device expansion all create duplicate-send risk. Dedupe keys on (user, event, window) at the notification service, and make provider sends idempotent where the API supports it. A user receiving the same "your order shipped" three times doesn't think "robust delivery" — they think "broken app."

## Priority, quiet hours, and user control

**Not all notifications deserve interruption.** Tier them: critical (security alerts, fraud — bypass quiet hours, high priority), transactional (order updates, messages — normal priority, respect quiet hours), and promotional (campaigns — lowest priority, strictest caps). The tier determines priority flags, quiet-hours behavior, and rate limits. When everything is high priority, nothing is — and the user disables the channel entirely.

**Quiet hours are a trust contract.** Let users set them (with sane defaults by timezone — detect timezone from the device, don't assume), and enforce them server-side, not client-side. Server-side enforcement means the send is delayed and re-evaluated at delivery time (is it still relevant six hours later? a flash sale that ended shouldn't send at 8 AM). Timezone handling is fiddly but non-negotiable for global audiences: store the user's timezone, handle DST transitions, and never schedule by server-local time.

**Preferences must be honored end to end.** Per-category opt-outs (messages yes, promotions no) enforced at the targeting layer — not just hidden in the UI while the sends continue. Every promotional send must have a working opt-out path, and preference changes must propagate to targeting faster than the next campaign runs. Regulators and app-store reviewers both check this; users check it with uninstalls.

**Frequency capping is the anti-fatigue system.** Cap sends per user per category per window (e.g., max 2 promotional per week, max 5 transactional per day) — enforced in the notification service with a per-user send ledger. Marketing will always want one more send; the cap is the mechanism that says no with data. Track opt-out and disable rates against send frequency — the curve where fatigue sets in is measurable, and it's different per audience.

## Reliability and the incident you will have

**The notification storm is the classic incident.** A bug in targeting or a runaway event source triggers millions of unintended sends. Defenses, in layers: rate limits per campaign and per user (hard stops, not advisories), anomaly detection on send volume (a 10x spike pages someone before the millionth send), a global kill switch that halts the fan-out pipeline in seconds, and dry-run mode for every new campaign or targeting rule (show the audience count and sample content before anything sends). The kill switch needs to be tested — an untested kill switch is a hope.

**Poison messages and partial failures.** A malformed template variable or a provider outage shouldn't halt the entire pipeline. Dead-letter queues for failed sends with per-message retry budgets, circuit breakers per provider (APNs down shouldn't block FCM sends), and degradation policy: when the pipeline is degraded, critical tier sends first, promotional sends wait. Define this priority order before the incident, not during it.

**Idempotent event ingestion.** Upstream services emit events at-least-once; the notification service dedupes on event IDs before doing anything expensive. Without this, a retried "payment received" event becomes two notifications, and the user learns to distrust the channel.

```python
# Fan-out worker: paced, deduped, tiered (conceptual)
async def process_campaign(campaign):
    audience = await targeting.resolve(campaign.audience_query)  # evaluated at send time
    async for batch in chunked(audience, 1000):
        devices = await token_registry.active_devices(batch.user_ids)  # pruned by feedback loop
        for device in devices:
            if not frequency_cap.allow(device.user_id, campaign.tier):
                continue  # capped: logged, not sent
            dedupe_key = f"{campaign.id}:{device.user_id}"
            if await sent_log.exists(dedupe_key):
                continue
            payload = renderer.render(campaign.template, device, locale=device.locale)
            await provider_queue.enqueue(device.provider, payload,
                                         collapse_key=campaign.collapse_key,
                                         priority=campaign.tier.priority,
                                         dedupe_key=dedupe_key)
        await pacer.wait()  # respect provider rate limits + backend absorb capacity
```

## Observability: proving delivery

**Instrument the full funnel.** Events emitted → notifications rendered → targeted → enqueued → sent to provider → provider accepted → delivered (where measurable) → opened → converted. Drop-off at each stage is a different problem: targeting bugs, token rot, provider throttling, content that doesn't convert. Without the funnel, "push isn't working" is undebuggable; with it, the failing stage names itself.

**Delivery receipts are partial truth.** Providers offer varying delivery confirmation, but coverage is incomplete (background restrictions, OS behaviors). Treat provider acceptance + funnel metrics as your operational signal, and use open rates directionally — they're affected by content quality as much as delivery. The honest dashboard shows "accepted by provider" distinctly from "confirmed delivered."

**Per-campaign and per-template analytics.** Open rate, conversion, opt-out rate, and disable rate per campaign — with the fatigue correlation visible. This data is what justifies frequency caps to stakeholders: "campaigns beyond 2/week show 3x the opt-out rate with no conversion lift" ends arguments that opinions can't.

## Privacy and compliance

**Notification content is data in transit through third parties.** The payload passes through provider infrastructure — keep it minimal. Sensitive content ("your test result is ready" not "your test is positive"; "new message from Alex" not the message body) is both a privacy practice and a lock-screen reality: notification previews are visible to anyone glancing at the phone. Let users control preview verbosity.

**Consent and regulation.** Promotional pushes require consent in most jurisdictions, with records of when and how consent was obtained. Handle consent per category, make withdrawal instant and effective, and keep the audit trail. App-store policies add their own layer — irrelevant or excessive notifications are a review rejection reason, and repeated user complaints about spam get apps pulled.

**Data retention on the send ledger.** The per-user send history needed for frequency capping and debugging is also personal data — retain it per your data-retention policy, not forever. "We might need it for debugging" doesn't justify indefinite retention of every notification ever sent to every user.

## Anti-patterns

**Product services calling provider APIs directly.** No targeting layer, no caps, no quiet hours, no observability — just scattered `sendPush()` calls. Works for the first feature, collapses under the fifth.

**Assuming delivery.** Business logic gated on "the push was sent." The provider accepted it; the device may never see it. Critical flows need in-app state, not push hope.

**No kill switch.** Discovering during the storm that stopping a campaign requires a code deploy. The kill switch is load-bearing infrastructure — build and test it before you need it.

**Marketing with production credentials and no dry-run.** The "oops" campaign to the full audience with the test template. Staging environments, dry-run audience counts, and approval gates for large sends are not bureaucracy — they're the lessons of everyone else's incident, pre-installed.

**Ignoring token hygiene.** Never pruning dead tokens, never consuming provider feedback. The fan-out slowly fills with dead addresses until a large share of sends is waste — and the provider starts treating you as a low-quality sender.

## Closing

Push at scale is a messaging system you own: a notification service separated from product code, template rendering with review, targeting resolved at send time, queued fan-out paced within provider limits, collapse keys and dedup against storms of buzzes, tiers with quiet hours and frequency caps that protect the channel from fatigue, a kill switch you've actually tested, and a delivery funnel that shows where each notification died. The provider API is ten lines; everything around it is the architecture. Build it like the trust-bearing channel it is — because the moment users disable notifications, you've lost the most direct line to them you had.
