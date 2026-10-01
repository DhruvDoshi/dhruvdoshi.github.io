---
title: "SSR, ISR, and edge rendering: choosing without the hype"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Frontend architecture
categories: [Frontend, Rendering, Architecture]
---

Every few years the frontend world rediscovers server rendering and declares client-side rendering dead, then rediscovers its costs and declares SSR dead. The reality is boring and durable: rendering location is a trade-off between time-to-content, interactivity, personalization, and operational complexity — and the right answer varies by page, not by framework or fashion. This note maps the options honestly: what each rendering strategy actually buys, what it costs, and a decision process that starts from the page's requirements instead of the framework's defaults.

## The strategies, without marketing

**Client-side rendering (CSR).** The server ships a shell and JavaScript; the browser fetches data and renders. Strengths: cheap to serve (static files on a CDN), simple operational model, great for authenticated app surfaces where SEO doesn't matter and the user waits for login anyway. Weaknesses: blank page until JS loads and data arrives — poor first paint on slow networks, invisible to crawlers without extra work, and every millisecond of JS parse delays interactivity.

**Server-side rendering (SSR).** Each request renders HTML on the server. Strengths: fast first contentful paint, fully crawlable HTML, the browser shows content before JS finishes. Weaknesses: server cost per request, time-to-first-byte depends on your data fetching (slow APIs mean slow HTML), and the "uncanny valley" — rendered HTML that isn't interactive until hydration completes, during which clicks may do nothing.

**Static site generation (SSG).** HTML rendered at build time, served from CDN. Strengths: unbeatable TTFB and cost — it's a file. Weaknesses: content freezes at build time; a 10,000-page site with a 20-minute build makes "just fix the typo" a deployment event. Right for content that changes on editorial schedules, wrong for anything personalized or real-time.

**Incremental static regeneration (ISR).** SSG with on-demand revalidation: pages are static but regenerate in the background after a TTL or on webhook. Strengths: CDN-speed serving with bounded staleness. Weaknesses: the staleness model is subtle (first visitor after expiry may get stale content while regeneration runs), cache invalidation across related pages needs design, and debugging "why is this page stale" requires understanding the regeneration pipeline.

**Edge rendering.** SSR executed at edge locations close to the user rather than in a central region. Strengths: lower latency for the render itself, and — the real prize — personalization at the edge (geolocation, A/B variants, auth-aware content) without a round trip to origin. Weaknesses: edge runtimes are constrained (CPU time limits, no arbitrary native modules, smaller memory), observability is thinner than in your own infrastructure, and cost models charge per execution in ways that surprise teams at scale.

Verdict on the menu: there is no best strategy, only strategies whose weaknesses you can afford on a given page. Most real applications use three or more of these on different routes.

## Start from the page, not the framework

**Is the page public and crawlable?** Marketing pages, docs, blog posts, product listings — if search traffic matters, the HTML must contain the content. That's SSR, SSG, or ISR. CSR with pre-rendering services is a bandage; pick real server rendering for pages where SEO is revenue.

**Is the page personalized?** Dashboards, feeds, account pages — content differs per user, so static generation is out (or reduced to the static shell with personalized islands). The choice is SSR vs CSR, and the honest question is whether the user benefits from server-rendered first paint. For authenticated app surfaces behind a login wall, the user already expects a loading state, and CSR's operational simplicity often wins. SSR for logged-in dashboards is frequently complexity without payoff — the "fast first paint" shows a skeleton anyway because the data is per-user and fetched at request time.

**How fresh must the content be?** Product prices that change hourly, docs that change weekly, marketing copy that changes quarterly — the freshness requirement picks the strategy. Real-time → SSR or CSR with client fetching. Minutes-to-hours tolerance → ISR with a matching TTL. Editorial cadence → SSG with build-on-publish.

**What's the traffic shape?** High-traffic public pages amortize SSR cost poorly and benefit enormously from CDN caching — ISR or SSG. Low-traffic pages (long-tail docs, admin screens) don't justify caching infrastructure; SSR or even CSR is fine. The expensive mistake is SSR-ing a page that gets ten visits a day (operational complexity for nothing) or CSR-ing a landing page that gets a million (abandoned visitors).

