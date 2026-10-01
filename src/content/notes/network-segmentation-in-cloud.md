---
title: "Network segmentation in cloud: VPC design that holds up"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Cloud security
categories: [Security, Cloud, Networking]
---

Cloud networking gives you a green field and a dangerous amount of rope. There is no physical firewall to misconfigure — instead there are security groups, NACLs, route tables, and IAM policies, all versioned in Terraform, all changeable by anyone with the right role. The VPC design that holds up under growth, audit, and incident response is not the cleverest one. It's the boring one: consistent tiers, explicit chokepoints, and defaults that fail closed. This note is about the segmentation decisions that survive contact with a growing engineering organization.

## The goal: blast radius, not walls

**Segmentation is about limiting what a compromise can reach.** The threat model: an attacker (or a bug) gets execution somewhere in your network — a compromised container, a leaked credential, a misconfigured service. Segmentation determines whether that's a contained incident or a flat network where everything is reachable. Every segmentation decision should be traceable to "if this segment is compromised, what can't the attacker reach?"

**Defense in depth, not a single perimeter.** The old model — hard outside, soft inside — dies the moment anything gets inside, which is always. Cloud segmentation assumes breach: the edge is one layer, tier separation is another, workload identity is another. No single layer's failure should be total.

**Segmentation that blocks legitimate work gets routed around.** The number-one killer of network designs: engineers who can't ship because the firewall rules are wrong open holes, build bypasses, or move workloads outside the governed network. A segmentation scheme must be operable by the teams building on it — self-service within guardrails — or it becomes shelfware that everyone circumvents.

## VPC structure: accounts, VPCs, and subnets

**One workload, one account (or the nearest equivalent).** The strongest segmentation boundary in cloud is the account: separate IAM boundary, separate blast radius, separate bill. Production and non-production in the same account is the most common structural mistake — it makes "oops, wrong environment" a data-loss event and forces every policy to be environment-aware. The landing-zone pattern (management account, per-workload or per-team accounts, shared services account) exists because account-level isolation is the only boundary that doesn't depend on getting every rule right.

**VPCs per trust domain, not per microservice.** A VPC per service is unmanageable; one VPC for everything is a flat network. The workable granularity: a VPC per environment per major trust domain — production workloads in one (or a few), shared services (CI/CD, monitoring, artifact registries) in another, data platforms potentially in their own. VPC peering and transit gateways connect them with explicit, auditable paths. The test: can you draw the inter-VPC traffic matrix on one page? If not, you have too many VPCs or too little documentation.

**Subnet tiers: public, private, isolated.** The three-tier subnet layout is standard because it maps to real trust differences:

```
┌─────────────────────────────────────────────────┐
│ VPC 10.0.0.0/16                                 │
│                                                 │
│  Public subnets (10.0.1.0/24, 10.0.2.0/24)      │
│  ── load balancers, NAT gateways only           │
│  ── route to internet gateway                   │
│                                                 │
│  Private subnets (10.0.10.0/24, ...)            │
│  ── application workloads                       │
│  ── route to NAT for egress, no inbound from    │
│     internet                                    │
│                                                 │
│  Isolated subnets (10.0.20.0/24, ...)           │
│  ── databases, sensitive stores                 │
│  ── no route to internet at all                 │
│  ── reachable only from private subnets         │
└─────────────────────────────────────────────────┘
         ▲ AZ-a            ▲ AZ-b            ▲ AZ-c
         (every tier spans ≥2 AZs — single-AZ subnets
          are an availability incident waiting)
```

**Nothing with a public IP except the edge.** Application servers, containers, databases — none of them get public IPs. The only things in public subnets are load balancers and NAT gateways. This single rule eliminates an entire class of "accidentally exposed" incidents. Enforce it with a policy check (config rule / policy-as-code), not with convention.

**IP addressing: plan for growth you can't foresee.** /16 per VPC is the common starting point — 65k addresses sounds generous until secondary CIDRs, EKS pod networking (which can consume IPs voraciously depending on CNI mode), and VPC peering (no overlapping CIDRs, ever) enter the picture. Allocate from a documented supernet plan (e.g., 10.0.0.0/8 carved per environment/domain), never overlap peered networks, and reserve expansion room. Renumbering a VPC in production is effectively impossible — this decision is permanent.

