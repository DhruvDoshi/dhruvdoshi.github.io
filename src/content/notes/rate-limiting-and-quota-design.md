---
title: Rate limiting and quota design for shared platforms
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Platform architecture
categories: [Platform Architecture, Rate Limiting, Reliability]
---

Rate limiting is one of those topics where everyone uses the same words to mean different things, and then the design review goes sideways. Before algorithms and headers, get the vocabulary straight — because "we need rate limiting" can mean four different problems, and they have different solutions.

## Definitions that prevent confusion

**Rate limiting** bounds the *rate* of requests: N requests per second/minute per key. It's about smoothing load and protecting capacity. A client making 100 requests in one second and then going quiet is treated differently from one making a steady 100 requests per second, depending on the algorithm.

**Quotas** bound the *total consumption* over a longer window: N requests per day, M tokens per month. Quotas are a product and billing primitive more than a reliability mechanism — they answer "how much of this resource does this customer get?" rather than "is the system about to fall over?"

**Throttling** is the enforcement action: slowing down or delaying requests that exceed a limit, rather than rejecting them outright. A throttled request eventually succeeds; a rate-limited request gets a 429.

**Backpressure** is the system's self-protection: when downstream can't keep up, upstream slows down. Queues fill, concurrency limits kick in, load shedding starts. Backpressure is what saves you when rate limiting is misconfigured or absent — it's the last line of defense, not the first.

Use rate limiting to protect capacity, quotas to define the product, throttling as a gentler enforcement option, and backpressure as the safety net. Conflating them produces designs like "our quota is 100 requests per second" — which is a rate limit wearing a quota costume, and it will confuse your billing team and your on-call equally.

## Algorithms compared

**Token bucket.** Each key has a bucket holding up to B tokens, refilled at R tokens per second. A request consumes tokens; an empty bucket means reject or delay.

- Burst behavior: excellent — a full bucket allows a burst of B requests instantly. Real clients are bursty; this is the point.
- Memory: one counter + timestamp per key.
- Use when: you want to allow bursts but bound the sustained rate. The default choice for most API rate limiting.

**Leaky bucket.** Requests enter a queue that drains at a fixed rate.

- Burst behavior: poor by design — it smooths traffic to a constant rate.
- Memory: queue state per key.
- Use when: downstream genuinely needs a constant rate — a legacy system that falls over on any burst, or pacing outbound calls to a third party.

**Fixed window.** Count requests in the current window; reject over the limit; reset at the boundary.

- Burst behavior: terrible at boundaries — a client can make 2N requests straddling two windows (N at 11:59:59, N at 12:00:01).
- Memory: one counter per key. Cheapest to implement.
- Use when: approximate limiting is fine and simplicity beats precision — internal tooling, coarse quotas, a first iteration you plan to replace.

**Sliding window log.** Store a timestamp per request; count timestamps within the window.

- Burst behavior: precise — the boundary problem disappears.
- Memory: O(requests per window) per key. The cost of precision.
- Use when: you need exactness and per-key traffic is modest.

**Sliding window counter.** Fixed windows, but weight the previous window's count by overlap — approximates the sliding log with O(1) memory per key.

- Burst behavior: good approximation of the sliding log.
- Memory: two counters per key. The sweet spot for most production systems.
- Use when: you want near-precision without the log's memory cost. This is what most "serious" rate limiters actually implement.

**Recommendation:** token bucket for per-request API limiting (burst-friendly, cheap), sliding window counter when you need precision (billing-adjacent limits, abuse prevention). Fixed window only where approximation is acceptable. Know the boundary-burst weakness of fixed window before you choose it — it's the most common source of "but we *had* a rate limit" postmortems.

## Distributed rate limiting: the counter problem

One instance can keep counters in memory. Ten instances cannot — unless you accept each instance enforcing its own limit, which means your effective global limit is N × per-instance limit. That's fine for coarse protection ("don't let one box melt") and wrong for anything contractual ("the customer paid for 1000 req/s" can't mean 1000 per box × 40 boxes).

Options:

