---
title: Use the strangler pattern for controlled cloud migration
author: Dhruv Doshi
date: 2027-01-01
status: scheduled
topic: Cloud architecture
categories: [Cloud Migration, Modernization, Architecture]
---

Large migrations fail when “move the system” is treated as one indivisible project. The strangler pattern reduces risk by placing a controlled boundary around the existing system and moving capabilities incrementally while production continues to operate.

## Find a business seam

Start with a capability that has a clear owner, manageable data dependencies, and a measurable user outcome. A low-value component is not always the safest pilot if it teaches nothing about identity, data, traffic, and operations. Choose a slice representative enough to validate the migration platform without putting the entire business at risk.

Document the current request paths, data ownership, batch jobs, operational procedures, and hidden integrations. Migration plans are often defeated by an unrecorded report, shared table, or manual recovery step rather than by compute provisioning.

## Introduce a routing boundary

Use an API gateway, facade, event route, DNS layer, or application adapter to direct selected traffic to the new capability. The boundary must support gradual exposure, rollback, and observability. Avoid duplicating business logic inside the router.

The migration should make ownership clearer. If both old and new systems can update the same record indefinitely, the architecture has created distributed ambiguity rather than decomposition.

## Move data deliberately

Choose a source of truth for each phase. Options include one-time migration with a cutover, change-data capture, event replication, or temporary dual writes. Dual writes require reconciliation because partial failure is unavoidable. Define how lag, ordering, deletion, and correction are handled.

AWS’s [migration guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/strangler-fig.html) describes the routing and incremental replacement pattern. The same principle applies beyond one cloud provider: isolate change, preserve reversibility, and retire the old path in measured steps.

## Set exit criteria

Each slice needs functional parity, performance and reliability evidence, security review, support readiness, cost visibility, and a tested rollback. After cutover, remove obsolete routes, jobs, credentials, data copies, and monitoring. A migration is not complete while the old operating burden remains.

Incremental modernization is not slow by definition. It creates frequent proof, exposes dependencies early, and lets teams stop or redirect before a single high-risk cutover consumes the whole program.
