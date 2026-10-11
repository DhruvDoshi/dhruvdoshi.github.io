---
title: "Frontend state management at scale"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Frontend architecture
categories: [Frontend, State Management, Architecture]
---

Every large frontend codebase eventually develops a junk drawer: a global store that holds everything because nothing has a better home. User session next to a modal's open state next to a half-implemented filter cache next to something nobody remembers adding. State management at scale is not about picking a library. It is about deciding what kind of state you have, where each kind belongs, and what to do when someone puts state in the wrong place.

## The real problem

State management discussions almost always start with the wrong question: "Which library should we use?" The library is the least important decision. The important decisions are taxonomy and ownership: what is this piece of state, who is allowed to change it, and where does it live.

Most frontend bugs that get blamed on "state management" are actually one of these:

- **State that should not exist.** Derived data stored as its own state, duplicated from a source of truth somewhere else. Two copies, two update paths, guaranteed divergence.
- **State in the wrong layer.** Server data cached in a global client store, so it goes stale. UI state hoisted to the URL, so the back button does something insane. Form state in a global store, so two instances of the same form corrupt each other.
- **State with unclear ownership.** Three components can write to the same field. Nobody knows which write wins. Race conditions that only reproduce when the network is slow.

A global store does not fix any of these. It makes them easier to share and harder to find.

## The three kinds of state

Before reaching for any tool, classify every piece of state in your app into one of three buckets. This classification does more work than any library choice.

### Server state

Data that lives on the backend: user profiles, lists of orders, search results, permissions. It is fetched, cached, synchronized, and invalidated. It has a lifecycle (loading, fresh, stale, error) and it changes outside your app's control.

Server state belongs in a **server-state cache** — the query-caching layer your data-fetching library provides — not in a global client store. The cache knows how to refetch, dedupe concurrent requests, retry with backoff, and invalidate related entries. If you copy fetched data into a hand-rolled global store, you are reimplementing a cache badly: no stale-while-revalidate, no request dedup, no background refresh, and invalidation that works only for the cases you remembered.

The rule: **fetch it, cache it where the fetcher lives, read from the cache.** Do not mirror it into client state. The moment you have two copies of the same server data, you have a sync problem you did not need.

### Client state

State that exists only in the browser: which modal is open, the current step of a wizard, the contents of an unsaved form, whether the sidebar is collapsed. Nobody else can change it. It dies when the page reloads (or should).

Client state belongs **as close to its consumer as possible**. Component state first. If two components need it, lift it to their nearest common ancestor. Only if it is needed across distant parts of the tree — theme, auth session, feature flags — does it earn a place in a global store.

The question to ask before adding anything to a global store: "Does this need to survive, and be visible to, components that are not related to each other?" If the answer is no, colocate it. Colocation is not a style preference; it is a correctness strategy. State that lives next to its consumer cannot be corrupted by a distant writer, because there are no distant writers.

### URL state

State that should be shareable, bookmarkable, and restorable: the current tab, the search query, the page number, the selected filters, the ID of the thing being viewed. If a user copies the URL and sends it to a colleague, and the colleague does not see the same thing, that state belonged in the URL.

URL state is the most underused and most valuable kind. It is free persistence. It makes the back button work. It makes support tickets debuggable ("just send me the link"). The cost is that it must be serializable and it must have sane defaults for every parameter. The rule of thumb: **if losing it on refresh would feel like a bug to the user, it probably belongs in the URL.**

A common failure: storing filters in component state, then getting a bug report that "the filters reset when I refresh." That is not a bug. That is a design decision you made accidentally. Decide deliberately.

## When a global store pays off — and when it becomes a junk drawer

A global store earns its place when you have genuinely global, long-lived client state: the authenticated session, feature flags, the theme, maybe a notification queue. That is a short list. Most apps need a global store for five to ten things.

It becomes a junk drawer the moment you start storing anything there "just in case" — server data mirrored from the fetch layer, form state from a wizard, the scroll position of a list. Each addition feels harmless. The aggregate is a dependency graph nobody can reason about: changing one field re-renders half the app, and nobody knows which components read what.

Signs your store has become a junk drawer:

- Fields that are written once and read once, by adjacent code. That is a function argument, not global state.
- Server data with hand-rolled `lastFetched` timestamps. That is a cache you wrote yourself, badly.
- State named after UI ("`modalOpen`", "`drawerData`") sitting next to domain state. UI state should die with the UI.
- A selector file that is the most-imported file in the codebase. Everything depends on everything.

The fix is not a better library. It is eviction: move server state back to the fetch layer, move UI state back to the component, move URL state into the router. What remains in the global store should fit on a whiteboard.

## Derived state: the silent killer

Derived state — data computed from other state — should almost never be stored. Filtered lists, counts, formatted strings, "is this form valid": compute them at read time, memoize if expensive, but do not store them alongside their inputs.

```typescript
// Don't do this: two sources of truth
const store = {
  items: [...],
  filteredItems: [...],  // who updates this? when? what if they forget?
  itemCount: 0,          // guaranteed to drift
};

// Do this: one source of truth, derive the rest
const items = useItems();                    // server state, cached by fetcher
const filteredItems = useMemo(
  () => items.filter(matchesQuery(query)),   // derived at read time
  [items, query]
);
const itemCount = filteredItems.length;      // always correct, always
```

Every stored derivative is a sync obligation. At scale — dozens of developers, hundreds of components — sync obligations fail. They fail silently, in edge cases, on the release you did not test. The cost of recomputing a filter is microseconds. The cost of a stale `filteredItems` is a bug report that takes a day to reproduce.

