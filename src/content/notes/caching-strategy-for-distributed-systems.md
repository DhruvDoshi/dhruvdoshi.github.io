---
title: "Caching strategy for distributed systems"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Distributed systems
categories: [Distributed Systems, Caching, Performance]
---

Caching is the highest-leverage performance tool in distributed systems and the most reliable source of subtle correctness bugs. Every cache is a bet: that serving slightly stale data is cheaper than recomputing it, and that you can manage the gap between the cached copy and the truth. Teams usually get the first half right and improvise the second.

## What to cache and what NOT to cache

Cache data that is **read-heavy, expensive to fetch or compute, and tolerant of staleness**: reference data, computed aggregates, rendered fragments, slow downstream call results. The criteria are a ratio (reads per write) and a cost (what a miss costs in latency, money, or downstream load).

Do NOT cache: data where staleness has safety or financial consequences (spendable balances, access-control decisions), data written as often as read (a consistency problem for no win), and data you cannot invalidate (no path from "source changed" to "entry gone" means a time bomb, not a cache). Per-user data with low reuse rarely pays — a 2% hit ratio is a slower, more complex database.

**The ownership question comes first.** Every cached item needs an owner who can answer: what is the source of truth, what is the acceptable staleness, and how does invalidation happen. If nobody can answer all three, do not cache it yet.

## The four patterns: cache-aside, read-through, write-through, write-behind

**Cache-aside (lazy loading)** is the default: the app checks the cache; on a miss it reads the database, populates the cache, and returns. Writes go to the database, then invalidate the cache entry.

```
client → app → cache? ──hit──→ return
                  └──miss──→ db → populate cache → return
client → app → db write → delete/invalidate cache entry
```

Use it when read patterns are unpredictable, the data model doesn't fit a generic loader, or you want the application controlling freshness. Weakness: the first request after invalidation pays the full miss cost (the stampede problem below).

**Read-through** moves the loader into the cache layer: the app asks the cache, which fetches from the database on a miss. Use it when many apps share the cache and you want one loading path. Trade-off: loading logic lives outside your code, making misses harder to debug.

**Write-through** writes to cache and database synchronously. Use it when stale reads are unacceptable and write volume is low enough to afford double latency. A cache outage becomes a write-path outage — size that risk.

**Write-behind (write-back)** acks the write after updating the cache and flushes to the database asynchronously. Use it for extreme write throughput where losing seconds of writes on cache failure is an accepted business risk (counters, analytics). Never for money or orders. The failure mode is data loss on cache crash — go in with eyes open.

**Default guidance:** cache-aside for reads, explicit invalidation on writes. Reach for the others only when you can name the specific problem cache-aside doesn't solve.

## TTL selection is a business decision, not a technical one

"How long should the TTL be?" is really "how stale can this data be before someone gets hurt or misled?" — a product question. A product catalog TTL of an hour means prices can be wrong for an hour; is that acceptable? For a social feed, yes. For a trading screen, no. Get the staleness budget in writing from the domain owner, because the engineer picking "3600 because it felt right" is making a business decision without authority.

**Mechanics:** jitter TTLs (base ± random spread) so entries don't expire simultaneously. A 60-second TTL is sometimes cheaper than a perfect invalidation pipeline. And distinguish TTL (entry lifetime) from the staleness budget (how wrong data may be): a 5-minute TTL with a 1-minute budget needs active invalidation, not just expiry.

## Invalidation strategies

"There are only two hard things in computer science: cache invalidation and naming things." The quote is earned. Your options, from blunt to precise:

**TTL expiry** is invalidation by patience. Simple, no coordination needed, wrong for exactly the TTL window. Use it when the staleness budget exceeds the TTL — which, honestly, covers more cases than engineers admit.

**Explicit invalidation on write** deletes the key when the source changes — tight consistency, modest complexity. The failure mode is crashing between the DB write and the cache delete, leaving a stale entry until TTL. Mitigate with the transactional outbox: the invalidation event is written in the same transaction as the data change, and a relay performs the delete — eventually guaranteed, not best-effort.

**Versioned keys** embed a version (`product:123:v42`); writes bump the version pointer and old versions expire by TTL. No delete race, but something must own the version pointer.