- **Centralized counter (Redis).** Every request does an INCR + EXPIRE (or a Lua script for sliding-window logic). Precise and simple to reason about. The cost: a network round trip per request on the hot path, and Redis becomes a critical dependency. Mitigate with local short-TTL caching of "definitely over limit" decisions, and decide *deliberately* whether Redis degradation fails open or closed.
- **Redis Cell / GCRA.** `CL.THROTTLE` implements the Generic Cell Rate Algorithm atomically in Redis. One round trip, precise, well-tested. If you're already on Redis, the pragmatic choice.
- **Approximate / gossip-based.** Instances share counter estimates periodically instead of coordinating per request. Zero hot-path coordination, but the limit is approximate. Fine for safety rails ("roughly 10k req/s per tenant"), unacceptable for exact contractual numbers.
- **Sticky routing / sharding by key.** Route a key's requests to the same instance(s) and keep counters local. Precise without a central store, but routing now owns limit correctness, and rebalancing during deploys temporarily double-counts.

The decision: if the limit is contractual or billing-adjacent, centralize (Redis) and pay the latency cost. If it's protective, approximate is fine and cheaper. Document which of your limits are which — mixing them up is how you get paged for a "limit breach" that was actually estimation noise.

## Where to enforce: edge, gateway, service

The answer is usually multiple layers, because each layer sees something the others don't:

- **Edge (CDN / WAF):** cheapest place to drop traffic. Enforce coarse per-IP limits here to absorb dumb floods and scrapers before they touch your infrastructure. The edge doesn't know your tenants or your product tiers — keep its limits blunt and high.
- **API gateway:** the natural home for per-tenant, per-API-key rate limits. The gateway authenticates the caller, so it knows *who* is calling. This is where your documented, contractual limits live — the ones in your headers and your pricing page.
- **Service (application layer):** the only place that knows the *cost* of a request. A "list" that scans a million rows is not the same as a health check, and a flat per-request limit treats them identically. Enforce cost-based limits here: token consumption for LLM calls, row counts for exports, concurrency for expensive operations.

Layering guidance: edge stops floods, gateway enforces the contract, service enforces cost. A request that passes the gateway limit can still be rejected by the service if it's anomalously expensive — and that's correct, as long as the 429 it gets explains which limit fired (more on headers below).

## Per-key design

Limits are meaningless without a key. Common keys, in rough order of usefulness:

- **API key / client ID:** the best primary key for B2B APIs. Stable, attributable, maps to a billing relationship.
- **Tenant / organization:** for multi-tenant platforms where one tenant has many keys or users. Prevents a tenant from multiplying keys to multiply their limit.
- **User:** for user-facing products. Note that one human often has many sessions — key on the user ID, not the session.
- **IP address:** the weakest key, useful only as a coarse backstop. Behind NAT, one IP is an entire office or a mobile carrier's CGNAT pool — per-IP limits there punish innocents. Behind a well-behaved client, IPs rotate. Use IP limits at the edge for flood control, never as your primary contractual limit.

**Key hierarchy:** enforce at multiple keys simultaneously — e.g., 100 req/s per API key *and* 1000 req/s per tenant *and* a global service ceiling. The per-key limit is the contract, the per-tenant limit contains key multiplication, and the global limit keeps one tenant's burst from becoming everyone's outage. When a request is rejected, the response should say which level fired.

## Communicating limits

A limit nobody can discover is a trap, not a control. Every rate-limited response should carry `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset` — and every 429 must include `Retry-After`. A 429 without Retry-After tells the client "slow down" without saying for how long, which is how you get retry storms.

The 429 body should help, not just refuse: which limit fired (per-key? per-tenant? global?), the key it was evaluated against, when to retry, and where the docs are. `{"error": "rate_limited"}` is a dead end; a body naming the limit, the window, and the retry time is a debugging tool. Publish limits in docs and, for B2B platforms, in a limits dashboard — clients that can see consumption don't discover limits by hitting them in production.

## Retry behavior: make clients back off correctly

Your rate limiter is only half the system; the client's retry logic is the other half. What you want from clients: honor `Retry-After` exactly; exponential backoff with jitter when there's no Retry-After (without jitter, every limited client retries at the same moment, recreating the spike); and a retry budget — infinite retries convert a transient limit into permanent load.

SDKs you publish should implement this correctly out of the box, because most clients keep your SDK's defaults forever. Document expected retry behavior alongside the limits.

## Quotas as a product primitive

Quotas answer "what did the customer buy?" — daily/monthly request counts, token allowances, storage caps. Design notes:

