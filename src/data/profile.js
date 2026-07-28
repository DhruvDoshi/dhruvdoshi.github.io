const profile = {
  name: 'Dhruv Doshi',
  role: 'Staff Software Developer & Enterprise Architect',
  location: 'Toronto, Canada',
  email: 'work@doshidhruv.com',
  summary: 'I design and build enterprise platforms that make complex architecture easier to govern, operate, and ship.',
  introduction: 'My work sits where platform engineering, distributed systems, observability, and enterprise architecture meet. I stay close to the code, lead across teams, and turn ambiguous technical problems into systems people can use.',
  availability: 'Open to staff-level platform, architecture, and applied AI conversations.',
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
    summary: 'Led the zero-to-one delivery of an enterprise platform that turns architecture patterns into real-time component recommendations and compliant solution blueprints.',
    outcome: 'Made repeatable architecture decisions available as a product instead of a manual review bottleneck.',
    details: [
      'Designed the rules-based recommendation and auto-certification engine.',
      'Mapped security, integration, infrastructure, and deployment patterns to enterprise services.',
      'Built for air-gapped, security-constrained enterprise environments.',
      'Led five engineers through ADRs, reviews, delivery, and stakeholder alignment.',
    ],
    technologies: ['TypeScript', 'React', 'Node.js', 'Rules engine', 'Enterprise architecture'],
  },
  {
    slug: 'observability-platform',
    eyebrow: 'Distributed systems · RBC',
    title: 'Vendor-neutral observability platform',
    status: 'Institution-wide',
    summary: 'Architected a log repatriation and routing platform designed to ingest 150 TB per day across more than 10,000 systems without coupling teams to one observability vendor.',
    outcome: 'Changed vendor routing from a point-to-point integration project into a configuration decision.',
    details: [
      'Defined OpenTelemetry schemas for institutional logs and metrics.',
      'Combined Vector, Fluent Bit, Kafka, and Logstash into reusable collection paths.',
      'Created SDK guidance and onboarding contracts adopted by 20+ engineering teams.',
      'Designed Microsoft 365 audit-log repatriation with geolocation-aware data handling.',
    ],
    technologies: ['OpenTelemetry', 'Kafka', 'Vector', 'Fluent Bit', 'Logstash'],
  },
  {
    slug: 'health-platform',
    eyebrow: 'Zero-to-one product · HealthCard',
    title: 'Healthcare verification platform',
    status: 'Acquired startup',
    summary: 'Joined as the first engineer and built the application stack across the React client, Node.js APIs, verification layer, and AWS EKS deployment.',
    outcome: 'Established the technical foundation that supported a team growing to more than 20 engineers before acquisition.',
    details: [
      'Designed HIPAA-conscious data handling and audit logging.',
      'Built a Hyperledger Fabric verification layer and ERC-20 contracts.',
      'Containerised the platform and automated deployment workflows.',
      'Integrated document-classification models for medical record processing.',
    ],
    technologies: ['React', 'Node.js', 'AWS EKS', 'Hyperledger Fabric', 'Solidity'],
  },
];

const capabilities = [
  {
    title: 'Platform architecture',
    description: 'Distributed systems, service boundaries, reusable platform primitives, reference architectures, and pragmatic governance.',
    tools: ['AWS', 'GCP', 'Kubernetes', 'Terraform', 'Docker', 'CI/CD'],
  },
  {
    title: 'Application engineering',
    description: 'Hands-on product delivery from interface and API design through data contracts, security decisions, and production operations.',
    tools: ['TypeScript', 'JavaScript', 'Python', 'Go', 'React', 'Node.js'],
  },
  {
    title: 'Data & observability',
    description: 'High-volume ingestion, vendor-neutral telemetry, traceable operations, and standards that engineering teams can adopt.',
    tools: ['OpenTelemetry', 'Kafka', 'ELK', 'Prometheus', 'Airflow', 'Snowflake'],
  },
  {
    title: 'AI systems & governance',
    description: 'Responsible AI controls, RAG and agentic system patterns, model-risk boundaries, and secure enterprise adoption.',
    tools: ['LLMs', 'RAG', 'LangChain', 'Vector databases', 'AI governance', 'IAM'],
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
    title: 'DCS-BBN',
    type: 'Published research · Distributed systems',
    description: 'A peer-to-peer archival storage network using Solidity smart contracts, Hyperledger Fabric, and privacy-preserving verification. Published by Springer.',
    link: 'https://link.springer.com/chapter/10.1007/978-3-030-49795-8_54',
    linkLabel: 'Read the publication',
  },
  {
    title: 'Automatic trading system',
    type: 'Personal project · Quantitative engineering',
    description: 'A low-latency trading system that combines live brokerage APIs, market-data streams, quantitative signals, position sizing, and automated risk controls.',
    link: null,
    linkLabel: null,
  },
  {
    title: 'ASB Assist',
    type: 'In development · Applied AI',
    description: 'A natural-language architecture workflow that uses LLM and RAG patterns to generate compliant diagrams and recommend enterprise services on top of the blueprint platform.',
    link: null,
    linkLabel: null,
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
