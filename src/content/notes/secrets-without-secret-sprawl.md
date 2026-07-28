---
title: Manage secrets without creating secret sprawl
author: Dhruv Doshi
date: 2023-06-01
reviewed: 2026-07-28
status: published
topic: Platform architecture
categories: [Secrets Management, IAM, Security]
---

Secret management is not solved by moving passwords from source code into a central vault. The larger goal is to reduce the number, lifetime, reach, and human handling of credentials across the system.

## Remove secrets where possible

Prefer workload identity, managed identities, and short-lived federation over static access keys. A credential that can be derived at runtime from an authenticated workload does not need to be copied into CI, configuration, local machines, and deployment tooling.

For the secrets that remain, maintain an inventory with owner, purpose, consumers, environment, rotation method, expiry, and recovery procedure. Unknown ownership is itself a security finding.

## Control the lifecycle

A sound lifecycle covers creation, distribution, use, rotation, revocation, and deletion. Generate values through approved tooling; never ask a person to paste a production secret through chat or a ticket. Deliver secrets directly to the workload where the runtime supports it, and keep plaintext out of build artifacts and environment dumps.

The [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) provides practical guidance across storage, rotation, auditing, and CI/CD use. Apply it according to the threat model rather than treating a vault as a universal control.

## Design rotation before issuance

Rotation fails when applications assume one credential is valid forever. Support overlapping versions, reload without a full outage where practical, and verify the new credential before revoking the old one. Automate routine rotation and alert on values nearing expiry.

Emergency rotation is different. Document how to identify affected consumers, revoke quickly, limit blast radius, and restore service. Practice it with a non-production credential.

## Prevent accidental disclosure

Scan source, history, container layers, logs, telemetry attributes, and generated artifacts. A scanner finding is not safely resolved by deleting the current line; assume exposed credentials are compromised, rotate them, then clean history where necessary.

Audit access to the secret store and alert on unusual retrieval, but protect audit logs from containing the values themselves. Separate administrative access from application retrieval.

The most mature secret-management program has fewer secrets each quarter. Central storage is useful; eliminating long-lived credentials is better.

## Classify before choosing storage

Not every sensitive value has the same lifecycle. Database credentials, signing keys, third-party API keys, encryption keys, and user recovery codes need different controls. Record whether a value can be rotated automatically, whether old versions must decrypt historical data, whether use must occur inside a hardware boundary, and what happens when the value is unavailable.

Encryption keys deserve particular separation. Envelope encryption keeps data-encryption keys close to data while a key-encryption key remains in a managed key service. Applications should receive permission to perform required cryptographic operations rather than export root key material.

## Deliver at runtime

Prefer identity-based retrieval into memory or a protected runtime volume. Environment variables are convenient but may appear in process inspection, crash reports, debugging tools, or accidental configuration output. If a platform injects files, define ownership, permissions, refresh behavior, and deletion on termination.

CI should exchange its trusted workload identity for a short-lived deployment credential. Repository secrets are still needed for some vendors, but scope them to one environment, prevent access from untrusted pull requests, and rotate them without editing workflow source.

## Respond to exposure

When a secret is disclosed, first revoke or rotate it; repository cleanup comes later. Identify every system where the value was valid, inspect its use during the exposure window, and verify that dependent applications have loaded the replacement. Preserve incident evidence without copying the secret into more systems.

## Control checklist

For every remaining secret, require a named owner, least-privilege scope, automated distribution, rotation procedure, maximum lifetime, access audit, exposure response, and deletion condition. Report secrets without owners, credentials older than policy, workloads retrieving unusually large numbers of values, and applications still using superseded versions.