- **Window alignment:** monthly quotas should align with the billing cycle, not the calendar month, or support will spend its life explaining the difference.
- **Overage policy:** decide and document what happens at 100% — hard stop, soft overage with billing, or grace with notification. Each is legitimate; "undefined" is not. Hard stops need prominent warnings at 80% and 95%: nobody's first notice of a quota should be an outage.
- **Quota vs rate limit interaction:** a client under their monthly quota can still hit per-second rate limits. The 429 body must distinguish "you're going too fast" from "you've used your allocation."
- **Reset behavior:** define what happens to unused quota and to burst capacity at reset — token buckets refilling to full at the billing boundary can create a predictable stampede.

## Protecting shared platforms from noisy tenants

This is the core reliability case for rate limiting: one tenant's bug, batch job, or growth spike must not degrade others.

- **Per-tenant limits with headroom:** set the per-tenant limit below what would saturate shared resources. The sum of per-tenant limits should exceed capacity (tenants rarely peak simultaneously), but the global limiter must shed load fairly when they do.
- **Fairness under contention:** when the global limit engages, don't serve first-come-first-served — that's "loudest tenant wins." Weighted fair queuing or per-tenant queuing keeps one tenant's flood from starving others.
- **Bulkhead expensive operations:** isolate known-expensive endpoints (exports, reports, batch endpoints) onto separate concurrency pools or even separate capacity, so a runaway export doesn't consume the request budget of interactive traffic.
- **Kill switches per tenant:** when a tenant is genuinely abusive or compromised, you need to shed their traffic *now*, without deploying. A per-tenant block/strict-limit control in your admin tooling is not optional for a shared platform.

## Limit design for AI/LLM endpoints

LLM endpoints break per-request limiting because cost varies by orders of magnitude between requests. A 10-token completion and a 100k-token context ingestion are not the same "request."

- **Token-based limits:** limit input+output tokens per minute/hour per key, not requests. This maps to your actual cost (you pay per token) and to the client's actual consumption. Token bucket works well here — tokens are literally the bucket's currency.
- **Concurrency-based limits:** bound simultaneous in-flight requests per key. This protects latency for everyone: an LLM serving stack degrades on concurrency, not just throughput. A client with 100 concurrent long generations can starve interactive users even under a generous token rate.
- **Separate limits for expensive operations:** embeddings, fine-tuning jobs, and batch inference have different cost profiles from chat completions. Don't let one limit cover all of them — a client doing bulk embeddings shouldn't consume the chat budget.
- **Streaming and cancellation:** a client that disconnects mid-stream may have already consumed most of the tokens. Decide whether to count consumed or generated tokens, document it, and make sure your counting point can't be gamed by connecting and disconnecting.

## Testing limits

Load tests that only verify 200s are testing the happy path. Your limit tests should:

- Verify 429s fire at the configured threshold — not approximately, but at the boundary. Off-by-one in a limiter is a contract violation.
- Verify `Retry-After` and rate-limit headers are present and correct on every 429.
- Test burst behavior explicitly: does a token bucket actually allow the configured burst? Does fixed window actually double-allow at boundaries (and have you decided that's acceptable)?
- Test the hierarchy: per-key, per-tenant, and global limits engaging in the right order, with the right limit named in the response.
- Test failover: what happens when the Redis backing your limiter is slow or down? Does the system fail open (no limits — dangerous) or closed (everything 429s — an outage)? Whatever you choose, choose it deliberately and test it.
- Test the retry storm: point a misbehaving client (no backoff, aggressive retries) at a limited endpoint and confirm the system stays up and the headers guide it to correct behavior.

## Anti-patterns

- **One global limit for everything.** Protects the service from total meltdown and nothing else. It can't distinguish tenants, can't express cost differences, and when it fires, everyone suffers equally — including the innocent.
- **Limits nobody can discover.** No headers, no docs, no dashboard. Clients find the limit by hitting it in production, usually during their launch.
- **429 without Retry-After.** You said "slow down" without saying for how long. Expect a retry storm.
- **Per-IP limits as the primary key behind NAT.** One mobile carrier's CGNAT pool shares a handful of IPs across thousands of users. Your "abuse prevention" is now collective punishment.
- **Rate limiting at only one layer.** Gateway-only limiting misses cost differences between endpoints; service-only limiting lets floods reach your app servers; edge-only limiting can't express tenant contracts.
- **Limits that fail silently open or closed.** Redis goes down and suddenly there are no limits (open — hope nobody notices) or every request 429s (closed — self-inflicted outage). Both are choices; neither should be an accident.
- **Punishing the retry instead of guiding it.** Returning 429s with no backoff guidance, then complaining about retry storms, is blaming the client for your protocol design.