```
  Page requirements ──> Rendering choice
  ┌─────────────────────────────────────────────┐
  │ Public + SEO-critical + rarely changes      │ → SSG
  │ Public + SEO-critical + changes hourly      │ → ISR (TTL ~ freshness need)
  │ Public + personalized per request           │ → SSR / edge render
  │ Authenticated app surface                   │ → CSR (or SSR shell + islands)
  │ Highly interactive, low SEO value           │ → CSR
  │ Global audience + personalization           │ → edge rendering
  └─────────────────────────────────────────────┘
```

## The SSR costs nobody puts in the demo

**Data fetching becomes server infrastructure.** SSR means your server (or edge function) calls your APIs on every page view. Those APIs now need to handle SSR traffic patterns — cacheable where possible, with timeouts and fallbacks, because a slow API is now a slow page for everyone, not just one user's spinner. Teams adopting SSR discover their API latency budget the hard way: p99 API latency becomes p99 TTFB.

**Hydration is a second load you're not measuring.** SSR ships HTML fast, then ships the JS bundle, which then hydrates — attaching event handlers and rebuilding component state. Until hydration completes, the page looks interactive but isn't (the uncanny valley), and hydration itself costs CPU on the user's device. A heavy SSR page can have great server timing and terrible interactivity. Measure time-to-interactive, not just first paint, and consider partial hydration / islands: hydrate only the interactive regions, leave the static content as plain HTML.

**Server state and client state diverge.** Anything that differs between server and client render — timestamps ("2 minutes ago" computed at different times), random IDs, browser-only APIs accessed during render — causes hydration mismatches: React warnings at best, broken interactivity at worst. This is a whole bug class that CSR doesn't have. The discipline: render functions must be pure with respect to environment, and environment-specific code must be gated behind effects or dynamic imports.

**Caching SSR is a design activity.** Naive SSR (render everything per request) doesn't scale past modest traffic. The caching layers — full-page cache for anonymous users, fragment caching, CDN with `Vary` on the right headers, stale-while-revalidate — are where SSR performance actually comes from. An SSR architecture without a caching design is just an expensive way to serve slow pages.

## Edge rendering: where it earns its keep

Edge rendering's distinctive value isn't "SSR but faster" — it's moving request-specific logic to the user's doorstep. The compelling cases:

**Personalization without origin round trips.** Geolocation-based content, A/B test assignment, auth-aware rendering — decided at the edge from request headers and cookies, rendered into the HTML before it travels. For global audiences, this cuts the personalization latency that central SSR can't avoid.

**Composing at the edge.** Edge-side includes and fragment composition let independently deployed frontends (see the micro-frontends note) assemble at the CDN layer, close to the user, with per-fragment caching. The edge becomes the integration point — which is powerful and which concentrates complexity at the layer with the thinnest observability. Go in with eyes open.

**The constraints are real.** Edge runtimes limit CPU time per request (tens of milliseconds to a few seconds depending on platform), restrict or forbid native modules, and offer limited local state. Heavy data aggregation, complex auth flows, and anything needing substantial compute don't belong at the edge — they belong at origin, with the edge caching or personalizing around them. And the cost model: per-request execution pricing is cheap at low volume and can surprise at high volume. Model it against your traffic before committing, not after the first bill.

**Rule of thumb:** use edge rendering for latency-sensitive personalization and composition on high-traffic public pages. Keep heavy logic at origin. If your pages aren't personalized and your audience isn't global, the edge buys you little over a good CDN cache.

## Streaming and partial rendering: the modern middle

**Streaming SSR** sends HTML in chunks as data resolves — the shell and fast fragments first, slow fragments as they complete, with placeholders. This fixes SSR's worst property (TTFB gated on the slowest data fetch) without abandoning server rendering. The complexity moves to the client: handling out-of-order chunk arrival, and the UX design of progressive loading states. Worth it for pages with one slow data source among fast ones — which is most real pages.

