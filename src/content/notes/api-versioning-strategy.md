---
title: API versioning strategy that survives contact with reality
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Platform architecture
categories: [Platform Architecture, API Design, Governance]
---

The real goal of API versioning is not elegance. It is this: **never break a consumer you don't know about.** Internal services you can grep for callers. External APIs — public, partner, or just "the mobile app's pinned old build that three thousand users never updated" — have consumers you cannot enumerate, cannot contact, and cannot force to upgrade. Every versioning decision flows from that asymmetry.

## Versioning mechanisms, compared honestly

There are four common mechanisms. Each has a constituency that will defend it passionately, and each is wrong for some cases.

**URI path versioning** (`/v1/orders`, `/v2/orders`).

Pros: visible, debuggable, cache-friendly (different URLs are different cache entries), trivial to route at the gateway, and obvious in logs. A support engineer can see the version without decoding anything.

Cons: it versions the whole API surface at once even when only one resource changed; it technically violates the "URI identifies the resource" purist view (which nobody in production cares about); clients hardcode paths and then you have version strings scattered across codebases forever.

**Header versioning** (`Accept: application/vnd.myapi.v2+json` or a custom `X-API-Version`).

Pros: clean URIs; the resource identity stays stable across versions.

Cons: invisible in browser address bars and most logs; harder to debug ("which version did that request use?" requires header inspection); CDN and gateway caching needs explicit `Vary` configuration or you serve v1 responses to v2 clients; some clients and proxies strip or mangle custom headers.

**Query parameter versioning** (`/orders?version=2` or `?api-version=2`).

Pros: easy to try in a browser; simple to implement.

Cons: pollutes every URL; caching gets subtle (the param must be part of the cache key); it looks ad hoc because it is; version leaks into analytics and bookmarks in confusing ways.

**Content negotiation** (media-type parameters, profile links).

Pros: the most "correct" per HTTP semantics; expressive for representation-level differences.

Cons: the most complex to implement and document; poor tooling support in client generators; almost nobody's support team can debug it at 2 AM.

**Recommendation:** use URI path versioning for anything external or partner-facing. It is the most debuggable, the most cache-safe, and the easiest to explain to a consumer you will never meet. Reserve header versioning for internal service-to-service APIs where you control both ends and have the observability to see headers everywhere. Never use query params for versioning in a serious API, and treat full content negotiation as a research project, not a strategy.

One mechanism per API. Versioning in the URL *and* the header is not belt-and-suspenders; it is two sources of truth that will disagree, and then you get to write conflict-resolution logic for a problem you invented.

## Additive-change discipline: versioning as the exception

Most teams version too much because they never defined what *doesn't* need a version. The primary strategy should be additive change:

**Safe without a new version:** adding new endpoints, adding new optional fields to responses, adding new optional parameters to requests, adding new enum values (with a caveat below), adding new error codes (clients should already handle unknown codes), changing the order of fields, adding new webhook event types.

**The enum caveat:** adding a new enum value is safe only if consumers are written defensively — i.e., they handle unknown values instead of crashing. Mobile clients with exhaustive switch statements are the classic casualty. If your consumers can't promise defensive handling, an enum addition is a breaking change for them. Know your consumers.

**Breaking, needs a version (or at least a deprecation cycle):** removing or renaming fields, changing field types, making an optional field required, changing error semantics, changing pagination behavior, changing auth requirements, changing rate limits downward in a way that breaks existing integrations.

The discipline: every API change gets classified as additive or breaking *before* it's built, in the design review. If it's additive, it ships on the current version. Versioning is the exception you reach for when the change is genuinely breaking — not the default for every change.

## Deprecating without drama

Deprecation is a communication problem with a technical component, not the reverse.

**Usage telemetry per version and per field.** You cannot deprecate what you cannot measure. Instrument every API so you know, per endpoint, per version, per deprecated field: who calls it, how often, and whether the caller is one you can contact. This telemetry is the foundation of every deprecation timeline. Without it, "nobody uses v1 anymore" is a guess, and guesses break production.

**The Sunset header.** Use the `Sunset` HTTP header (RFC 8594) on deprecated endpoints to communicate the retirement date machine-readably, plus a `Deprecation` header with the deprecation date. Pair it with a `Link` header pointing at the migration guide. Human-readable docs matter, but machine-readable signals let serious consumers build automation around your timeline.

**Communication timeline.** A pattern that works: announce deprecation (changelog, email, docs banner) → wait one full consumer release cycle → send targeted outreach to the remaining holdouts your telemetry identified → then, and only then, start returning errors. The timeline should be measured in consumer cycles, not your sprint cycles. For a mobile app with a 6-week release train and slow updaters, "support the old version for 6 months" might be the *minimum* honest commitment.

**What "deprecated" means technically.** Deprecated endpoints keep working, keep getting security patches, but get no new features. New consumers are steered to the new version from day one of the deprecation announcement. The moment you let a new integration onboard to a deprecated version, you have extended its life by the length of that integration's lifetime.

## How long to support old versions

Decision criteria, not vibes:

1. **Contractual commitments.** If an SLA or enterprise agreement promises 12 months of notice, that's the floor. Check before you promise anything in docs.
2. **Consumer upgrade velocity.** Measure it. Mobile apps with forced-update mechanics can move in weeks; embedded devices and enterprise on-prem integrations move in years. Your support window must match the slowest consumer you care about, not the fastest.
3. **Cost of carrying the version.** Old versions cost real money: code paths to maintain, test matrices to run, security patches to backport, support tickets to answer. Quantify it — even roughly — so the "keep v1 forever" decision is explicit.
4. **Security posture.** A version you can't patch is a version you must kill. If a breaking security fix can't be backported cleanly, that sets a hard deadline regardless of the other criteria.

