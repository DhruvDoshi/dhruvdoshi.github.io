---
title: "Envelope encryption and KMS design for application teams"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Cloud security
categories: [Security, Cloud, Encryption]
---

Every application team eventually faces the same requirement: encrypt sensitive data, manage the keys properly, rotate them, and prove it to an auditor. The naive approaches — a key in an environment variable, AES with a hardcoded key in the repo, "the database handles it" — all fail the moment someone asks how the key is rotated or who can read it. Envelope encryption with a proper KMS is the standard answer, and it's simpler than its reputation. What's hard is the design around it: key hierarchy, rotation, access control, and the failure modes nobody tests.

## Why envelope encryption

**The problem it solves: data keys at scale.** You could encrypt everything with one master key from the KMS — but then every encrypt/decrypt operation is a KMS API call (latency, cost, rate limits, availability coupling), and rotating that key means re-encrypting everything. Envelope encryption splits the problem: a data encryption key (DEK) encrypts the actual data locally, and the KMS encrypts (wraps) the DEK with a key encryption key (KEK). The encrypted DEK travels with the data; the KEK never leaves the KMS.

**The properties this buys.** Local encryption with the DEK is fast — no network call per record. The KEK stays in hardware-backed KMS storage, never exposed. Rotation becomes cheap: rotate the KEK and re-wrap DEKs (no data re-encryption), or rotate DEKs per record/period without touching the KEK. Compromise scope is bounded: a leaked DEK exposes one record or one batch, not the dataset.

**The hierarchy, concretely:**

```
KMS (KEK — never leaves the KMS, hardware-backed)
  │
  │  GenerateDataKey / Decrypt (the only two calls you need)
  ▼
DEK (per record, per file, per tenant — random 256-bit key)
  │
  │  AES-256-GCM encrypt locally
  ▼
ciphertext + encrypted DEK (stored together)
```

Decrypt reverses it: call KMS Decrypt on the encrypted DEK, get the plaintext DEK, decrypt locally, discard the plaintext DEK from memory. The plaintext DEK exists only in memory, only briefly. That discipline — never persisting plaintext keys — is the whole security model.

## The KMS calls you actually need

**GenerateDataKey and Decrypt cover nearly everything.** `GenerateDataKey` returns a plaintext DEK plus its encrypted form — one call per encryption. `Decrypt` unwraps an encrypted DEK — one call per decryption. That's the API surface for most application encryption. Resist the urge to use the KMS for direct data encryption (`Encrypt`/`Decrypt` on payloads): it works for small values, but it couples every operation to KMS latency and quotas, and it's the wrong tool once volume grows.

**Encryption context is authentication for your keys.** KMS lets you bind key-value pairs (tenant ID, purpose, environment) into the encryption operation; decryption requires the same context. This is cryptographic binding between the key use and its intended context — a DEK encrypted for tenant A cannot be decrypted in tenant B's context even by someone with KMS access. Use it always: `{"tenant": "acme", "purpose": "pii", "env": "prod"}`. It's free, and it's the difference between "someone with decrypt permission can decrypt everything" and per-tenant cryptographic isolation.

**Key policies are the access control — design them first.** Who can use the key for encryption, who for decryption, who can administer it: these are IAM policies on the KMS key, evaluated independently of the data's own access controls. The common failure is over-broad decrypt grants — "the application role can decrypt" where the application role is shared across services that shouldn't see each other's data. Scope decrypt grants to the specific service identities that need them, per key, and treat a decrypt grant as equivalent to read access on the underlying data — because it is.

## Key hierarchy design

**One KEK per trust boundary.** The granularity decision: per environment at minimum (prod keys never touch non-prod), per data classification (PII keys separate from general), per tenant for multi-tenant systems where tenant isolation is a contractual or regulatory requirement. Each additional key is operational overhead (rotation, monitoring, policy); each missing boundary is a blast-radius problem. The right number is "the boundaries your auditors and contracts actually require, plus environment separation" — not one key for everything, not one key per microservice.

