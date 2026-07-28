---
title: Choose Kubernetes tenancy boundaries deliberately
author: Dhruv Doshi
date: 2023-08-01
status: published
topic: Cloud architecture
categories: [Kubernetes, Multi Tenancy, Platform Engineering]
---

Kubernetes can host many teams and workloads, but a namespace is not automatically a complete security, reliability, or cost boundary. Tenancy design should begin with the risks that must be isolated and the operations the platform team can sustain.

## Decide what a tenant is

A tenant may be a product team, application, business unit, customer, or environment. Each definition creates different requirements. Ask whether tenants trust one another, run privileged workloads, share compliance obligations, need independent upgrade schedules, or can consume a shared failure budget.

The [Kubernetes multi-tenancy documentation](https://kubernetes.io/docs/concepts/security/multi-tenancy/) distinguishes soft and hard isolation and explains the trade-offs between namespace and cluster boundaries. Use that as a model, not a promise that one control provides isolation by itself.

## Layer namespace controls

For trusted internal teams, namespaces can be an efficient boundary when combined with:

- role-based access scoped to the namespace;
- default-deny network policies and explicit ingress and egress;
- resource requests, limits, quotas, and priority policy;
- pod security controls and restricted workload privileges;
- separate service accounts and workload identities;
- policy that prevents unsafe host access and cross-namespace references.

Control-plane objects outside namespaces require special attention. Cluster roles, custom resources, admission configuration, storage classes, and shared operators can cross tenant boundaries.

## Use clusters for stronger isolation

Separate clusters reduce some shared blast radius and enable independent lifecycle or regulatory controls, but add cost and operational surface. Cluster separation is appropriate when workloads are mutually untrusted, require conflicting control-plane configuration, or cannot share an outage domain. It still does not remove shared cloud-account, identity, network, or supply-chain risks.

## Make capacity and failure visible

Noisy-neighbor protection requires more than CPU limits. Consider memory pressure, ephemeral storage, API-server load, admission latency, IP space, persistent-volume throughput, and shared dependencies. Track usage and cost by tenant with a documented allocation model.

Test isolation with failure exercises: exhausted quotas, compromised credentials, a broken operator, a network-policy regression, and a cluster upgrade. Record which layer contained the event.

The right tenancy model is rarely “one cluster” or “one cluster per team” everywhere. It is a small set of documented patterns matched to trust, failure, compliance, and operational boundaries.
