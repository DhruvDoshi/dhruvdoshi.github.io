---
title: "GraphQL vs REST, honestly"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Distributed systems
categories: [APIs, Distributed Systems, Architecture]
---

The GraphQL-versus-REST debate has generated more heat than almost any other API argument, and most of it is misplaced. They are not competitors for the same job. GraphQL is a query language and runtime for client-driven data aggregation with a typed contract. REST is an architectural style built on HTTP semantics with caching, uniform interfaces, and simplicity as its strengths. The right question is never "which is better" — it is "what is the client trying to do, and what operational costs am I willing to pay?"

This note gives the honest version: where each wins, the operational costs of GraphQL that its advocates understate, the places REST quietly wins, and how to decide — including the underrated option of running both.

## The real problem

API design arguments go wrong because teams compare the technologies instead of comparing the *problems*. The actual problems:

1. **Client-driven aggregation.** A frontend needs data from five services to render one screen. With REST, that is five round trips (or a bespoke aggregation endpoint per screen — the dreaded BFF sprawl). With GraphQL, it is one query shaped exactly like the UI needs.
2. **Over-fetching and under-fetching.** REST endpoints return fixed shapes; clients get too much (waste) or too little (more round trips). Mobile clients on bad networks feel this acutely.
3. **Contract evolution.** REST versioning (`/v1/`, `/v2/`) is a blunt instrument. GraphQL's field-level deprecation is finer-grained. Both require discipline; neither is automatic.
4. **Operational simplicity.** Caching, rate limiting, observability, debugging — the entire HTTP ecosystem (CDNs, caches, proxies, `curl`) works with REST out of the box and needs adaptation for GraphQL.

Notice that problems 1–3 favor GraphQL and problem 4 favors REST. Most real systems have all four problems simultaneously, which is why the honest answer is usually "it depends on the surface" rather than a single winner.

## Where GraphQL genuinely wins

**Client-driven aggregation across service boundaries.** This is the killer use case and it is not close. Consider a product page that needs the product catalog service, the pricing service, the inventory service, the reviews service, and the recommendations service. The GraphQL version:

```graphql
query ProductPage($id: ID!) {
  product(id: $id) {
    name
    description
    price { amount currency }
    inventory { availableCount estimatedShipDate }
    reviews(first: 5) {
      edges { node { rating title author { displayName } } }
    }
    recommendations(first: 4) {
      edges { node { id name price { amount } } }
    }
  }
}
```

One round trip, exactly the fields the UI needs, typed end to end. The REST equivalent is either five requests (latency, especially on mobile) or a bespoke `/product-page` aggregation endpoint that becomes a dumping ground — every screen gets its own endpoint, each one a slightly different join, each one owned by nobody. Anyone who has maintained a fleet of BFF endpoints knows this pain. GraphQL replaces N bespoke aggregation endpoints with one typed schema and a resolver layer.

**Typed contracts with introspection.** The schema is a machine-readable contract. Codegen produces typed clients (TypeScript types from the schema — no hand-written DTOs drifting from reality). API explorers (GraphiQL and friends) make the API self-documenting in a way REST rarely achieves in practice, whatever the OpenAPI spec promises. For teams where frontend and backend evolve at different speeds, this contract is genuinely valuable.

**Field-level evolution.** Deprecating a single field (`@deprecated(reason: "Use priceV2")`) while the rest of the schema marches on is finer-grained than REST versioning. Clients migrate field by field instead of endpoint by endpoint. This only works with discipline — deprecated fields must actually be removed on a schedule, or the schema accumulates cruft — but the mechanism is better than the alternative.

**Where this matters most:** consumer-facing products with complex UIs, mobile clients, multiple frontend teams consuming the same backend, and organizations doing backend-for-frontend aggregation across many services. If your clients are constantly asking for "just one more field on this endpoint" or "a new endpoint that joins X and Y," GraphQL is probably the right call.

## Where REST genuinely wins

**Caching — the big one.** REST rides on HTTP semantics: GETs are cacheable by URL, CDNs cache them, browsers cache them, `Cache-Control` and ETags work out of the box. GraphQL's typical POST-to-`/graphql` with a query body in the payload defeats all of this by default. You *can* do GraphQL over GET with query hashing, and you *can* build normalized client caches (Apollo Client's normalized cache is genuinely good), but you are rebuilding what REST gets for free. For read-heavy, cache-friendly workloads — content APIs, public data, anything behind a CDN — this alone can decide it.

**Simplicity and debuggability.** A REST endpoint is a URL you can `curl`, paste into a browser, and reason about. Status codes mean things (404, 429, 503 — the whole ecosystem understands them). GraphQL returns 200 with an `errors` array, which means your alerting, your API gateway, your WAF, and your on-call runbooks all need GraphQL-aware logic. Every layer of the operational stack needs to learn a new trick. That is a real cost, paid forever.

