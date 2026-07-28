---
title: Treat Terraform modules as versioned interfaces
author: Dhruv Doshi
date: 2026-12-16
status: scheduled
topic: Platform architecture
categories: [Terraform, Infrastructure as Code, Platform Engineering]
---

A reusable Terraform module is an internal product interface. Its inputs, outputs, defaults, provider constraints, state behavior, and upgrade path affect every stack that consumes it. Copying resources into a module does not make them maintainable.

## Design around a capability

Create modules around stable capabilities such as a production-ready object store or service runtime, not around every individual provider resource. Expose the choices consumers genuinely need and keep security, tagging, encryption, logging, and lifecycle defaults inside the module.

Avoid a single module with dozens of flags that can produce unrelated architectures. A smaller opinionated interface is easier to test and evolve. Where teams need a materially different pattern, publish a separate module or composition.

HashiCorp’s [module development guidance](https://developer.hashicorp.com/terraform/language/modules/develop) describes the expected structure and composition model. The engineering challenge is choosing the boundary that remains meaningful as provider resources change.

## Make changes compatible

Use semantic versions and pin released module versions in consumers. A default change can be breaking even if Terraform accepts the configuration. Renamed resources can force destructive replacement unless state moves are declared. Changed outputs can break downstream stacks and automation.

Every release should state:

- behavioral changes and migration steps;
- minimum Terraform and provider versions;
- state moves or import requirements;
- expected plan impact;
- deprecation timelines.

Test upgrades from supported previous versions, not only clean creation. A module that passes from an empty state can still destroy an existing resource during migration.

## Validate the contract

Static validation and formatting are the baseline. Add policy checks, example configurations, integration tests in isolated accounts, and plan assertions for critical properties. Verify encryption, network exposure, identity permissions, logging, backup, and deletion protection.

Keep provider configuration at the composition root so consumers control credentials and regions. Do not hide cross-account assumptions inside a reusable child module.

## Observe adoption and exceptions

Maintain ownership, support expectations, and a registry of supported versions. Measure upgrade lag, recurring overrides, failed plans, and exception requests. Repeated exceptions often indicate the interface is missing a legitimate use case.

Good modules compress organisational knowledge into a safe, reviewable contract. Their value is not fewer lines of Terraform; it is consistent infrastructure behavior with a credible migration path.
