const guides = [
  {
    slug: 'platform-architecture',
    title: 'Platform architecture: from standards to a usable product',
    description: 'A practical guide to turning architecture standards into paved roads, reusable contracts, and measurable platform outcomes.',
    published: '2026-07-28',
    reviewed: '2026-07-28',
    readTime: 7,
    topics: ['Platform architecture', 'Staff engineering'],
    relatedNotes: [
      'finos-calm-and-architecture-as-code',
      'pattern-matching-algorithms-for-architecture-recommendations',
      'what-is-cloud-computing',
      'infrastructure-as-a-service-iaas',
      'platform-as-a-service-paas',
      'serverless-computing-and-function-as-a-service',
    ],
    body: `Platform architecture is useful when it reduces the work required to make a safe, operable decision. A standards document can describe the right answer, but a platform turns that answer into something engineers can discover, adopt, and verify.

This guide describes the operating model behind that shift. It draws on the same platform, governance, and architecture-automation themes documented in the [selected work](/projects/) and [experience](/resume/) pages.

## Start with decisions, not technology lists

A platform should encode decisions that repeat across teams: how a service authenticates, where telemetry goes, which deployment patterns are supported, and what evidence a review needs. Begin by identifying the decisions that create the most delay or production risk.

For each decision, record:

- the context in which it applies;
- the approved options and their constraints;
- the evidence required to select an option;
- the owner and review date;
- the exception path when the standard does not fit.

This produces a decision model rather than a catalogue. Technologies can change while the underlying decision remains stable.

## Define a small platform contract

Every paved road needs a contract between its maintainers and consumers. A useful contract covers inputs, outputs, operational expectations, ownership, and lifecycle state. It should answer what the platform guarantees, what a consuming team must provide, and what happens when either side changes.

The contract can be expressed through schemas, templates, policy checks, service APIs, or infrastructure modules. The form matters less than whether it is versioned, testable, and visible at the point of use.

## Separate policy from implementation

Policy explains the required outcome. Implementation provides one supported way to achieve it. Keeping the two separate allows a platform to evolve without weakening governance.

For example, a policy may require encrypted service-to-service identity, auditable authorization, and credential rotation. One implementation might use a particular identity provider and gateway. A second implementation can satisfy the same policy if it produces equivalent evidence.

## Build feedback into the path

Adoption is not proof that a platform is working. Track whether it reduces lead time, review effort, duplicated integration work, and operational variance. Combine quantitative signals with direct feedback from teams using the platform.

Useful signals include:

- time from a design request to an approved decision;
- percentage of changes handled by an established pattern;
- exception volume and repeated exception causes;
- support requests per adopting team;
- production incidents connected to missing or misunderstood standards.

## Treat exceptions as product discovery

An exception is not automatically a governance failure. It may reveal a missing capability, an outdated constraint, or a genuinely different workload. Review exceptions as a set, not only as individual approvals. Repeated exceptions should lead to a new supported pattern, a clearer boundary, or retirement of an ineffective rule.

## Keep the platform legible

The strongest platform architectures are explainable without internal knowledge. Publish the decision model, ownership, lifecycle, and escape hatch. Link implementation assets directly from the relevant decision. Give every pattern a stable URL so design reviews, code changes, and incident reports can refer to the same source.

The older notes on [cloud computing](/notes/what-is-cloud-computing/), [IaaS](/notes/infrastructure-as-a-service-iaas/), [PaaS](/notes/platform-as-a-service-paas/), and [serverless computing](/notes/serverless-computing-and-function-as-a-service/) provide the service-model background. The platform model above is the layer that makes those choices repeatable inside an engineering organisation.

## Sources and further reading

- [CNCF Platform Engineering Technical Community Group](https://tag-app-delivery.cncf.io/whitepapers/platforms/)
- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [Architecture Decision Records](https://adr.github.io/)
`,
  },
  {
    slug: 'observability-systems',
    title: 'Observability systems: design the telemetry path before the dashboard',
    description: 'A systems guide to telemetry contracts, collection, routing, storage boundaries, and operational feedback at scale.',
    published: '2026-07-28',
    reviewed: '2026-07-28',
    readTime: 7,
    topics: ['Observability', 'Platform architecture'],
    relatedNotes: [
      'opentelemetry-pipeline-architecture-for-vendor-neutral-observability',
      'microsoft-365-audit-data-in-an-opentelemetry-pipeline',
      'aws-support-for-opentelemetry-with-adot-and-cloudwatch',
      'splunk-support-for-opentelemetry-collection-and-otlp',
      'datadog-support-for-opentelemetry-and-otlp-ingestion',
      'dynatrace-support-for-opentelemetry-and-native-otlp',
      'elastic-support-for-opentelemetry-and-managed-otlp-ingestion',
      'what-is-cloud-computing',
      'distributed-cloud',
      'multi-cloud-architecture',
      'serverless-computing-and-function-as-a-service',
    ],
    body: `Observability is a data system before it is a set of dashboards. The critical design work happens in the path between a workload producing a signal and an operator using that signal to make a decision.

This guide connects the vendor-neutral telemetry architecture described in [selected work](/projects/#observability-platform) with reusable design principles for logs, metrics, and traces.

## Begin with operational questions

Instrumentation should answer a known question: is a service meeting its objective, where is latency introduced, which dependency failed, or what changed before an incident? Collecting data without a decision in mind creates cost without reliable diagnostic value.

Define service objectives, failure modes, and investigation paths first. From those, derive the signals, dimensions, retention, and access requirements.

## Use a telemetry contract

A telemetry contract makes data consistent across teams and tools. At minimum, define:

- service and deployment identity;
- environment and ownership attributes;
- trace and request correlation fields;
- event severity and error semantics;
- privacy classification and redaction requirements;
- schema version and compatibility rules.

OpenTelemetry provides vendor-neutral APIs, semantic conventions, and a collector model. It does not remove the need for organisational conventions; it gives those conventions a portable foundation.

## Separate collection, routing, and storage

Treat the telemetry path as distinct stages. Collection receives and normalises data near the workload. Routing applies policy, enrichment, sampling, and destination selection. Storage and analysis systems serve different operational and retention needs.

This separation reduces vendor coupling. A team can change an analysis destination without rebuilding every application integration. It also creates clear control points for regional handling, cost limits, and security policy.

## Design for pressure and partial failure

Telemetry volume often rises during the incident that operators most need to understand. The path therefore needs explicit behaviour for backpressure, buffering, retries, sampling, and data loss. Document which signals are durable, which can be sampled, and how operators detect a degraded pipeline.

Monitor the observability system itself: queue depth, dropped records, processing latency, cardinality growth, export failures, and configuration drift are first-class service indicators.

## Control cardinality and cost at the source

Unbounded identifiers in metric labels can make a monitoring system expensive or unstable. Define approved dimensions and move high-cardinality detail into logs or traces when appropriate. Apply retention and sampling according to the value and sensitivity of the signal rather than using one policy for all telemetry.

## Make ownership visible

Every service and telemetry schema needs an owner. An operator should be able to move from an alert to the responsible team, current runbook, recent deployments, and relevant service objectives without searching across disconnected systems.

The related notes on [distributed cloud](/notes/distributed-cloud/), [multi-cloud architecture](/notes/multi-cloud-architecture/), and [serverless computing](/notes/serverless-computing-and-function-as-a-service/) describe deployment models that make a portable telemetry contract especially valuable.

## Sources and further reading

- [OpenTelemetry documentation](https://opentelemetry.io/docs/)
- [OpenTelemetry semantic conventions](https://opentelemetry.io/docs/specs/semconv/)
- [Google SRE workbook: monitoring](https://sre.google/workbook/monitoring/)
`,
  },
  {
    slug: 'ai-governance',
    title: 'AI governance for software systems: controls that fit delivery',
    description: 'A delivery-focused guide to AI inventories, risk boundaries, evaluation, human oversight, and operational evidence.',
    published: '2026-07-28',
    reviewed: '2026-07-28',
    readTime: 8,
    topics: ['AI governance', 'Staff engineering'],
    relatedNotes: [
      'production-rag-requires-retrieval-evidence-and-control',
      'introduction-to-artificial-intelligence-history-and-evolution',
      'the-fundamentals-of-machine-learning',
      'deep-learning-explained-from-basics-to-advanced',
    ],
    body: `AI governance becomes useful when it changes how a system is designed, evaluated, released, and monitored. A policy that sits outside delivery creates paperwork; an engineering control creates evidence at the same point a team makes a decision.

This guide focuses on applied AI and language-model systems. It complements the foundational notes on [artificial intelligence](/notes/introduction-to-artificial-intelligence-history-and-evolution/), [machine learning](/notes/the-fundamentals-of-machine-learning/), and [deep learning](/notes/deep-learning-explained-from-basics-to-advanced/).

## Establish the system boundary

Begin with an inventory entry that describes the complete system, not only the model. Record the user, intended decision, model and data providers, retrieval sources, tools, human checkpoints, outputs, and downstream actions. Assign accountable technical and business owners.

The boundary should make dependencies visible. A retrieval index, prompt template, policy filter, and external API can each change system behaviour even when the underlying model does not change.

## Classify consequences before selecting controls

Risk depends on how output is used. A drafting assistant with mandatory human review has a different consequence profile from a system that can change access, move money, or communicate externally without review.

Classify the system according to impact, reversibility, affected users, data sensitivity, autonomy, and exposure. Use that classification to determine evaluation depth, approval requirements, monitoring, and fallback behaviour.

## Turn requirements into testable controls

Translate principles into checks a delivery pipeline or reviewer can verify. Examples include:

- approved model and data-provider versions;
- documented data lineage and retention;
- prompt-injection and data-exfiltration tests;
- quality thresholds for defined task sets;
- access controls for tools and retrieval sources;
- human confirmation before consequential actions;
- immutable records of configuration, evaluations, and approvals.

Controls should identify their evidence. A statement such as “the system is fair” is not a control. A defined evaluation dataset, metric, threshold, owner, and review cadence is.

## Evaluate the system, not just the model

Test representative end-to-end tasks, including refusal, uncertainty, retrieval failure, malformed inputs, conflicting instructions, and unavailable dependencies. Include regression cases drawn from production failures and near misses.

For generative systems, separate factuality, relevance, instruction following, safety, latency, and cost. A single aggregate score can hide a failure that matters to users.

## Limit authority by default

Use the least privilege required for tools, data, and actions. Prefer read-only access, scoped credentials, explicit allowlists, bounded execution, and user confirmation for irreversible operations. Treat model output as untrusted input at every integration boundary.

## Monitor change over time

Models, prompts, retrieval content, and external services change. Record the deployed configuration, watch for quality and safety drift, and define when a change requires re-evaluation. Provide a clear shutdown or fallback path when the system moves outside approved limits.

## Sources and further reading

- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [NIST Generative AI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence)
- [OWASP Top 10 for LLM applications](https://genai.owasp.org/llm-top-10/)
`,
  },
  {
    slug: 'cloud-migration',
    title: 'Cloud migration: sequence decisions, not just workloads',
    description: 'A practical guide to cloud migration boundaries, dependency mapping, landing zones, observability, cutovers, and exit criteria.',
    published: '2026-07-28',
    reviewed: '2026-07-28',
    readTime: 8,
    topics: ['Cloud architecture', 'Platform architecture'],
    relatedNotes: [
      'what-is-cloud-computing',
      'hybrid-cloud',
      'multi-cloud-architecture',
      'private-cloud',
      'public-cloud',
      'downtime-with-cloud-computing',
    ],
    body: `A cloud migration is a sequence of operating-model decisions expressed through workload moves. Moving infrastructure without changing ownership, delivery, security, and observability usually relocates existing constraints rather than removing them.

The cloud archive on this site covers [public](/notes/public-cloud/), [private](/notes/private-cloud/), [hybrid](/notes/hybrid-cloud/), and [multi-cloud](/notes/multi-cloud-architecture/) models. This guide focuses on how to decide and execute a migration across those choices.

## Define the outcome and boundary

State what the migration must improve: delivery lead time, resilience, regional reach, capacity, security controls, or operating cost. Set measurable acceptance criteria and constraints. A migration defined only as “move to cloud” cannot make trade-offs consistently.

Choose a boundary that can be owned and tested. A business capability or service boundary is usually more useful than a list of virtual machines because it includes data, dependencies, operations, and users.

## Build a dependency map

Inventory runtime calls, data flows, identity dependencies, batch jobs, operational tooling, network paths, and organisational owners. Confirm the map with telemetry and operators rather than relying only on configuration records.

Classify dependencies by latency sensitivity, data sensitivity, availability requirement, and ease of change. This shows which workloads can move independently and which need a coordinated transition.

## Establish the landing zone as a product

A landing zone should provide reusable identity, network, logging, policy, encryption, deployment, and cost-management capabilities. Version these capabilities and give teams a supported adoption path.

Validate the landing zone with a representative workload before scaling migration waves. The first workload should exercise important controls without carrying the organisation’s highest operational risk.

## Select a migration treatment deliberately

For each workload, decide whether to retire, retain, replace, rehost, replatform, or redesign it. The right treatment follows the desired outcome and constraints. Rehosting can reduce data-centre dependency quickly; redesign can improve elasticity or operability but introduces more change and validation work.

Record the decision, expected benefit, required evidence, rollback path, and owner. Revisit it when dependency information changes.

## Make observability available before cutover

Operators need comparable signals on both sides of a transition. Establish service objectives, logs, metrics, traces, ownership, and alert routing before production traffic moves. Test failure modes, capacity limits, backup restoration, and access recovery.

The note on [cloud downtime](/notes/downtime-with-cloud-computing/) is a reminder that provider infrastructure does not remove the need for explicit resilience and recovery design.

## Use explicit cutover and exit criteria

Define traffic steps, data synchronization, freeze windows, rollback triggers, decision owners, and communication paths. After cutover, remove obsolete infrastructure, credentials, routes, and monitoring. A migration is incomplete while two environments remain operational without a deliberate reason.

## Sources and further reading

- [AWS migration guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/large-migration-guide/welcome.html)
- [Google Cloud migration framework](https://cloud.google.com/architecture/migration-to-google-cloud-getting-started)
- [Microsoft Cloud Adoption Framework](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/)
`,
  },
  {
    slug: 'staff-engineering-practice',
    title: 'Staff engineering practice: create leverage through clear systems',
    description: 'A practical guide to technical direction, decision records, cross-team delivery, mentoring, and operational credibility.',
    published: '2026-07-28',
    reviewed: '2026-07-28',
    readTime: 7,
    topics: ['Staff engineering', 'Platform architecture'],
    relatedNotes: [
      'what-is-cloud-computing',
      'what-if-we-combine-blockchain-and-cloud-computing',
      'the-fundamentals-of-machine-learning',
    ],
    body: `Staff engineering is the practice of increasing the quality and pace of decisions beyond one person’s individual output. The work still requires technical depth, but its value comes from making a wider system easier to understand, change, and operate.

This guide reflects the working principles and delivery patterns documented across the [about](/about/), [experience](/resume/), and [selected work](/projects/) pages.

## Find the constraint that spans teams

The highest-leverage problem is often between ownership boundaries: an integration repeated by every team, an approval with no shared evidence, an operational signal nobody owns, or a platform capability that exists but is difficult to adopt.

Frame the problem in observable terms. Identify who experiences it, how often it occurs, what it delays or risks, and which constraints are real. This prevents a broad technical programme from becoming a collection of unrelated improvements.

## Write the decision before scaling the implementation

Use short decision records to capture context, options, trade-offs, consequences, and ownership. A decision record is valuable when someone outside the original conversation can understand why the system is shaped a certain way.

Keep decision status visible. Supersede outdated records rather than silently editing history. Link decisions to implementation, operational evidence, and follow-up work.

## Build a thin end-to-end path

For platform or architecture work, prove one complete path before generalising. Include the interface, policy, deployment, telemetry, support model, and documentation. A thin vertical slice exposes organisational and operational gaps that a component-only prototype misses.

Use the first implementation to refine contracts and boundaries. Standardise only after the team has evidence that the path works.

## Make reviews produce reusable knowledge

A review should improve the current change and the system around it. When the same issue appears repeatedly, turn the feedback into a test, template, documented pattern, or platform capability. This reduces dependence on the reviewer and gives teams faster feedback.

## Keep leadership close to production

Technical direction needs contact with code, telemetry, incidents, and user feedback. Review critical changes, trace failures across boundaries, and understand the cost of operating the proposed design. This keeps architecture grounded in what teams can build and support.

## Grow ownership rather than collecting it

Delegate complete decisions with context, constraints, and success criteria. Create opportunities for engineers to lead design reviews, incident analysis, and cross-team delivery. Offer feedback that explains the reasoning, not only the preferred answer.

The goal is a system that continues to make good decisions without routing every question through one staff engineer.

## Communicate at the decision level

Different audiences need different detail, but the underlying facts should stay consistent. Explain the problem, constraints, options, decision, evidence, and next checkpoint. Avoid presenting implementation activity as an outcome.

## Sources and further reading

- [Architecture Decision Records](https://adr.github.io/)
- [Google SRE resources](https://sre.google/resources/)
- [Team Topologies](https://teamtopologies.com/key-concepts)
`,
  },
];

const findGuide = (slug) => guides.find((guide) => guide.slug === slug);

export { findGuide, guides };