## The tier model in practice

**Public tier: the edge, and only the edge.** Internet-facing load balancers, CDN origins, NAT gateways. Security groups here allow 443 (and 80 for redirect) from the world — nothing else. WAF attaches at this tier for HTTP workloads. The public tier's job is to terminate untrusted traffic and hand clean requests inward.

**Private tier: where applications run.** Inbound only from the public tier's load balancers (referenced by security group, not by CIDR — security-group references survive IP changes) and from designated internal sources. Egress to the internet via NAT for patches, package downloads, and third-party APIs — with the understanding that NAT egress is logged and, for sensitive workloads, filtered.

**Isolated tier: data stores.** Databases, caches, queues — inbound only from the private tier's application security groups, on the specific database port. No internet route. The isolated tier is where the "assume breach" model pays off: even with execution in the private tier, the attacker still faces the database's authentication and the narrow security-group path.

**Egress filtering: the underused control.** Everyone filters inbound; few filter outbound. But data exfiltration and command-and-control both need egress. For sensitive tiers, egress through a controlled path — NAT with domain allowlisting, or a forward proxy for HTTP — turns "attacker got a shell" into "attacker got a shell with no useful network." Start with logging all egress (VPC Flow Logs to a central account), then filter the tiers where the business case is clear.

## Security groups vs NACLs: use each for its job

**Security groups are the primary control.** Stateful (return traffic allowed automatically), attached to workloads, supporting group-to-group references. Write them as "this application tier accepts 5432 from the app tier's security group" — never as broad CIDR ranges when a group reference works. Default-deny: no rule, no traffic. Keep them small and named for their purpose; a security group with 40 rules is a policy nobody can audit.

**NACLs are the coarse backstop.** Stateless (both directions must be allowed explicitly), attached to subnets, evaluated in numbered order. Use them for subnet-level guardrails — "nothing in the isolated tier talks to the internet, period" — not for fine-grained workload policy. NACLs are blunt and hard to reason about at scale; that's fine, because their job is to be the simple rule that catches what the complex rules miss.

**The common misconfiguration pattern:** security groups referencing 0.0.0.0/0 for administrative ports (SSH/RDP open to the world "temporarily"), overly broad egress (all ports to everywhere from every tier), and stale rules for decommissioned services that nobody removes. Audit on a schedule; automate the obvious checks (no 0.0.0.0/0 on sensitive ports, no public IPs outside the edge).

## Chokepoints: transit gateway and inspection

