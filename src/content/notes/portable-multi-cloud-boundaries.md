---
title: Build portable boundaries, not lowest-common-denominator clouds
author: Dhruv Doshi
date: 2027-01-16
status: scheduled
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
