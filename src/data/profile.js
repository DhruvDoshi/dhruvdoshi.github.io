const profile = {
  name: 'Dhruv Doshi',
  role: 'Staff Software Developer & Enterprise Architect',
  location: 'Toronto, Canada',
  email: 'work@doshidhruv.com',
  summary: 'I build the infrastructure, controls, and platforms that make AI and distributed systems dependable in production.',
  introduction: 'My work sits where AI systems, distributed platforms, observability, and enterprise architecture meet. I stay close to the code and build the infrastructure, controls, and platforms that turn complex technical ideas into dependable production systems.',
  availability: 'Open to Staff, Senior Staff, Principal, and MTS conversations across AI systems, distributed platforms, and observability.',
  consulting: 'I also work selectively with teams on AI platform architecture, secure agent systems, and high-scale observability.',
};

const impact = [
  {
    value: '1,000+',
    label: 'architecture patterns mapped into a production recommendation platform',
  },
  {
    value: '150 TB/day',
    label: 'institutional log volume designed for vendor-neutral routing',
  },
  {
    value: '10,000+',
    label: 'systems covered by a shared observability architecture',
  },
  {
    value: '20+ teams',
    label: 'enabled through OpenTelemetry schemas and onboarding standards',
  },
];

const caseStudies = [
  {
    slug: 'architecture-blueprints',
    eyebrow: 'Platform engineering · RBC',
    title: 'Architecture Solution Blueprint platform',
    status: 'Production',
    summary: 'Designed and led the zero-to-one delivery of an enterprise platform that turns 1,000+ architecture patterns into real-time service recommendations, solution blueprints, and automated architecture workflows.',
    outcome: 'Made repeatable architecture decisions available as a product instead of a manual review bottleneck.',
    details: [
      'Designed the rules-based recommendation and auto-certification engine.',
      'Built the core recommendation logic and most of the production implementation.',
      'Mapped security, integration, infrastructure, and deployment patterns to enterprise services.',
      'Built for air-gapped, security-constrained enterprise environments.',
      'Led five engineers through ADRs, reviews, delivery, and stakeholder alignment.',
    ],
    technologies: ['TypeScript', 'React', 'Node.js', 'Rules engine', 'Enterprise architecture'],
    topics: ['Platform architecture', 'Staff engineering', 'AI governance'],
    relatedNotes: [
      'finos-calm-and-architecture-as-code',
      'production-rag-requires-retrieval-evidence-and-control',
      'pattern-matching-algorithms-for-architecture-recommendations',
      'platform-as-a-service-paas',
      'what-is-cloud-computing',
      'the-fundamentals-of-machine-learning',
    ],
  },
  {
    slug: 'observability-platform',
    eyebrow: 'Distributed systems · RBC',
    title: 'Vendor-neutral observability platform',
    status: 'Institution-wide',
    summary: 'Architected a vendor-neutral OpenTelemetry and telemetry-routing platform designed for approximately 150 TB/day across 10,000+ systems, enabling governed collection and routing without coupling teams to a single observability vendor.',
    outcome: 'Changed vendor routing from a point-to-point integration project into a configuration decision.',
    details: [
      'Defined OpenTelemetry schemas for institutional logs and metrics.',
      'Combined Vector, Fluent Bit, Kafka, and Logstash into reusable collection paths.',
      'Created SDK guidance and onboarding contracts adopted by 20+ engineering teams.',
      'Designed Microsoft 365 audit-log repatriation with geolocation-aware data handling.',
    ],
    technologies: ['OpenTelemetry', 'Kafka', 'Vector', 'Fluent Bit', 'Logstash'],
    topics: ['Observability', 'Platform architecture', 'Cloud architecture'],
    relatedNotes: [
      'opentelemetry-pipeline-architecture-for-vendor-neutral-observability',
      'microsoft-365-audit-data-in-an-opentelemetry-pipeline',
      'aws-support-for-opentelemetry-with-adot-and-cloudwatch',
      'splunk-support-for-opentelemetry-collection-and-otlp',
      'datadog-support-for-opentelemetry-and-otlp-ingestion',
      'dynatrace-support-for-opentelemetry-and-native-otlp',
      'elastic-support-for-opentelemetry-and-managed-otlp-ingestion',
      'distributed-cloud',
      'multi-cloud-architecture',
      'serverless-computing-and-function-as-a-service',
    ],
  },
  {
    slug: 'asb-assist',
    eyebrow: 'AI systems · RBC',
    title: 'ASB Assist',
    status: 'In development',
    summary: 'Building an LLM and RAG architecture assistant that turns natural-language requirements into architecture recommendations and diagrams using retrieval, tool integration, evaluation, grounding controls, guardrails, and auditable workflows.',
    outcome: 'Exploring how probabilistic model behaviour can operate behind deterministic enterprise controls, authorization boundaries, and human review.',
    details: [
      'Designing permission-aware retrieval and citation validation for architecture knowledge.',
      'Building offline evaluation for recommendation quality, grounding, and failure behaviour.',
      'Applying guardrails and approval boundaries before generated output can influence architecture decisions.',
      'Exploring MCP and agent-gateway patterns for controlled tool access.',
    ],
    technologies: ['Python', 'LLMs', 'RAG', 'Evaluation', 'Tool integration'],
    topics: ['AI governance', 'Platform architecture'],
    relatedNotes: [
      'production-rag-requires-retrieval-evidence-and-control',
      'design-safe-tool-use-for-ai-agents',
      'evaluate-llm-systems-as-systems',
      'define-the-boundaries-of-a-production-rag-system',
    ],
  },
  {
    slug: 'health-platform',
    eyebrow: 'Zero-to-one product · HealthCard',
    title: 'Healthcare verification platform',
    status: 'Acquired startup',
    summary: 'Joined as the first engineer and built the platform across React and TypeScript, Node.js APIs, verification workflows, document-classification integration, and AWS EKS in a regulated healthcare environment.',
    outcome: 'Established the technical foundation that supported a team growing to more than 20 engineers before acquisition.',
    details: [
      'Designed HIPAA-conscious data handling and audit logging.',
      'Built a Hyperledger Fabric verification layer and ERC-20 contracts.',
      'Containerised the platform and automated deployment workflows.',
      'Integrated document-classification models for medical record processing.',
    ],
    technologies: ['React', 'Node.js', 'AWS EKS', 'Hyperledger Fabric', 'Solidity'],
    topics: ['Platform architecture', 'Cloud architecture', 'Blockchain systems'],
    relatedNotes: ['what-is-blockchain', 'hybrid-cloud', 'infrastructure-as-a-service-iaas'],
  },
];

