---
title: "Offline-first mobile architecture: sync, conflicts, and honesty"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Mobile
categories: [Mobile, Architecture, Data Sync]
---

Mobile networks lie. They report full signal in elevators, drop mid-request in parking garages, and throttle aggressively on congested cells. An app designed for reliable connectivity treats these as edge cases; an offline-first app treats connectivity as the edge case and local operation as the norm. The difference shows up exactly where users notice: the field technician in a basement, the traveler on airplane wifi, the commuter in a tunnel. Offline-first isn't a feature — it's an architecture where the local database is the source of truth for reads, mutations apply locally first, and sync is a background reconciliation process. The hard parts are conflict resolution and being honest with the user about state.

## The architecture: local truth, background sync

**The local database is the primary store.** Every read the UI performs comes from a local database (SQLite and its derivatives are the workhorse here — mature, embedded, transactional). The network is not in the read path. This single decision determines everything else: the app works in airplane mode by construction, reads are instant regardless of network, and the UI never shows a spinner for data it already has.

**Mutations apply locally, then sync.** A user edits a record: the app writes to the local database immediately, marks the change as pending sync, and the UI reflects it at once. A background sync process pushes pending changes when connectivity allows and pulls remote changes on its own schedule. The user never waits for the network to see their own action take effect. This is the defining UX property of offline-first: the app feels instant because it is local.

**Sync is a pipeline, not a call.** Think of it as stages: change capture (what mutated locally since last sync), push (send changes, in order, idempotently), pull (fetch remote changes since last sync token), merge (reconcile into the local store), and conflict handling. Each stage needs its own error handling, retry policy, and observability. Teams that implement sync as "a function that uploads and downloads" discover the missing stages as production bugs.

```
  ┌─────────────┐   1. mutate    ┌──────────────┐
  │     UI      │ ─────────────► │ Local SQLite │
  │             │ ◄───────────── │  (source of  │
  └─────────────┘   2. read      │   truth)     │
                                 └──────┬───────┘
                          3. change log │
                                 ┌──────▼───────┐
                                 │ Sync engine  │──► push (idempotent)
                                 │  (background)│◄── pull (since token)
                                 └──────────────┘
```

Verdict: if your reads hit the network, you're not offline-first — you're online with a cache. The local database must be authoritative for the UI.

## Change capture: knowing what to sync

**Operation log over state diff.** The robust approach is an explicit outbox: every local mutation appends an operation record (create/update/delete with the entity, the fields, a client-generated ID, and a sequence number) to a local outbox table in the same transaction as the data change. The sync engine drains the outbox in order. Diffing current state against last-synced state seems simpler but loses intent — it can't distinguish "field set to X" from "field never touched," and it mishandles deletes (a deleted row leaves no state to diff).

**Client-generated IDs everywhere.** Records created offline need IDs before the server exists to assign them. Generate UUIDs client-side for every entity; the server accepts them (with collision handling — treat a duplicate ID as idempotent replay, not an error). Server-assigned integer IDs are incompatible with offline creation — this is a schema decision that must be made before the first offline write, because retrofitting it is a migration across every client in the field.

**Idempotency keys on every pushed operation.** Networks fail mid-push; the client retries; the server must not apply the same operation twice. Each outbox entry carries an idempotency key (its operation ID), and the server dedupes on it. This is the same discipline as idempotent APIs generally, but the retry rate in mobile sync is far higher than in datacenter RPCs — flaky networks make "exactly once" handling load-bearing rather than theoretical.

## Conflict resolution: the actual hard problem

When the same record changes on two devices (or a device and the web) between syncs, someone must decide the outcome. There is no universal right answer — only answers matched to the data's semantics.

**Last-writer-wins (LWW): simple, lossy, often fine.** Each field carries a timestamp (or better, a hybrid logical clock — wall clocks skew across devices); the newest write wins per field. LWW is trivially implementable and correct enough for low-contention data: user preferences, profile fields, anything where concurrent edits are rare and overwrites are acceptable. Its failure mode is silent data loss on genuine conflicts — acceptable when conflicts are rare, dangerous when they're common. Know your contention rate before choosing LWW.

