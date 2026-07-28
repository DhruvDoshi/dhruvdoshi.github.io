---
title: Pattern matching algorithms for architecture recommendations
author: Dhruv Doshi
date: 2026-03-15
reviewed: 2026-07-28
status: published
topic: Platform architecture
categories: [Algorithms, Pattern Matching, Recommendation Systems, Architecture]
---

An architecture recommendation platform must translate incomplete requirements into a small set of compatible patterns and services while explaining why each result fits. This is not ordinary text search. It is constrained pattern matching over structured facts, rules, relationships, and evidence.

## Represent the problem

Model a request as typed features rather than one free-text string. Useful dimensions include workload type, interaction style, data classification, region, availability objective, recovery objective, throughput, latency, integration protocol, identity model, deployment boundary, and approved exceptions.

Represent each candidate pattern with:

- required features that must match;
- prohibited conditions that disqualify it;
- optional capabilities that improve fit;
- compatible component roles and service implementations;
- controls and evidence the completed blueprint must satisfy;
- lifecycle, ownership, and version metadata.

Missing input should remain unknown rather than becoming false. A recommendation engine that treats “not provided” as “not required” can select an unsafe pattern.

## Filter before scoring

Use hard constraints first. Remove candidates that violate data residency, security classification, protocol, lifecycle, availability, or organisational policy. This reduces the search space and prevents a high soft score from overpowering a mandatory control.

Then calculate a fit score for surviving candidates. A simple weighted model can be expressed as:

`score(pattern) = Σ weight(feature) × match(feature, pattern) − penalties`

Match functions can be exact, hierarchical, numeric-range, set-overlap, or relationship-aware. Availability tiers may use ordered comparison; regions use set membership; capabilities may use taxonomy distance; topology rules need graph matching.

## Match graphs, not only attributes

Architecture patterns contain relationships: a public client reaches a gateway, the gateway authenticates through an identity provider, a service writes to a classified data store, and telemetry leaves through an approved route. A candidate component can satisfy its local attributes yet create an invalid combination.

Represent the requested blueprint and pattern as graphs. Match node roles and relationship types, then validate edge constraints such as protocol, trust boundary, direction, and permitted deployment. Full subgraph isomorphism can be expensive, but enterprise patterns usually have typed nodes and small bounded graphs; domain-specific pruning makes matching practical.

## Produce an explanation trace

Every recommendation should preserve:

- matched requirements;
- disqualifying rules applied to rejected candidates;
- score contribution by feature;
- assumptions caused by missing data;
- control evidence still required;
- pattern and catalogue versions used.

This trace supports review, debugging, and challenge. It also allows platform owners to see whether a surprising result came from input, taxonomy, weight, rule, or stale service metadata.

## Validate with cases and counterexamples

Build a test corpus of approved architectures, invalid combinations, boundary conditions, and historical exceptions. Test that the expected pattern appears, prohibited options never appear, ranking remains stable after unrelated changes, and every result has a complete explanation.

Measure top-k recall, invalid-recommendation rate, reviewer acceptance, override reasons, and change between engine versions. Human overrides should feed taxonomy and rule review rather than train an opaque score automatically.

For an Architecture Solution Blueprint platform, the algorithm should make architectural judgment repeatable without pretending it is purely mathematical. Constraints protect mandatory boundaries, scoring orders credible choices, graph validation checks the assembled design, and explanations keep the decision accountable.