The exception: derivation that is genuinely expensive (large dataset aggregations, complex graph computations). Then memoize aggressively, and make the dependency explicit so invalidation is mechanical, not manual. But measure first. Most "expensive" derivations are not.

## The real cost of normalized caches

Normalized caches — the kind where fetched entities are stored by ID in a flat table and every query result is a list of references — solve a real problem: the same entity appearing in multiple queries, updated in one place, stale in another. If your app has entities that are read and written from many screens (a social feed, a project management tool, an admin console), normalization is worth real money. It makes "update the user's name everywhere" a single write.

But the cost is real too:

- **You now maintain a client-side database.** Cache invalidation, garbage collection of unused entities, handling of partial data — these are database problems, and you have volunteered to solve them in the browser.
- **Debugging gets harder.** The data on screen is three joins away from the network response. When something looks wrong, you are debugging your normalization layer before you debug your app.
- **Write patterns get complicated.** Optimistic updates against a normalized cache require you to know every query that references the entity, so you can update or invalidate all of them. Miss one and you have a UI that contradicts itself.
- **The learning curve is a team tax.** Every developer on the team must understand the cache's mental model to be productive. For a team of thirty, that is a real onboarding cost.

The decision framework: reach for a normalized cache when you have **entities with identity that are mutated from multiple places**. If your app is mostly reads, or mutations happen on one screen, a simpler query cache (keyed by request, not normalized by entity) is cheaper and sufficient. Do not pay the normalization tax for an app that does not have the entity-identity problem.

## Patterns that scale

### Colocation as the default

State lives next to the component that owns it. When two components need to share, lift to the nearest common parent — not to the global store. The global store is the last resort, not the first instinct. Code review should treat a new global-store field the way it treats a new database table: justified, reviewed, and named carefully.

### Unidirectional data flow, enforced by structure

Data flows down, events flow up. This is not just a framework slogan; it is how you keep the write graph legible. When a component deep in the tree can write directly to global state, the write graph is invisible. When writes go through explicit handlers passed as props (or explicit actions with clear intent), you can trace every mutation to its source. At scale, traceability of writes matters more than convenience of writes.

### State machines for complex UI flows

Wizards, checkout flows, multi-step forms, connection-state handling: anything with more than three or four states and guarded transitions deserves an explicit state machine, not a pile of booleans.

```typescript
// Booleans: 2^n possible states, most of them invalid
{ isLoading: true, isError: true, isSubmitting: false }  // what does this mean?

// State machine: the invalid states are unrepresentable
type CheckoutState =
  | { status: 'idle' }
  | { status: 'validating' }
  | { status: 'payment' }
  | { status: 'confirming' }
  | { status: 'done'; orderId: string }
  | { status: 'failed'; reason: string };
```

Booleans compose into states that should not exist. State machines make illegal states unrepresentable, and the transition function becomes the documentation of the flow. For a checkout flow that six teams touch, this is the difference between "we think we handle that case" and "that case cannot happen."

### Separate the write model from the read model

Forms are the classic case. The form's draft state (what the user typed) and the submitted state (what the server accepted) are different things with different lifecycles. Mixing them — validating the draft against server rules on every keystroke, or showing server errors in the draft — produces the janky form behavior everyone hates. Keep the draft local to the form. On submit, hand it to the server-state layer and let the cache update. The form should not know about the cache, and the cache should not know about the form.

## Anti-patterns: what goes wrong

**The store as a message bus.** Components write to the store to signal other components ("set `refreshTrigger` to force a refetch"). This is eventing through a database. Use actual events, callbacks, or the fetcher's invalidation API. A store field whose only purpose is to be watched is a hack with a subscription.

**Prop drilling panic.** A developer hits three levels of prop drilling, panics, and moves the state to the global store. Prop drilling through three levels is fine. It is explicit, traceable, and cheap. The global store is not the cure for mild inconvenience; if drilling gets genuinely painful (eight levels, many consumers), that is a component-structure problem — extract a provider at the right level, not the root.

**Syncing state across tabs by hand.** Two tabs, one store each, now divergent. If cross-tab consistency matters (auth session, feature flags), use the platform: storage events, broadcast channels, or a shared worker. Do not build a sync protocol on top of your state library.

**Storing promises or non-serializable objects in state.** State should be data. Promises, class instances, and DOM references in the store make time-travel debugging, persistence, and server rendering all subtly broken. Keep the store serializable and you keep your options open.

## How to start: what good looks like

If you are staring at an existing junk drawer, do not rewrite it. Evict one category at a time:

1. **Audit the store.** List every field. For each one, label it: server state, client state, URL state, derived state. Be honest. Most junk drawers are 60%+ server state and derived state that should not be there.
2. **Move server state first.** Route fetches through a proper query-caching layer and delete the mirrored copies. This is usually the biggest win and the lowest risk, because the fetch layer already handles the lifecycle.
3. **Delete derived state.** Replace stored derivatives with memoized computations. If a test breaks, the test was asserting on the sync bug. Fix the test.
4. **Move URL state to the router.** Filters, tabs, pagination, selected IDs. Every parameter moved is a shareable link earned.
5. **What remains is your real global store.** It should be small enough to fit on a whiteboard: session, flags, theme, notifications. Guard it in code review.

What good looks like: a new developer can answer "where does this piece of state live?" by asking "what kind of state is it?" — not by grepping the codebase. The store is small, boring, and rarely in the diff. Server data flows through the fetch layer, UI state dies with its component, the URL is the source of truth for anything shareable, and derived values are computed, never stored. That is state management at scale: not a library, but a taxonomy everyone on the team shares.
