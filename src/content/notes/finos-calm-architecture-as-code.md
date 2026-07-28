---
title: FINOS CALM and architecture as code
author: Dhruv Doshi
date: 2026-01-15
reviewed: 2026-07-28
status: published
topic: Platform architecture
categories: [FINOS CALM, Architecture as Code, Governance]
---

Architecture diagrams are useful for communication, but a diagram alone is difficult to validate, compare, or connect to delivery controls. The Common Architecture Language Model—CALM—from FINOS treats architecture as structured, version-controlled data that tooling can validate, render, and govern.

CALM is an open specification rather than a diagram format. Its [official introduction](https://calm.finos.org/introduction/) describes a machine-readable language and toolchain for keeping design intent closer to implementation.

## The core model

A CALM architecture describes several connected concepts:

- **nodes** represent systems, services, databases, networks, actors, or other architectural elements;
- **interfaces** describe interaction points exposed by nodes;
- **relationships** express interaction, connection, deployment, or composition;
- **controls** attach domain requirements and evidence to relevant elements;
- **metadata and decorators** add business, deployment, security, or organisational context;
- **patterns** provide reusable architectural structures and constraints.

The [CALM core concepts](https://calm.finos.org/core-concepts/) define this vocabulary. Stable identifiers are important because relationships, controls, generated views, and external systems must refer to the same element over time.

## From diagram to decision model

A visual line between an application and database may hide the protocol, identity, network boundary, data class, encryption requirement, and ownership. A structured relationship can make those properties explicit. CALM distinguishes interactions, technical connections, deployment, and composition, allowing tools to ask questions that a drawing cannot reliably answer.

For example, a platform can validate that a confidential-data flow uses an approved protocol, terminates at an approved interface, and has the required control configuration. The resulting diagram remains useful, but it becomes a view generated from governed architecture data rather than the only source.

## Patterns and platform recommendations

CALM patterns can define required nodes and relationships without fixing every product choice. An enterprise platform can combine a pattern with a service catalogue:

1. capture workload requirements and constraints;
2. select a compatible architecture pattern;
3. match abstract pattern roles to approved enterprise services;
4. apply controls to nodes and relationships;
5. validate the completed architecture;
6. generate diagrams, documentation, and review evidence.

This model is directly relevant to an Architecture Solution Blueprint platform. CALM can provide a portable representation at the architecture boundary, while the platform supplies organisation-specific recommendations, ownership, certification logic, and workflow.

## Controls need evidence

CALM controls distinguish a requirement from its configuration. A requirement might say that a connection must use an approved encrypted protocol; the configuration records how the architecture satisfies it. The [controls documentation](https://calm.finos.org/core-concepts/controls/) shows how schemas can define and validate this evidence.

Passing schema validation does not prove the deployed system is compliant. A mature implementation links control configuration to infrastructure policy, tests, runtime inventory, or other evidence and detects drift between declared and observed state.

## Adoption sequence

Start with one recurring architecture pattern and a small vocabulary. Map existing platform services to node and interface definitions, encode a few high-value controls, validate in CI, and generate a view that teams already need. Avoid modelling the entire enterprise before proving that the representation improves a real decision.

Version schemas, patterns, and organisational extensions. Provide migration tooling when identifiers or constraints change. Treat exceptions as explicit, time-bound records rather than invalid models stored outside the system.

CALM is most valuable when architecture data participates in delivery: a pull request can validate a change, a platform can recommend compatible services, and governance can review evidence tied to the same model engineers use.