A reasonable default for external APIs: support N and N-1, with a minimum 6–12 month deprecation notice. For partner APIs with contractual relationships: whatever the contract says, plus telemetry-driven outreach. For internal APIs: much shorter — see below.

## Internal vs external vs partner APIs

**Internal (service-to-service within your org):** you can enumerate every caller, you can coordinate deploys, and you can break things on purpose with a Slack message. Version aggressively lightly — prefer additive changes, use contract tests to catch breakage, and when you must break, do it with a coordinated migration over days, not a version that lives for years. Long-lived internal versions are tech debt with a fancy name.

**External (public API, unknown consumers):** the strictest rules. URI versioning, additive discipline, long deprecation windows, machine-readable sunset signals. Assume every consumer is a black box that will never upgrade until forced.

**Partner (known consumers, contractual relationship):** the middle ground. You know who they are and can talk to them, but you can't control their roadmap. Version like external, deprecate like internal-with-manners: direct outreach, joint timelines, and telemetry shared with the partner so they can see their own usage.

The common failure is applying one policy to all three. Internal APIs versioned like public APIs accumulate dead versions; public APIs managed like internal APIs break strangers.

## Versioning events and async APIs

Versioning discussions are usually REST-centric, but events need it too:

- **Event schemas are APIs.** A Kafka topic or webhook payload has consumers you don't know about. Apply the same additive discipline: add fields, never rename or remove without a migration path.
- **Schema registries** (for Avro/Protobuf/JSON Schema) give you compatibility checking — BACKWARD, FORWARD, FULL — as a CI gate. Use them. A registry that rejects incompatible schemas at publish time is worth more than any versioning policy document.
- **Version the event, not the topic** (usually). A new topic per version fragments consumers and makes replay painful. Put a schema version *inside* the event envelope and let consumers select on it. Topic-per-version is occasionally right for a hard cutover, but it's the exception.
- **Webhooks** are external APIs with extra pain: you can't version the caller's endpoint, so version the payload and give consumers a way to declare which payload version they want (per-subscription configuration beats a global version).

## Breaking-change detection in CI

Humans are bad at noticing breaking changes; diffing is cheap. Build these gates:

- **OpenAPI/schema diffing** in CI: every PR that touches the API spec gets an automated diff against the previous spec, classified as breaking or non-breaking (tools exist for this; the classification rules should match your additive/breaking definitions above). A breaking diff requires an explicit override — a label, a checkbox, a second reviewer — never silent passage.
- **Contract tests:** consumers publish their expectations (Pact-style or even a checked-in set of example requests/responses); the provider runs them. This catches the semantic breakage that schema diffing misses — the field that's still present but now means something different.
- **Consumer-driven canary analysis:** when you deploy an API change, watch error rates segmented by API version and by consumer. A spike in 4xx from v1 consumers after a "non-breaking" change is your early warning.

The goal is to make silent breaking changes structurally difficult, not just culturally discouraged.

## The "version 1 forever" trap vs the "version everything" tax

**Version 1 forever:** never versioning, accumulating additive changes until v1 is a fossil record of every decision you ever made. The API becomes unlearnable — 40 optional fields, three ways to do everything, docs that read like archaeology. It "works" but every new consumer pays the complexity tax of your entire history.

**Version everything:** a new major version for every change, so consumers face v7 of an API that's two years old. Each version fragments your telemetry, multiplies your test matrix, and trains consumers to ignore your versions entirely ("we'll just stay on v3, it works").

The healthy middle: additive changes flow continuously on the current version; major versions happen every 12–24 months *or* when genuinely breaking changes accumulate to the point where the migration guide is coherent. A major version should tell a story ("v2: consistent pagination, structured errors, OAuth2-only auth"), not just be a timestamp.

## GraphQL vs REST in practice

GraphQL's pitch — "no versioning needed" — is half true. The additive discipline maps naturally onto GraphQL: add fields and types freely, deprecate fields with the `@deprecated` directive, never remove. What GraphQL doesn't solve:

- **Field removal still breaks consumers.** `@deprecated` is a hint, not a mechanism. You still need telemetry on field usage and a removal timeline.
- **Semantic changes are invisible.** Changing what a field *returns* doesn't show up in the schema diff. Contract tests matter even more here.
- **The version-1-forever trap is worse** in GraphQL because there's no version boundary to force a cleanup. Unused deprecated fields accumulate indefinitely unless someone owns the removal process.

REST forces you to confront versioning explicitly; GraphQL lets you defer it until the schema is a mess. Neither is wrong, but go in with eyes open about which failure mode you're choosing.

## Anti-patterns

- **A major version for every change.** Trains consumers to ignore versions and multiplies your maintenance surface.
- **Silent breaking changes.** The field rename that "nobody uses" — said without telemetry. This is how you lose a weekend.
- **Version in the URL *and* the header.** Two sources of truth, guaranteed to disagree eventually.
- **Deprecation without telemetry.** Announcing a sunset date when you can't measure who's still on the old version is a wish, not a plan.
- **Breaking internal APIs like external ones** (multi-year version support for services you own both ends of) and **breaking external APIs like internal ones** ("just update your client," said to ten thousand strangers).
- **The unversioned "v1" that isn't called v1.** Shipping `/orders` with no version and then bolting on `/v2/orders` later means v1 is implicitly "whatever we shipped first," with no contract about what that was.
- **Versioning the marketing, not the contract.** Bumping to v2 because it sounds like progress, with no breaking changes and no migration story — now you maintain two identical versions.
