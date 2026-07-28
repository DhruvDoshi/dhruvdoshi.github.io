---
title: Zero Trust begins with service identity
author: Dhruv Doshi
date: 2026-11-01
status: scheduled
topic: Platform architecture
categories: [Zero Trust, Identity, Security Architecture]
---

Network location is a weak security identity. A request originating inside a cluster, virtual network, or corporate boundary is not automatically trustworthy. A Zero Trust design evaluates the identity of the caller, the requested action, and the current policy at each meaningful boundary.

## Establish workload identity

Every service needs a non-human identity that can be authenticated and rotated without embedding a long-lived secret. The identity should be tied to workload provenance: namespace, service account, deployment, environment, or another verifiable runtime claim. Transport encryption protects the channel; authenticated identity makes authorization possible.

Use short-lived credentials issued through an automated trust chain. Rotation then becomes routine rather than a risky project. Bind credentials to the intended audience so a token issued for one service cannot be replayed against another.

## Authorize the operation

Authentication answers who is calling. Authorization decides whether that identity may perform this action on this resource under current conditions. Prefer policies expressed in business or platform terms over IP-address lists. Keep default access narrow and make exceptions time-bound and attributable.

The [NIST Zero Trust Architecture](https://csrc.nist.gov/publications/detail/sp/800-207/final) describes access decisions around subjects, assets, resources, and policy rather than implicit network trust. Its model is architectural guidance, not a command to add a particular proxy or vendor.

## Preserve identity across hops

Do not blindly forward an end-user token through every service. Each hop should know both the initiating principal, where required for business authorization, and the immediate workload making the call. Token exchange or a constrained delegated credential can preserve that distinction without granting downstream services the user’s full authority.

Audit records should capture the decision inputs and policy version without leaking credentials. A trace identifier can connect identity decisions to the wider request path.

## Design for failure

Decide whether policy-engine or identity-provider failure fails closed, uses a bounded cache, or permits a narrowly defined degraded mode. The answer depends on the operation’s risk. Test clock skew, certificate expiry, revocation, stale policy, and regional isolation.

Zero Trust is not “authenticate every packet.” It is a system of explicit identities, least-privilege decisions, protected context, and observable enforcement. Network controls still matter, but they become one layer rather than the definition of trust.