**Field-level over record-level.** Whatever the strategy, resolve at field granularity, not whole-record. Two users editing different fields of the same record should both win. Record-level LWW turns independent edits into conflicts; field-level keeps them independent. This requires the operation log to carry field-level changes — another reason the outbox beats state diffing.

**CRDTs: for high-contention collaborative data.** Conflict-free replicated data types give deterministic merge without coordination: counters, sets, and registers with defined merge semantics that converge regardless of order. They're the right tool for genuinely collaborative editing (shared lists, counters, collaborative text with the right CRDT). The costs are real: larger payloads (operation history or vector metadata), more complex local storage, and a learning curve for the team. Don't reach for CRDTs for a settings screen; do reach for them when users concurrently edit shared data and LWW's silent loss is unacceptable.

**Server-wins / client-wins: for asymmetric authority.** Some data has a natural authority: pricing comes from the server, draft content belongs to the device. Encode the authority explicitly per entity type rather than defaulting everything to LWW. "Server wins for catalog data, LWW for user content" is a policy a team can reason about; a single global strategy is a policy nobody chose.

**Operational transformation is a specialization.** OT (the Google Docs approach) handles collaborative text well but is complex to implement correctly and mostly unnecessary outside real-time co-editing. If you need real-time collaboration, prefer an established library or service over hand-rolled OT — the edge cases in transformation functions are where implementations die.

```typescript
// Sync push handler: idempotent, ordered, per-field merge with LWW fallback
async function pushOperations(ops: OutboxOp[]) {
  for (const op of ops) {
    // Idempotency: server dedupes on operation id
    const result = await api.pushOperation(op, { idempotencyKey: op.id });
    if (result.status === "conflict") {
      await resolveConflict(op, result.serverVersion);
    }
    await outbox.markSynced(op.id);
  }
}

async function resolveConflict(local: OutboxOp, server: EntityVersion) {
  const policy = conflictPolicyFor(local.entityType); // per-entity, configured
  switch (policy) {
    case "field-lww":
      return mergeFields(local.changes, server.fields); // newest per field wins
    case "server-wins":
      return applyServerVersion(server);                // local change preserved in history
    case "manual":
      return queueForUserReview(local, server);         // honesty: ask the human
  }
}
```

## Honesty: the UX of sync state

**Every piece of data should know its sync state, and the UI should show it.** Synced, pending, conflicted — these are first-class states, not error conditions. A note that says "saved" when it's only saved locally is lying; a note that says "saved on this device · syncing" is honest. Users in low-connectivity environments learn to read these indicators the way they read signal bars. Design them deliberately: subtle for the common synced case, visible for pending, unmissable for conflicts.

**Conflicts need a human-readable UI.** When automatic resolution can't apply (or policy says manual), show both versions side by side in plain language: "You changed the due date to Friday on this device; your colleague changed it to Thursday on the web." Offer keep-mine / keep-theirs / merge where merge is meaningful. The conflict UI will be rarely seen and critically important — invest design time proportional to its importance, not its frequency.

**Never lose user data silently.** The cardinal rule: a sync conflict may delay data, reorder it, or ask the user — it must never discard it. Keep conflicted local versions accessible (a "conflicts" view, or version history per record) until explicitly resolved. Data loss destroys trust faster than any other failure; users forgive "I need to pick which version" but not "my work vanished."

**Degrade features gracefully by connectivity.** Some operations genuinely need the network (payments, real-time lookups). Rather than failing opaquely, the app should know its connectivity state and explain: "Payment requires connection — your cart is saved and ready." Queue what can be queued, explain what can't, and never present a network error as an app crash.

## Sync scheduling and resource discipline

**Sync on triggers, not on timers alone.** Push when mutations occur (debounced), pull on app foreground, on push-notification tickle, and on a backoff schedule — not a fixed 30-second poll hammering the battery and the server. Respect OS background execution limits (both major mobile platforms aggressively restrict background work); design the sync engine around short background windows and opportunistic sync during foreground use.

