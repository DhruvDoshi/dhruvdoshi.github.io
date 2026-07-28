---
title: Build portable boundaries, not lowest-common-denominator clouds
author: Dhruv Doshi
date: 2024-02-01
reviewed: 2026-07-28
status: published
topic: Cloud architecture
categories: [Multi Cloud, Portability, Architecture]
---

Multi-cloud strategies often begin with a desire to avoid lock-in and end with a platform that hides every useful provider capability. Portability is more effective when it is applied to selected business and operational boundaries rather than demanded equally from every component.

## Name the reason

Different goals require different architectures: regulatory placement, acquisition integration, customer proximity, resilience to a provider-scale event, commercial leverage, or access to a specialised service. “Use multiple clouds” is an implementation constraint, not an outcome.

For each workload, state whether it must run active-active, be recoverable on another provider, move within a defined period, or simply avoid proprietary data formats. These are materially different promises with different costs.

## Separate portable and provider-specific layers

Keep domain logic, API contracts, event schemas, identity abstractions, telemetry, and deployment metadata independent where doing so preserves real option value. Encapsulate provider-specific services behind owned interfaces when an alternative is plausible and the switching value justifies the cost.

Do not recreate a managed database, queue, or identity service solely to make two providers look identical. The abstraction itself becomes a platform with reliability, security, and support obligations.

The [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html) and [Google Cloud Architecture Framework](https://cloud.google.com/architecture/framework) both emphasise explicit trade-offs across reliability, security, operations, performance, and cost. A multi-cloud decision should be evaluated against the same concerns, not treated as an automatic resilience improvement.

## Test the option

Portability that is never exercised decays. Pin open formats and protocol versions, rebuild environments from source, restore representative data, and run dependency-loss exercises. Measure the time, manual steps, data loss, and degraded functions involved.

Identity, DNS, keys, CI, observability, and source control can remain hidden single points of failure even when compute exists in two providers. Draw the complete control and data planes.

## Price the continuing cost

Account for duplicate skills, networking, security controls, vendor management, observability, data transfer, and slower adoption of native capabilities. Compare this recurring cost with the quantified risk or option the design addresses.

Good portability protects a specific exit or recovery path. It does not pretend cloud platforms are interchangeable.

## Classify the portability requirement

There are several useful levels. **Data portability** means information can be exported in a documented format. **Build portability** means infrastructure and applications can be recreated elsewhere. **Operational portability** means teams can monitor, secure, and recover the workload in the alternate environment. **Traffic portability** means production demand can actually move within a stated objective. Each level requires more continuing investment.

Name the recovery point and recovery time for any cross-cloud failover claim. If data replication is asynchronous, quantify acceptable loss. If the alternate environment is cold, include quota approval, image availability, DNS change, certificate issuance, and cache warming in the recovery test.

## Preserve identity and data semantics

Use stable internal identities and map them to provider-specific roles at the boundary. Avoid copying long-lived credentials between clouds. Keep data formats explicit, but account for database behavior, collation, consistency, extensions, and operational tooling—not only whether both systems speak SQL.

Egress cost and replication lag are architectural constraints. A design that constantly moves large datasets to preserve theoretical choice may cost more and fail more often than a documented restore path.

## Make provider use intentional

Maintain a decision record for each provider-specific service. State the capability gained, the coupling introduced, the exit mechanism, and when that exit is worth testing. Some workloads should embrace a managed native service because its operational value exceeds switching value.

## Review checklist

Verify the business reason, required portability level, dependency map, identity model, data-copy behavior, DNS and certificate path, observability in both environments, capacity reservation, cost, skills, and tested recovery evidence. If the organisation has never exercised the alternate path, describe it as a plan—not as achieved resilience.