**DEK granularity: per record vs per batch vs per tenant.** Per-record DEKs give the smallest compromise scope and the simplest rotation story (new records get new DEKs; old records re-encrypt lazily or on access) at the cost of one GenerateDataKey call per write. Per-file or per-batch DEKs amortize the KMS call — right for bulk pipelines writing thousands of records. Per-tenant DEKs (one DEK per tenant, wrapped by the tenant's KEK) give clean tenant offboarding: delete the tenant's KEK and their data is cryptographically shredded — but DEK rotation for a tenant means re-encrypting their data. Match the granularity to the lifecycle: crypto-shredding requirements push toward per-tenant; high-volume writes push toward per-batch.

**Crypto-shredding is a feature, not a hack.** Deleting a KEK renders everything under it permanently unreadable — the fastest, most complete data deletion available. For tenant offboarding and GDPR-style erasure, design for it deliberately: per-tenant KEKs, DEKs wrapped under them, and a documented, tested key-deletion procedure. The caveat: it only works if no plaintext copies exist anywhere — backups, caches, logs, replicas. Crypto-shredding without a plaintext-copy inventory is theater.

## Rotation: the part teams postpone

**KEK rotation is cheap — automate it annually.** KMS key rotation (automatic rotation in AWS KMS, manual rotation with versioning elsewhere) generates a new key version; old DEKs wrapped under old versions still decrypt. No data re-encryption needed. There's no reason not to automate this on a schedule — annual is the common standard, driven more by audit expectations than by cryptographic necessity.

**DEK rotation is where the real work is.** Rotating DEKs means re-encrypting data — which needs a re-encryption job, a dual-read period (try new DEK, fall back to old), and verification. Design for it: store a key version/ID alongside each encrypted DEK so the reader knows which DEK to unwrap, and make the reader handle multiple active versions. The teams that postpone this discover during a suspected compromise that "rotate the keys" is a multi-week project, not an afternoon.

**Rotation without re-encryption is partial.** Re-wrapping DEKs under a new KEK protects against KEK compromise but doesn't help if the DEK itself leaked. Know which threat each rotation addresses: KEK rotation for KMS-side concerns (personnel changes, policy), DEK re-encryption for data-side concerns (suspected exposure). Say which one you mean in the runbook.

**Test rotation before you need it.** A rotation procedure exercised for the first time during a suspected compromise will fail — the re-encryption job has a bug, the dual-read path was never tested, the monitoring doesn't cover it. Run rotation as a drill on a non-critical key scope first.

## Where encryption happens: application vs storage layer

**Server-side encryption (SSE) on the storage is table stakes, not the answer.** S3 SSE, EBS encryption, RDS encryption-at-rest — enable all of it, always. But SSE protects against physical media theft and satisfies the checkbox; it does not protect against anyone with legitimate storage access — a compromised application credential, an over-broad IAM role, a curious admin. The threat model "attacker has our AWS credentials" is exactly the scenario where SSE provides zero protection and application-layer envelope encryption provides real protection.

**Application-layer encryption is for the threats SSE doesn't cover.** Encrypt in the application before the data reaches the database, the queue, the object store. Now the database admin, the backup system, and the log aggregator all see ciphertext. The cost: the application owns key management, encrypted fields can't be queried (no `WHERE` on ciphertext, no sorting, no partial matching), and every data access path must handle decryption.

**The queryability trade-off is the central tension.** Encrypted columns are opaque to the database. Design around it: keep searchable attributes (IDs, timestamps, coarse categories) in plaintext, encrypt the sensitive payload; or use deterministic encryption for exact-match lookups (same plaintext → same ciphertext, enabling equality queries at the cost of revealing equality patterns — acceptable for some fields, dangerous for low-entropy ones like SSNs); or use tokenization/vaulting for fields that need lookup (store the sensitive value in a vault, reference by token). There is no general solution — each sensitive field gets a deliberate choice, documented with its threat model.

**Field-level vs record-level vs file-level.** Field-level (encrypt specific columns/attributes) preserves queryability on the rest and minimizes the encrypted surface — the right default for databases. Record-level (encrypt the whole row/document) is simpler to reason about but kills all querying. File-level (encrypt whole Parquet files, backups, exports) suits bulk data and is where per-file DEKs shine. Match the level to the access pattern.

## TLS is not encryption at rest (and other confusions)

**In transit, at rest, in use — three different problems.** TLS covers transit. SSE covers rest-against-physical-theft. Application-layer envelope encryption covers rest-against-credential-compromise. Confusing them produces the audit finding "data encrypted at rest: yes (SSE)" alongside the actual exposure. Name the threat model for each layer in the design doc.

**Hashing is not encryption.** Passwords get Argon2/bcrypt, not AES — and never reversible encryption. This still needs saying because every year someone encrypts passwords "so we can recover them," which is exactly the vulnerability.

**Don't build your own crypto.** Use AES-256-GCM (or ChaCha20-Poly1305 where AES hardware support is absent) via a vetted library — never hand-rolled modes, never ECB, never CBC without authentication. The KMS handles the key management; your job is to call the primitives correctly: random IVs/nonces per encryption, authenticated modes always, constant-time comparison where applicable. Crypto agility (the ability to change algorithms) matters less than crypto correctness.

## Operational reality

**KMS availability is now in your critical path.** Every decryption is a KMS call (or a cached DEK — see below). KMS regional outages are rare but real; design for them: DEK caching with bounded TTL (cache plaintext DEKs in memory for minutes, not hours — a compromise-window trade-off), graceful degradation policy (fail closed for sensitive reads, with a documented exception path), and multi-region keys where the business requires it. The caching decision deserves explicit thought: longer cache = fewer KMS calls and more resilience, but a wider window where a rotated/revoked key still works.

**Quotas and cost are real at scale.** KMS API quotas (thousands of requests per second, varies by region) become a ceiling for high-throughput decryption — another reason for DEK caching. Cost is per API call plus per key-month: trivial for most workloads, noticeable at millions of calls per day. Both are solved by the same caching, sized deliberately.

**Audit logging is the point of using KMS.** Every KMS call is logged to CloudTrail (or equivalent) — who decrypted what, when, under which key. This is the audit trail that justifies the whole architecture: "show me every decryption of PII keys in the last 90 days" is answerable. Protect those logs (separate account, immutability) and alert on anomalous patterns — decrypt volume spikes, decrypt calls from unexpected identities, key policy changes.

**Monitor:** KMS API error rates and throttling, decrypt call volume per key (unexpected spikes), key rotation status and age, failed decryption attempts (application errors that might indicate key/policy misconfiguration), and encryption-context mismatches.

## Secrets vs keys: the boundary

**KMS is for data encryption keys, not for application secrets.** Database passwords, API tokens, TLS certificates belong in a secrets manager (Secrets Manager, Parameter Store, Vault) — which handles rotation, versioning, and injection into workloads. Don't store secrets as KMS-encrypted blobs in your own table; don't use the secrets manager as a KMS. The boundary: secrets authenticate the application to other systems; KMS keys protect data. They have different lifecycles, different access patterns, and different rotation stories.

## Decision checklist

1. **Threat model per data class:** what does application-layer encryption protect against that SSE doesn't? Name it.
2. **KEK boundaries:** per environment minimum; per classification and per tenant where contracts/regulations require.
3. **DEK granularity:** per-record, per-batch, or per-tenant — matched to write volume and lifecycle (crypto-shredding needs per-tenant KEKs).
4. **Encryption context:** always set; binds key use to tenant/purpose/environment.
5. **Queryability plan:** which fields stay plaintext, which get deterministic encryption, which get tokenized — per sensitive field, documented.
6. **Rotation:** automated KEK rotation on schedule; DEK re-encryption path designed, versioned, and drill-tested.
7. **Resilience:** DEK caching policy, KMS-outage degradation behavior, multi-region where required.
8. **Audit:** CloudTrail logging protected and alerted; key policies scoped to least privilege.

## Closing

Envelope encryption is one of those rare patterns that's both the textbook answer and the practical answer: two KMS calls, a well-chosen hierarchy, and discipline about plaintext key lifetimes. The engineering is in everything around it — key boundaries that match real trust boundaries, rotation you can actually execute, a queryability plan that doesn't pretend encrypted columns are searchable, and audit logging that makes the whole thing provable. Get the design right and encryption becomes boring infrastructure. Get it wrong and it's a hardcoded key in a repo waiting for its incident.