**Islands architecture** (popularized by Astro and adopted more broadly): mostly-static page with isolated interactive components ("islands") that hydrate independently. The insight is that most pages are 90% static content and 10% interactivity — shipping and hydrating a full app runtime for the 90% is waste. Islands give SSG-like serving with CSR-like interactivity where it counts. This is often the right answer for content-heavy pages with interactive widgets, and it deserves consideration before reaching for full SSR.

## Measuring the decision

**The metrics that adjudicate:** time-to-first-byte (server efficiency), first contentful paint and largest contentful paint (perceived speed), time-to-interactive / interaction-to-next-paint (actual usability), cache hit ratio at the CDN (whether your caching design works), server cost per thousand renders (the bill), and error rate by rendering path (SSR adds server-side failure modes — API timeouts, render exceptions — that CSR doesn't have).

**A/B the rendering, not just the design.** For high-traffic pages, the rendering strategy itself is worth experimenting on: SSR vs ISR for the landing page, measuring conversion and Core Web Vitals, not just lab timings. Real-user measurement (RUM) by geography and device class is what settles these debates — lab tests on office wifi systematically understate the value of server rendering for users on mid-tier mobile networks, who are often the majority.

**Set a re-evaluation trigger.** Rendering choices decay: traffic grows, personalization needs change, edge pricing shifts. Note the assumptions behind each choice (traffic level, freshness requirement, personalization scope) and the threshold that would change it. "We'll use ISR with 60s TTL until product pages need sub-10s freshness" is a decision; "we use ISR" is a habit.

## Authentication in server rendering: the session problem

SSR and authenticated pages mix awkwardly, and the friction is worth naming. Server rendering a personalized page means the server needs the user's session: cookies forwarded to data-fetching calls, token refresh handled server-side, and auth failures rendered as redirects rather than API 401s the client would handle. This duplicates auth logic across server and client — the client already knows how to handle an expired token, and now the server must too, consistently.

**The practical split:** render the anonymous shell (layout, navigation skeleton, public content) on the server for fast first paint and SEO, and fetch personalized content client-side after hydration. The user sees the page instantly; their data streams in a beat later. Full SSR of authenticated dashboards is usually the worst of both worlds — server complexity for a first paint that shows a skeleton anyway. Reserve per-request SSR for pages where the personalized content itself is SEO-relevant or above-the-fold critical, and even then, cache per user-segment rather than per user where the personalization allows it.

## Anti-patterns

**SSR everything by default.** Framework defaults that SSR every route push teams into operating server infrastructure for pages (admin panels, authenticated dashboards) where CSR was simpler and equally fast in practice. Choose per route.

**Ignoring the API latency budget.** Adopting SSR without requiring APIs to meet a p99 latency target. The SSR page is only as fast as its slowest blocking fetch — measure and budget it.

**No caching design.** SSR without CDN caching, stale-while-revalidate, or fragment caching. This is the most common SSR operational failure: it works in staging, melts under production traffic, and the fix is the caching architecture that should have been designed first.

**Edge for everything.** Moving all rendering to the edge because it's fashionable, then fighting runtime constraints and surprising bills. The edge is a scalpel for latency-sensitive personalization, not a default compute tier.

**Hydration mismatch whack-a-mole.** Treating hydration warnings as noise instead of as a bug class. Suppress the warning and you've hidden the symptom; the underlying non-determinism will surface as broken interactivity for a subset of users.

## Closing

Choose rendering per page from its actual requirements: crawlability, personalization, freshness, traffic. SSG for stable public content, ISR for public content with bounded staleness, SSR where first paint and SEO matter with per-request data, CSR for authenticated app surfaces where simplicity wins, edge rendering for global personalization at the doorstep, islands where the page is mostly static. Design the caching layer before you need it, budget the API latency SSR exposes, measure real-user interactivity — not just paint — and write down what would change each decision. Rendering strategy is infrastructure: boring when chosen deliberately, expensive when chosen by default.