**Transit Gateway for multi-VPC routing.** Once you have more than a couple of VPCs, peering meshes become unmanageable — transit gateway gives you hub-and-spoke with route tables per attachment. The design decision: separate route tables per trust domain (prod attachments can't route to dev, shared-services reachable from all) so the routing itself enforces segmentation. Route tables are policy — review them like policy.

**Inspection at the chokepoint.** Traffic between trust domains passing through the transit gateway can be routed via inspection VPCs (firewall appliances, IDS/IPS) — east-west inspection, not just north-south. This is where you catch lateral movement between segments. It's also where latency and cost concentrate, so scope it: inspect traffic crossing trust boundaries, not traffic within a tier.

**DNS as a control point.** Private hosted zones per VPC, resolver rules for hybrid, and DNS query logging. DNS is both a segmentation tool (private names that don't resolve externally) and a detection tool (exfiltration over DNS, C2 lookups show up in query logs). Route53 Resolver DNS Firewall or equivalents can block known-malicious domains at the resolver — cheap, effective, underused.

## Kubernetes networking: the overlay problem

**Pods are not VMs — the IP math changes.** EKS/GKE pod networking can exhaust VPC IPs fast (each pod consuming a VPC address in the default AWS CNI mode). Plan the CIDR with pod density in mind, or use prefix delegation / secondary CIDRs. This is the most common "we need to renumber" trigger, and it's avoidable with upfront math: nodes × max pods per node × growth factor, per AZ.

**NetworkPolicy is the segmentation inside the cluster.** Without it, every pod can reach every other pod — the cluster is a flat network regardless of your beautiful VPC tiers. Default-deny NetworkPolicy per namespace, explicit allow rules per workload pair. The VPC gets you to the cluster boundary; NetworkPolicy segments within it. Both layers are needed; neither substitutes for the other.

**Egress from the cluster needs the same treatment.** Pods calling third-party APIs, pulling images, reaching managed services — control it with a combination of NetworkPolicy egress rules and VPC-level filtering. The cluster's egress is where crypto-miners and exfiltration live; "pods can reach the internet freely" is the default you should explicitly move away from for production.

**Service mesh as the identity layer.** mTLS between services with workload identity (SPIFFE/SPIRE, or the mesh's native identity) adds authentication and encryption to east-west traffic — complementing network segmentation rather than replacing it. The network says which segments can reach each other; the mesh says which workloads can talk, with cryptographic identity. Together they're the practical implementation of zero-trust networking.

## Private connectivity to managed services

**VPC endpoints keep traffic off the internet.** S3, DynamoDB, ECR, KMS, Secrets Manager — all have VPC endpoints (gateway or interface). Without them, your "isolated" workloads reach these services over the public internet — encrypted, but traversing networks you don't control and visible in ways that surprise auditors. Endpoint policies add a further control: "this endpoint only allows access to our buckets." Use endpoints for every managed service your private workloads touch, and put endpoint policies on the sensitive ones.

**PrivateLink for cross-account and SaaS.** When a SaaS vendor or another account needs to reach your service (or vice versa), PrivateLink exposes it without internet traversal and without VPC peering's CIDR constraints. It's the answer to "the vendor needs access to our API" that doesn't involve allowlisting their NAT IPs in a security group.

## Observability: proving the segmentation works

**VPC Flow Logs, centralized.** Every VPC logs to a central security account with long retention. Flow logs don't show payloads — they show who talked to whom, when, how much. That's enough to detect lateral movement, unexpected cross-tier traffic, and exfiltration-shaped flows. The logs are useless if nobody looks: baseline normal traffic patterns per tier, alert on deviations (isolated tier talking to the internet, prod talking to dev).

**Reachability analysis as a test.** Periodically verify that the segmentation actually holds — automated checks that a workload in tier A cannot reach tier B's ports, that no public IPs exist outside the edge, that NACL backstops are intact. Configuration drift is constant; verification must be continuous.

**The incident-response dividend.** Good segmentation pays off during incidents: compromised segment identified, its network paths enumerated from flow logs, blast radius bounded by design. Run a tabletop: "an attacker has a shell on an app server — what can they reach, and how do we know?" If the answer requires three people and a whiteboard, the segmentation isn't documented well enough.

## Decision checklist

1. **Account structure:** prod and non-prod separated at minimum; per-workload accounts where the blast radius justifies it.
2. **VPC per trust domain;** documented CIDR plan from a supernet, no overlaps on peered networks, room to grow.
3. **Three subnet tiers** (public/private/isolated) across ≥2 AZs; nothing with a public IP except the edge.
4. **Security groups** as the primary control (group references, least privilege); **NACLs** as the coarse backstop.
5. **Egress:** logged everywhere, filtered for sensitive tiers.
6. **Transit gateway** with per-domain route tables once VPC count grows; inspection at trust-boundary crossings.
7. **Kubernetes:** NetworkPolicy default-deny, pod IP math done upfront, cluster egress controlled.
8. **VPC endpoints** with policies for managed services; PrivateLink for cross-boundary service exposure.
9. **Flow logs centralized,** segmentation verified continuously, incident tabletop run.

## Closing

Cloud network segmentation that holds up is boring on purpose: accounts as the hard boundary, three subnet tiers, security groups with group references, NACLs as backstops, endpoints for managed services, NetworkPolicy inside the cluster, and flow logs proving it all works. The clever designs — per-service VPCs, exotic routing, hand-rolled firewalls — collapse under operational load. Boring scales, boring audits cleanly, and boring contains the breach. In networking, boring is the feature.