**Event-driven invalidation** publishes domain events for cache managers to consume — right when writers span services, but it imports every event-driven pitfall (ordering, duplicates, poison messages) into your consistency story.

**Choose by staleness budget:** TTL-only when the budget is generous, explicit invalidation when it is tight, versioned keys when deletes race, events when writers are distributed. Most systems need two of these, not one.

## Stampede protection

A cache stampede (thundering herd) happens when a hot key expires — or the cache cold-starts — and hundreds of concurrent requests all miss, all hit the database, and the database falls over. The cache was protecting the database; now the database is protecting nothing.

**Request coalescing (singleflight):** when N requests miss on the same key, one fetches; the rest wait on the in-flight request. The single most effective defense — it belongs in your cache client library, and if yours lacks it, that's a gap to close.

**Probabilistic early refresh:** refresh before expiry with rising probability as expiry approaches, plus jitter so refreshes don't align.

**Stale-while-revalidate:** serve the stale entry while refreshing asynchronously — fast, slightly stale responses and a self-healing cache. Requires the staleness budget to tolerate it; for read-heavy workloads it converts stampedes into non-events.

**Circuit-breaking the source:** if the database is struggling, stop the coalesced fetchers from piling on — serve stale or fail fast rather than adding load. A cache that sacrifices itself to protect a dying database has its priorities backwards.

## Consistency models for cached data: stale-read budgets

