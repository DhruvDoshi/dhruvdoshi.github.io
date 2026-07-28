---
title: Manage secrets without creating secret sprawl
author: Dhruv Doshi
date: 2026-11-16
status: scheduled
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