**File uploads, streaming, and HTTP-native features.** REST maps naturally onto multipart uploads, range requests, server-sent events, and status-code-driven flows. GraphQL can do all of these (multipart upload spec, `@stream`/`@defer` directives, subscriptions over WebSocket) but each one is an extension, a library, a thing to operate — not a native feature.

**Rate limiting that makes sense.** REST rate limits per endpoint per key — simple, explainable, enforceable at the edge. GraphQL rate limiting requires *query complexity analysis* (see below), because one query can be trivial and the next can be a denial-of-service. Edge enforcement of GraphQL complexity is a project, not a config line.

**Where this matters most:** public APIs consumed by third parties, cache-heavy read workloads, simple CRUD services, webhooks and event-driven integrations, and any team without the appetite to operate a GraphQL gateway. If your API is "resources with CRUD and some search," REST is not the boring choice — it is the correct choice.

## The operational costs people forget

This is the section GraphQL advocates skip. If you adopt GraphQL, you are signing up for all of the following, permanently:

**1. Query complexity and depth limiting.** A GraphQL query is a program the client sends your server to execute. Without limits, a client can request deeply nested data (`friends { friends { friends { ... } } }`) that fans out into thousands of database queries. You need:
- Query depth limits (reject queries nested beyond N levels)
- Query complexity scoring (assign costs to fields, reject or throttle expensive queries)
- Persisted queries for production clients (more below)

```typescript
// The shape of complexity protection — not optional in production
const server = new ApolloServer({
  validationRules: [
    depthLimit(10),
    createComplexityLimitRule(1000, {
      // cost model: scalars cheap, connections expensive
      scalarCost: 1,
      objectCost: 10,
      listFactor: 20,
    }),
  ],
  persistedQueries: {
    // production clients may ONLY use pre-registered query hashes
    allowUnused: false,
  },
});
```

