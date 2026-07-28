---
title: Design the platform as a product
author: Dhruv Doshi
date: 2026-07-28
status: published
topic: Platform architecture
categories: [Platform Engineering, Developer Experience, Architecture]
---

An internal platform is successful when product teams choose it because it removes work, not because governance forces them to use it. That changes the architecture question from “what infrastructure should we standardise?” to “what recurring developer problem should we solve?”

## Start with a user journey

Map the path from an idea to a production service. A useful first version usually covers a small number of high-friction steps: creating a repository, obtaining an environment, deploying safely, observing the service, and requesting support. Record how long each step takes, where approvals wait, and where teams build their own workaround.

The platform boundary should follow those repeated problems. A portal without reliable deployment primitives is a catalogue, not a platform. A collection of Terraform modules without documentation, support, and versioning is a library, not a product.

## Define a contract, not a golden cage

A paved road should make the safe path fast while preserving an explicit escape hatch. Define:

- the interface a team consumes;
- the security and operational controls supplied by default;
- the responsibilities that remain with the service team;
- the supported lifecycle and migration policy;
- the process for capabilities the platform does not cover.

This contract matters more than the implementation. It allows the platform team to replace an underlying tool without surprising its users.

## Measure outcomes

Adoption alone is weak evidence. A platform can have mandatory adoption and still create expensive friction. Combine quantitative signals—lead time, deployment frequency, failed changes, environment provisioning time, support volume—with interviews and workflow observation. The [DORA research program](https://dora.dev/research/) provides a useful starting point for delivery measures, while the [CNCF platform engineering white paper](https://tag-app-delivery.cncf.io/whitepapers/platforms/) frames platforms as products serving internal users.

Track the cost transferred to product teams as carefully as the cost removed from the platform team. If a standard reduces central effort but adds manual work to every service owner, it is not leverage.

## Keep the first promise narrow

Begin with one well-understood service archetype and make its path excellent. Publish ownership, service levels, known constraints, and a roadmap tied to user evidence. Expand only when the first path is reliable enough that teams recommend it to one another.

A good platform does not hide engineering decisions. It packages the common ones, makes exceptional ones visible, and gives teams a dependable path from code to operation.