**Delta sync with tokens.** Pull "changes since token X," not full snapshots. The server maintains a change feed per user/scope with monotonically increasing tokens; the client stores its last token. Full re-sync is the recovery path (token invalid, too far behind), not the steady state. Bandwidth on mobile is a user cost — metered connections make wasteful sync a billing event for your user.

**Prioritize by user impact.** Sync order matters: the user's own pending mutations first (their work must be safe), then small high-value pulls (messages, notifications), then bulk data (catalog updates, media). When the background window is short — and it always is — priority order determines what actually completes.

## Security and privacy in the local store

**The local database is a data-at-rest surface.** Encrypt it (SQLCipher and platform equivalents), especially for anything sensitive — health, finance, enterprise data. Device-level encryption helps but isn't sufficient for regulated data; app-level encryption with keys in the platform keystore is the standard. And the outbox deserves the same protection as the data — pending operations can contain the user's most recent, most sensitive actions.

**Remote wipe and deprovisioning.** Enterprise and sensitive consumer apps need a kill path: on account deactivation or device-reported compromise, wipe the local store on next sync (or via push). Design this before it's needed — retrofitting wipe into a sync protocol under incident pressure is how wipes miss the outbox.

**Sync traffic is authenticated and scoped.** The sync endpoint authenticates the device/user and returns only data that principal may see — the sync protocol must enforce the same authorization as the regular API. A sync "give me changes since X" endpoint that skips authorization checks is a bulk-exfiltration API.

## Testing sync: determinism for a nondeterministic world

**Fault injection on the sync path.** Kill the network mid-push, mid-pull, and mid-merge; reorder operations; deliver the same operation twice; skew device clocks; sync two devices against each other with conflicting edits. Each scenario should end in a defined state: no data loss, no duplicate application, conflicts surfaced or resolved per policy. If your test plan doesn't include "airplane mode toggled during push," it's incomplete.

**Multi-device test harness.** Sync bugs manifest across devices, so test across devices: scripted scenarios with two emulators and a server, asserting convergence (both devices eventually show the same resolved state). Convergence testing catches the merge bugs that single-device tests can't see.

**Upgrade and migration testing.** The local schema will evolve; clients in the field run old versions. Test that an old client's outbox syncs correctly after upgrading mid-queue, and that the server tolerates operations from older schema versions. The installed base is part of the system — "everyone upgrades promptly" is not a strategy.

## Anti-patterns

**Online-first with a cache labeled "offline support."** Reads from network with a cache fallback isn't offline-first — it's online with degraded behavior. The failure mode (stale cache, cache-miss spinners, mutations that fail without connectivity) is exactly what offline-first avoids.

**Silent conflict resolution on high-value data.** LWW on a shared financial record, with no conflict surfacing. The data converges; the user's work is gone; nobody knows until the audit.

**Unbounded outbox growth.** A device offline for a month accumulates an outbox the sync engine can't drain in its background window. Cap, compact (coalesce multiple edits to the same field), and age out what policy allows — with user visibility into what's at risk.

**Sync as a foreground blocker.** "Syncing… please wait" on app launch. The entire point of local-first is that the app opens instantly on local data; sync happens behind the UI, not in front of it.

**Assuming the server is always right.** Server-wins as a global default discards offline work whenever clocks or ordering surprise you. Authority should be per-entity and deliberate, not a default born of "the server is the real database" thinking — in offline-first, it isn't.

## Closing

Offline-first is three decisions: the local database is the read authority, mutations apply locally with an explicit operation outbox, and sync is a background pipeline with idempotent push, token-based pull, and per-entity conflict policy. The engineering is in the conflict semantics and the sync discipline; the product work is in honesty — sync-state indicators, human-readable conflict UI, and a guarantee that user data is never silently lost. Build for the basement and the tunnel, and the office wifi becomes the easy case it should have been all along.