Stop asking "is the cache consistent?" and start asking "how stale may a read be, for this data, in this context?" Write it down per dataset: product prices — 5 minutes; user profile names — 1 minute; feature flags — 30 seconds; account balance available-to-spend — 0 seconds (don't cache, or cache with synchronous invalidation). The stale-read budget is the contract between the cache and the business, and it determines which invalidation strategy you need. Data with a zero budget doesn't get a cache — it gets a faster source of truth.

**Read-your-write:** after a user updates their profile, the same session must read through to the source — not hit the stale entry. Users forgive a CDN being a minute behind; they don't forgive their own edit appearing to vanish.
## Cache key design and namespacing

Bad key design causes the most embarrassing cache incidents: collisions that serve one user's data to another, keys that can't be invalidated by pattern, and unbounded key cardinality that exhausts memory.

**Rules:** deterministic (same input → same key, no timestamps embedded), namespaced (`product:123`, not `123`), and invalidatable (a write must be able to compute exactly which keys to delete — prefer `user:{id}:profile` over unreconstructable query hashes). Include the schema generation in the key (`...:v3`) so deploys don't serve entries written by old code.

**Cardinality control:** a key per user per query variant is a memory leak with extra steps. Bound the dimensions and cap key counts per namespace. If cardinality grows with user input (search queries, filter combos), don't cache it at the application layer.

**Tenant isolation:** in multi-tenant systems the tenant ID is part of every key, no exceptions. A missing tenant prefix is a cross-tenant data leak waiting for one key collision. Enforce it in the cache client wrapper so applications can't forget.

## Multi-level caching and invalidation propagation

Real systems cache in layers: CDN at the edge, reverse proxy, application cache, database query cache. Each layer has different staleness characteristics, and invalidation must propagate through all of them — invalidating the app cache while the CDN serves the old page for another hour is a bug your users will find.

**Design the invalidation path top-down.** A write invalidates from the innermost layer outward — or better, use versioned URLs/keys at the edge so invalidation is a pointer swap. CDN purges are themselves eventually consistent (minutes, on some providers), so never design around "purge is instant."

**Each layer needs its own TTL policy.** Edge: long TTLs, versioned assets. Application: medium TTLs tied to staleness budgets. Database: short or none. Document which layer serves what, so a stale-data report points at a layer instead of a guessing game.

**Beware layered staleness multiplication.** A 5-minute TTL at three layers can mean 15 minutes of staleness end to end if invalidations don't propagate. The system's effective staleness budget is the sum of the layers, not the max — size each layer's TTL with that arithmetic in mind.

## Distributed cache failure modes

**Cold start:** after a deploy or failover the cache is empty and every request hits the source. Defend with warm-up routines (preload hot keys — know them from access logs), staggered deploys, and persistent cache storage where supported.

**Hot keys:** one key with disproportionate traffic overwhelms its node (and the database behind it on miss). Detect with per-key metrics; mitigate by replicating the key, sharding it, or absorbing fan-in with a short-TTL local cache in front.

**Noisy neighbor:** one tenant's usage evicts everyone else's entries. Isolate with namespace quotas or separate clusters for divergent workloads. Shared cache without quotas is shared fate.

**Replica inconsistency:** most distributed caches are eventually consistent across nodes — a write on one node isn't immediately visible on another. Don't build read-your-write expectations across nodes without sticky routing or version checks.

**Cache outage:** decide now whether the app degrades (slower, from source) or fails. If the source can't handle uncached load, the cache is load-bearing — that must be an explicit, monitored capacity decision, not an incident-time discovery.

## Sizing and eviction policies

Size the cache from measured working sets, not guesses: the hot data that serves 80–90% of reads. Monitor memory usage, eviction rate, and hit ratio per namespace; a climbing eviction rate on a fixed-size cache means the working set outgrew the allocation — add memory or shrink what's cached.

**Eviction policies, matched to access patterns:** LRU is the sane default for workloads with temporal locality; LFU suits stable hot sets; TTL-expiry for data with natural freshness lifetimes. Always set maxmemory policies explicitly — a full cache with no eviction policy crashes or stops accepting writes, discovered at the worst time.

## Caching auth and session data: pitfalls

Caching authentication and authorization decisions is where staleness becomes a security incident. A revoked API key, a deactivated user, a changed role — if the cache still says "allowed," the control is bypassed.

**Rules:** keep auth-decision TTLs short (seconds to minutes, never hours); propagate revocations to every cache layer immediately (one place where event-driven invalidation is worth it); never cache "denied" longer than "allowed" without deliberation — a stale denial locks users out, a stale grant is a breach.

Sessions are write-heavy and per-user — the read/write ratio is often poor. Prefer stateless tokens (short-lived signed JWTs); for revocation, keep a small denylist cache of revoked token IDs rather than caching full sessions.

## Observability: what to measure

Per tier and namespace, measure: **hit ratio** (segmented — a 95% global ratio can hide 40% on the namespace that matters), **miss latency** (p99 — your database's load profile), **eviction rate** (climbing means the working set outgrew the cache), **concurrent misses per key** (stampede early warning), **staleness** (sampled, not assumed), and **invalidation lag** (source write to invalidation complete — your real consistency number).

Dashboard the staleness budget vs measured staleness per dataset. The moment measured exceeds budget, you have a correctness incident, not a performance issue — treat it with that severity.

## Anti-patterns

**Caching everything.** The cache becomes a slower, more expensive, less consistent copy of the database. Every dataset needs its read/write ratio and staleness budget justified before it gets cached.

**Caching without ownership.** Nobody owns invalidation, nobody defined the staleness budget, and the first stale-data incident becomes a cross-team argument about whose bug it is. No owner, no cache.

**Cache as source of truth.** The cache is a performance layer, not a database. The moment application logic treats "not in cache" as "does not exist," or business processes depend on cached data surviving, you've inverted the architecture. The source of truth must be able to rebuild the cache completely — test that rebuild regularly.

**Invalidation by deploy.** "We clear the cache on every deploy" is an admission that invalidation is unmanaged. It couples deploys to correctness, causes cold-start stampedes on every release, and doesn't help at all between deploys.

**Caching to hide a slow source instead of fixing it.** A cache over a missing database index is a bandage that becomes load-bearing. Fix the query, then cache the result. The cache should multiply the headroom of a healthy source, not compensate for a sick one.

**Shared cache keys across environments.** Staging writing to the same keyspace as production is an incident report waiting to be written. Namespace by environment at the client level, enforced, not by convention.

## Closing

Caching strategy is three decisions per dataset: the stale-read budget (a business call), the pattern and invalidation mechanism that enforces it (engineering), and who owns the gap (organizational). Get those right and the cache is your highest-leverage component; get them wrong and it's a distributed source of subtle, trust-destroying bugs. The technology is the easy part. The discipline is the product.