const capabilities = [
  {
    title: 'AI systems and agent infrastructure',
    description: 'Retrieval, tool use, evaluation, grounding, guardrails, and auditable workflows for dependable AI systems.',
    tools: ['LLM systems', 'RAG', 'Agents', 'MCP', 'Evaluation', 'Python'],
  },
  {
    title: 'Distributed systems and platforms',
    description: 'Hands-on design and delivery across scalable services, event-driven workflows, APIs, data contracts, and platform boundaries.',
    tools: ['Kafka', 'TypeScript', 'Node.js', 'Go', 'PostgreSQL', 'Redis'],
  },
  {
    title: 'Observability and infrastructure',
    description: 'High-volume telemetry, cloud platforms, infrastructure as code, distributed tracing, reliability, and production diagnostics.',
    tools: ['OpenTelemetry', 'Vector', 'Fluent Bit', 'Kubernetes', 'Terraform', 'AWS'],
  },
  {
    title: 'Security and governance',
    description: 'Identity, authorization, zero-trust integration, architecture decisions, responsible AI controls, and regulated delivery.',
    tools: ['IAM', 'OAuth/OIDC', 'Zero Trust', 'Auditability', 'ADRs', 'AI governance'],
  },
];

const experience = [
  {
    company: 'Royal Bank of Canada',
    location: 'Toronto, Canada',
    role: 'Staff Software Developer & Enterprise Architect',
    period: 'Nov 2022 — Present',
    summary: 'Building enterprise platforms and standards across architecture automation, observability, cloud infrastructure, and responsible AI.',
    highlights: [
      'Led zero-to-one delivery of the patent-pending Architecture Solution Blueprint platform.',
      'Architected institution-wide logging infrastructure handling 150 TB/day across 10,000+ systems.',
      'Defined OpenTelemetry contracts adopted by 20+ engineering teams.',
      'Led five engineers with hands-on reviews, ADRs, mentoring, and cross-functional delivery.',
    ],
  },
  {
    company: 'HealthCard',
    location: 'Remote',
    role: 'Blockchain Architect & First Full Stack Engineer',
    period: 'Aug 2021 — Jul 2022',
    summary: 'Built the acquired startup’s initial product and cloud architecture across frontend, APIs, verification, and deployment.',
    highlights: [
      'Delivered the React/TypeScript client and Node.js/Express API foundation.',
      'Designed Hyperledger Fabric verification and AWS EKS deployment architecture.',
    ],
  },
  {
    company: 'Canada Revenue Agency',
    location: 'Ottawa, Canada · Remote',
    role: 'IT Developer / Software Developer Co-op',
    period: 'Apr 2022 — Nov 2022',
    summary: 'Modernised federal tax-platform interfaces and contributed to accessible digital services used by Canadians.',
    highlights: [
      'Migrated legacy Apache Struts interfaces toward React and TypeScript.',
      'Improved WCAG compliance and automated code-quality baselines.',
    ],
  },
  {
    company: 'Dalhousie University',
    location: 'Halifax, Canada',
    role: 'Teaching Assistant & Research Assistant',
    period: 'Jan 2021 — Aug 2022',
    summary: 'Supported software development, algorithms, and graduate cloud-computing courses while researching call-stack decision algorithms.',
    highlights: [],
  },
  {
    company: 'CryptoVantage',
    location: 'Netherlands · Remote',
    role: 'Blockchain Developer',
    period: 'Jul 2020 — Dec 2020',
    summary: 'Built on-chain event processing and wallet-risk analysis for anti-money-laundering workflows.',
    highlights: [],
  },
];

