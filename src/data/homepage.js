const homepageGuides = [
  {
    slug: 'ai-governance',
    title: 'AI governance for software systems: controls that fit delivery',
    topic: 'AI governance',
    reviewed: '2026-07-28',
  },
  {
    slug: 'observability-systems',
    title: 'Observability systems: design the telemetry path before the dashboard',
    topic: 'Observability',
    reviewed: '2026-07-28',
  },
  {
    slug: 'platform-architecture',
    title: 'Platform architecture: from standards to a usable product',
    topic: 'Platform architecture',
    reviewed: '2026-07-28',
  },
  {
    slug: 'staff-engineering-practice',
    title: 'Staff engineering practice: create leverage through clear systems',
    topic: 'Staff engineering',
    reviewed: '2026-07-28',
  },
  {
    slug: 'cloud-migration',
    title: 'Cloud migration: sequence decisions, not just workloads',
    topic: 'Cloud architecture',
    reviewed: '2026-07-28',
  },
];

const homepageGuideSlugs = homepageGuides.map((guide) => guide.slug);

// Keep the homepage metadata deliberately small. Importing src/data/notes here
// eagerly bundles the body of every Markdown note into the homepage route.
const homepageNotes = [
  {
    slug: 'production-rag-requires-retrieval-evidence-and-control',
    title: 'Production RAG requires retrieval evidence and control',
    topic: 'AI governance',
    date: '2026-02-15',
    readTime: 3,
  },
  {
    slug: 'finos-calm-and-architecture-as-code',
    title: 'FINOS CALM and architecture as code',
    topic: 'Platform architecture',
    date: '2026-01-15',
    readTime: 3,
  },
  {
    slug: 'design-safe-tool-use-for-ai-agents',
    title: 'Design safe tool use for AI agents',
    topic: 'AI governance',
    date: '2024-10-01',
    readTime: 3,
  },
  {
    slug: 'evaluate-llm-systems-as-systems',
    title: 'Evaluate LLM systems as systems',
    topic: 'AI governance',
    date: '2024-06-01',
    readTime: 3,
  },
  {
    slug: 'opentelemetry-pipeline-architecture-for-vendor-neutral-observability',
    title: 'OpenTelemetry pipeline architecture for vendor-neutral observability',
    topic: 'Observability',
    date: '2026-04-15',
    readTime: 3,
  },
  {
    slug: 'measure-whether-an-internal-platform-creates-leverage',
    title: 'Measure whether an internal platform creates leverage',
    topic: 'Platform architecture',
    date: '2026-07-01',
    readTime: 3,
  },
];

const homepageNoteSlugs = homepageNotes.map((note) => note.slug);

export { homepageGuides, homepageGuideSlugs, homepageNotes, homepageNoteSlugs };
