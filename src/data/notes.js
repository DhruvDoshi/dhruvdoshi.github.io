const noteModules = import.meta.glob('../content/notes/*.md', {
  eager: true,
  import: 'default',
  query: '?raw',
});

const titleCorrections = {
  'What are Nodes in Blockchian?': 'What are nodes in blockchain?',
  'Time Stamping in Blockchain and Cryptocurrencies?': 'Timestamping in blockchain and cryptocurrencies',
  'What is Mining of Block in Blockchain and Cryptocurrency?': 'How mining works in blockchain',
  'What is wallet in Blockchain?': 'What is a blockchain wallet?',
  'What is Anonimity in Blockchain?': 'What is anonymity in blockchain?',
  'What is Transaction Fees in Blockchain?': 'What are transaction fees in blockchain?',
  'What are Crypto Exchanges ?': 'What are cryptocurrency exchanges?',
  'What is Automatic Swaps in Blockchain?': 'What are atomic swaps?',
  'What is the initial coin offering in Blockchain?': 'What is an initial coin offering?',
  'Where could be Blockchain be used?': 'Where could blockchain be used?',
  'What is the weakness of Blockchain?? (Everything isn\'t perfect!!)': 'Where blockchain falls short',
  'How Blockchain Could Disrupt Banking Industry?': 'How blockchain could disrupt banking',
  'How Banks could retaliate to the blockchain industry?': 'How banks could respond to blockchain',
  'What is Cryptocurrency ?': 'What is cryptocurrency?',
  'Infrastructure as a Service(IaaS) - Cloud Computing': 'Infrastructure as a Service (IaaS)',
  'Software as a Service(SaaS) - Cloud Computing': 'Software as a Service (SaaS)',
  'Platform as a Service(PaaS) - Cloud Computing': 'Platform as a Service (PaaS)',
  'Mobile Backend as a Service(MBaaS) - Cloud Computing': 'Mobile Backend as a Service (MBaaS)',
  'Serverless Computing or Function as a Service(FaaS) - Cloud Computing': 'Serverless computing and Function as a Service',
  'Public Cloud - Cloud Computing': 'Public cloud',
  'Private Cloud - Cloud Computing': 'Private cloud',
  'Hybrid Cloud - Cloud Computing': 'Hybrid cloud',
  'Community Cloud - Cloud Computing': 'Community cloud',
  'Distributed Cloud - Cloud Computing': 'Distributed cloud',
  'Multi Cloud - Cloud Computing': 'Multi-cloud architecture',
  'Poly Cloud - Cloud Computing': 'Poly-cloud architecture',
  'HPC Cloud - Cloud Computing': 'High-performance computing in the cloud',
  'What is Cloud Computing': 'What is cloud computing?',
};

const featuredSlugs = new Set([
  'deep-learning-explained-from-basics-to-advanced',
  'the-fundamentals-of-machine-learning',
  'what-is-cloud-computing',
]);

const slugify = (value) => value
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const parseList = (value = '') => value
  .replace(/^\[|\]$/g, '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const parseFrontmatter = (raw) => {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return { attributes: {}, body: raw };

  const attributes = {};
  match[1].split('\n').forEach((line) => {
    if (!line || line.trim().startsWith('#') || /^\s/.test(line)) return;
    const separator = line.indexOf(':');
    if (separator === -1) return;
    const key = line.slice(0, separator).trim();
    attributes[key] = line.slice(separator + 1).trim();
  });

  return { attributes, body: raw.slice(match[0].length).trim() };
};

const normalizeDate = (value) => {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return '2019-01-01';
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${match[1]}-${match[2]}-${String(Math.min(day, lastDay)).padStart(2, '0')}`;
};

const stripMarkup = (value) => value
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .replace(/[`*_>#~-]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const getExcerpt = (body) => {
  const paragraph = body
    .split(/\n\s*\n/)
    .map(stripMarkup)
    .find((candidate) => candidate.length > 70);
  const excerpt = paragraph || stripMarkup(body);
  if (excerpt.length <= 190) return excerpt;
  const shortened = excerpt.slice(0, 187).trim();
  const lastSpace = shortened.lastIndexOf(' ');
  return `${shortened.slice(0, lastSpace > 140 ? lastSpace : shortened.length)}…`;
};

const getTopic = (categories) => {
  if (categories.some((item) => /artificial|machine|deep/i.test(item))) return 'AI & machine learning';
  if (categories.some((item) => /cloud/i.test(item))) return 'Cloud architecture';
  return 'Blockchain systems';
};

const notes = Object.entries(noteModules)
  .map(([path, raw]) => {
    const sourceSlug = path.split('/').pop().replace(/\.md$/, '');
    const { attributes, body } = parseFrontmatter(raw);
    const cleanedBody = body.replace(/^#\s+[^\n]+\n+/, '');
    const originalTitle = attributes.title || sourceSlug.replace(/-/g, ' ');
    const title = titleCorrections[originalTitle] || originalTitle;
    const slug = slugify(title);
    const categories = parseList(attributes.categories);
    const date = normalizeDate(attributes.date);
    const words = stripMarkup(cleanedBody).split(/\s+/).filter(Boolean).length;

    return {
      aliases: [...new Set([sourceSlug, slugify(originalTitle)])],
      body: cleanedBody,
      categories,
      date,
      excerpt: getExcerpt(cleanedBody),
      featured: featuredSlugs.has(slug),
      readTime: Math.max(2, Math.ceil(words / 220)),
      slug,
      title,
      topic: getTopic(categories),
      year: date.slice(0, 4),
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

const topics = [...new Set(notes.map((note) => note.topic))];
const featuredNotes = notes.filter((note) => note.featured);

const findNote = (slug) => notes.find((note) => note.slug === slug || note.aliases.includes(slug));

export {
  featuredNotes,
  findNote,
  notes,
  slugify,
  topics,
};