const education = [
  {
    institution: 'University of Toronto',
    credential: 'Enterprise Architecture Certification',
    detail: 'Three-semester program · Completed 2024',
  },
  {
    institution: 'Dalhousie University',
    credential: 'Master of Applied Computer Science',
    detail: 'GPA 3.9 / 4.0 · 2021–2022',
  },
  {
    institution: 'Gujarat Technological University',
    credential: 'BE Computer Engineering',
    detail: 'GPA 3.92 / 4.0 · 2016–2020',
  },
];

const selectedProjects = [
  {
    slug: 'dcs-bbn',
    title: 'DCS-BBN',
    type: 'Published research · Distributed systems',
    description: 'A peer-to-peer archival storage network using Solidity smart contracts, Hyperledger Fabric, and privacy-preserving verification. Published by Springer.',
    link: 'https://link.springer.com/chapter/10.1007/978-3-030-49795-8_54',
    linkLabel: 'Read the publication',
    topics: ['Distributed systems', 'Blockchain systems', 'Cloud architecture'],
    relatedNotes: ['what-if-we-combine-blockchain-and-cloud-computing', 'what-is-blockchain', 'private-cloud'],
  },
  {
    slug: 'automatic-trading-system',
    title: 'Automatic trading system',
    type: 'Personal project · Quantitative engineering',
    description: 'A low-latency trading system that combines live brokerage APIs, market-data streams, quantitative signals, position sizing, and automated risk controls.',
    link: null,
    linkLabel: null,
    topics: ['Distributed systems'],
    relatedNotes: ['what-are-cryptocurrency-exchanges', 'what-are-transaction-fees-in-blockchain'],
  },
];

export {
  capabilities,
  caseStudies,
  education,
  experience,
  impact,
  profile,
  selectedProjects,
};