**2. The N+1 problem, as an operational concern.** GraphQL resolvers naturally produce N+1 queries (fetch a list, then fetch each item's relation). DataLoader-style batching is the standard fix, and it works — but it is a thing every backend engineer must understand, it complicates caching (batch keys vs. individual keys), and getting it wrong means your GraphQL layer is a database-load multiplier. In REST, the endpoint author controls the query plan; in GraphQL, the client shapes it, and the server must defend itself.

**3. Persisted queries (the thing that makes GraphQL safe at scale).** The mature pattern: clients in production may only execute pre-registered queries by hash. This kills entire classes of abuse (arbitrary query shapes, introspection-based probing), enables edge caching by hash, and makes the query inventory auditable. But it adds a build step (extract and register queries at deploy time), a client-side build integration, and a failure mode (deploys where client and server query registries disagree). It is worth it. It is also work.

**4. Gateway ownership.** In a microservices world, GraphQL usually means a gateway (federation, schema stitching, or a BFF-style gateway) that composes subgraphs. Somebody owns that gateway: its deployment, its performance, its error handling, its versioning policy across subgraphs. Federation (Apollo Federation and equivalents) distributes schema ownership to teams while centralizing the gateway — a good model, but the gateway team becomes a platform team with all the resourcing that implies. An unowned gateway becomes the most fragile component in the system because every request flows through it.

**5. Observability re-thinking.** "Which queries are slow?" is a harder question than "which endpoints are slow" because query shapes vary infinitely. You need query-signature grouping (normalize queries by stripping literals), per-resolver tracing (OpenTelemetry spans per resolver, not just per request), and error attribution that distinguishes client errors (bad query) from server errors (resolver threw). All doable. All work.

**6. Schema governance.** A shared schema is a shared API surface across teams, which means you need a process for schema changes: breaking-change detection in CI (tools exist — use them), a deprecation policy with teeth, and someone who can say no to a bad field addition. Without governance, the schema becomes the same dumping ground the BFF endpoints were.

Honest summary of the cost: **GraphQL moves complexity from the client-server contract negotiation (many bespoke endpoints) into the gateway and its operations (complexity limits, persisted queries, resolver performance, schema governance).** That is often a good trade! But it is a trade, not a savings.

## Decision framework

```
Choose GraphQL when:
  ✓ Multiple frontend clients need different shapes of the same data
  ✓ Screens aggregate data from many backend services
  ✓ Mobile clients where round trips and payload size matter
  ✓ Frontend and backend teams evolve at different speeds
  ✓ You can staff gateway ownership + schema governance
  ✓ You will implement persisted queries + complexity limits from day one

Choose REST when:
  ✓ Read-heavy, cache-friendly workloads (CDN caching matters)
  ✓ Public/third-party APIs (simplicity and HTTP semantics win)
  ✓ Simple CRUD services with stable shapes
  ✓ File uploads, streaming, webhooks, HTTP-native features dominate
  ✓ The team cannot staff gateway operations
  ✓ Edge rate limiting and WAF integration must be trivial

Choose BOTH when:
  ✓ Internal product surfaces need aggregation (GraphQL gateway)
    AND public/third-party APIs need stability (versioned REST)
  — This is extremely common and completely fine. The gateway can
    sit in front of the same services the REST API exposes.
```

The "both" option deserves emphasis because teams treat it as indecisive. It is not. **A GraphQL gateway for your own frontends plus versioned REST for third parties** is the architecture of a large fraction of serious API platforms. The services underneath do not care. The gateway composes; the REST API exposes. Each surface is optimized for its consumers.

## Patterns that work

**Federation for multi-team backends.** Each team owns a subgraph (its domain's types and resolvers); the gateway composes them into one schema. Teams deploy independently; the gateway handles composition. The governance requirement: a schema review process for cross-subgraph changes, and breaking-change detection in every subgraph's CI.

**Persisted queries from day one.** Do not "add them later when you need them." Later never comes until the incident. Extract queries at build time, register on deploy, enforce in production. Your future on-call self will thank you.

**Resolver performance budgets.** Every resolver gets an OpenTelemetry span; dashboards track p99 per resolver, not just per query. Set budgets: no resolver without a DataLoader (or equivalent batching) touches the database in a list context. Make this a code-review rule, not a suggestion.

**REST for the seams, GraphQL for the surface.** Services talk to each other over REST or async events (Kafka, queues); the GraphQL gateway sits at the edge composing for clients. Service-to-service GraphQL is usually a mistake — you pay the gateway costs without the client-aggregation benefit.

## Anti-patterns

- **GraphQL as a database proxy.** Exposing the raw data model 1:1 through GraphQL, with resolvers that are thin wrappers over table scans. You have built a queryable database with extra steps and none of the access control. The schema should be a *product* surface, designed for clients — not a mirror of your tables.
- **No complexity limits in production.** Shipping a GraphQL endpoint without depth/complexity limits is shipping a self-inflicted DDoS endpoint. This is not an optimization; it is a launch requirement.
- **The mega-schema without governance.** One schema, twenty teams, no review process. Fields get added for one screen and can never be removed. Within two years the schema is unmaintainable and everyone is afraid to touch it. Schema governance is not bureaucracy; it is the thing that keeps the asset valuable.
- **REST endpoints that are RPC in disguise.** `POST /getUserData`, `GET /doComplexThing?params=...` — if your REST API ignores HTTP semantics (wrong verbs, everything a POST, status codes unused), you have the worst of both worlds: none of REST's caching and tooling benefits, none of GraphQL's typing and aggregation. Either do REST properly or use GraphQL.
- **Versioning GraphQL like REST.** Creating `/graphql/v2` defeats the entire field-level evolution model. If you are versioning the whole schema, you have misunderstood the tool — use the deprecation mechanism or admit you wanted REST.
- **Subscriptions for everything.** GraphQL subscriptions (over WebSocket) are the right tool for genuinely live data. They are the wrong tool for "refresh every 30 seconds" — that is polling, and polling over REST is simpler, more cacheable, and easier to operate. Reserve subscriptions for actual real-time needs.

## How to start / what good looks like

**Starting with GraphQL (for the aggregation use case):**

1. Stand up the gateway in front of *existing* REST services — resolvers call your current endpoints. Do not rewrite backends; compose them.
2. Implement persisted queries, depth limits, and complexity scoring before the first production client ships. Non-negotiable.
3. Instrument per-resolver OpenTelemetry spans from day one. You cannot manage resolver performance you cannot see.
4. Establish schema governance early: breaking-change detection in CI, a deprecation policy (e.g., deprecated fields removed after two quarters with client migration tracking), and a named schema steward.
5. Migrate one high-value screen first (the one with the worst BFF-sprawl or the most round trips). Prove the value, then expand.

**Starting with REST (done properly):**

1. Design around resources and HTTP semantics: correct verbs, meaningful status codes, `ETag`/`Cache-Control` on reads, pagination on every list (cursor-based for large datasets).
2. Write an OpenAPI spec and generate clients from it — the "REST has no typing" complaint is a tooling complaint, and codegen solves it.
3. Version with the least blunt instrument that works: additive changes without versioning, `/v2/` only for genuinely breaking changes, with a published deprecation timeline.
4. Put the CDN in front of read-heavy endpoints from the start. This is REST's superpower; use it.

What good looks like, either way: clients get exactly the data they need with minimal round trips; the API surface is documented, typed, and governed; operational dashboards show per-operation performance; breaking changes are rare, announced, and scheduled; and nobody on the team can remember the last time the API choice itself was the problem — because the choice matched the workload.

---

*More API and distributed systems notes at https://doshidhruv.com — including API versioning strategy, BFF patterns, and event-driven design.*
