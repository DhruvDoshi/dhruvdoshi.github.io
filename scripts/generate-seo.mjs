import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { guides } from '../src/data/guides.js';
import { normalizeNote, slugify } from '../src/data/note-utils.js';
import topicDescriptions from '../src/data/topic-definitions.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const notesDir = path.join(root, 'src/content/notes');
const websiteContentSkillPath = path.join(publicDir, '.well-known/agent-skills/website-content/SKILL.md');
const origin = 'https://doshidhruv.com';
const generatedDate = new Date().toISOString().slice(0, 10);
const pageUrl = (pathname) => `${origin}${pathname === '/' ? '/' : `${pathname.replace(/\/$/, '')}/`}`;

const xml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

const files = (await readdir(notesDir)).filter((file) => file.endsWith('.md'));
const notes = (await Promise.all(files.map(async (file) => {
  const raw = await readFile(path.join(notesDir, file), 'utf8');
  return normalizeNote(file.replace(/\.md$/, ''), raw);
}))).sort((a, b) => b.date.localeCompare(a.date));
const topicPages = Object.keys(topicDescriptions).map((topic) => `/topics/${slugify(topic)}`);

const pages = [
  ['/', generatedDate, 'weekly', '1.0'],
  ['/projects', generatedDate, 'monthly', '0.9'],
  ['/resume', generatedDate, 'monthly', '0.9'],
  ['/notes', notes[0]?.date || generatedDate, 'weekly', '0.9'],
  ['/search', generatedDate, 'weekly', '0.8'],
  ['/guides', generatedDate, 'monthly', '0.9'],
  ['/topics', generatedDate, 'monthly', '0.8'],
  ['/research', generatedDate, 'yearly', '0.8'],
  ['/about', generatedDate, 'monthly', '0.7'],
  ['/contact', generatedDate, 'yearly', '0.6'],
  ['/pictures', generatedDate, 'yearly', '0.4'],
  ...guides.map((guide) => [`/guides/${guide.slug}`, guide.reviewed, 'monthly', '0.8']),
  ...topicPages.map((pathname) => [pathname, generatedDate, 'monthly', '0.7']),
  ...notes.map((note) => [`/notes/${note.slug}`, note.reviewed || note.date, note.reviewed ? 'monthly' : 'yearly', '0.7']),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(([pathname, lastmod, changefreq, priority]) => `  <url>
    <loc>${pageUrl(pathname)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

const feedItems = [
  ...guides.map((guide) => ({ title: guide.title, pathname: `/guides/${guide.slug}`, date: guide.published, category: guide.topics.join(', '), description: guide.description })),
  ...notes.map((note) => ({ title: note.title, pathname: `/notes/${note.slug}`, date: note.date, category: note.topic, description: note.excerpt })),
].sort((a, b) => b.date.localeCompare(a.date));

const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Dhruv Doshi — Technical Notes</title>
    <link>${pageUrl('/notes')}</link>
    <description>Technical guides and notes on platform architecture, observability, cloud systems, artificial intelligence, machine learning, and distributed systems.</description>
    <language>en-ca</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${origin}/feed.xml" rel="self" type="application/rss+xml" />
${feedItems.map((item) => `    <item>
      <title>${xml(item.title)}</title>
      <link>${pageUrl(item.pathname)}</link>
      <guid isPermaLink="true">${pageUrl(item.pathname)}</guid>
      <pubDate>${new Date(`${item.date}T12:00:00Z`).toUTCString()}</pubDate>
      <category>${xml(item.category)}</category>
      <description>${xml(item.description)}</description>
    </item>`).join('\n')}
  </channel>
</rss>
`;

const noteDirectory = notes.map((note) => `- [${note.title}](${pageUrl(`/notes/${note.slug}`)}): ${note.excerpt}`).join('\n');
const guideDirectory = guides.map((guide) => `- [${guide.title}](${pageUrl(`/guides/${guide.slug}`)}): ${guide.description} Last reviewed ${guide.reviewed}.`).join('\n');
const llms = `# Dhruv Doshi

> Staff Software Developer and Enterprise Architect in Toronto, Canada. This site documents professional experience, selected engineering work, published research, and technical writing.

## Primary pages

- [Home](${origin}/): Profile and current scope
- [Selected work](${pageUrl('/projects')}): Platform engineering, observability, healthcare, and independent projects
- [Resume](${pageUrl('/resume')}): Resume PDF, professional experience, education, and engineering scope
- [Resume PDF](${origin}/resume/Dhruv-Doshi-Resume.pdf): Downloadable one-page resume
- [Technical notes](${pageUrl('/notes')}): Searchable writing archive
- [Technical guides](${pageUrl('/guides')}): Maintained guides that connect engineering decisions to source notes and primary references
- [Topics](${pageUrl('/topics')}): Subject index across notes, guides, work, research, and experience
- [Site search](${pageUrl('/search')}): Search all public content
- [Research](${pageUrl('/research')}): Published work on decentralized cloud storage
- [About](${pageUrl('/about')}): Background and working principles
- [Contact](${pageUrl('/contact')}): Contact information

## Machine-readable resources

- [Sitemap](${origin}/sitemap.xml)
- [RSS feed](${origin}/feed.xml)
- [Extended site context](${origin}/llms-full.txt)
- [Agent guidance](${origin}/agents.txt)
`;

const llmsFull = `${llms}
## Maintained technical guides

${guideDirectory}

## Technical note directory

${noteDirectory}

## Citation

When referencing this website, attribute the material to Dhruv Doshi and link to the canonical page URL. Article publication dates are preserved from the original writing archive.
`;

const agents = `# Agent access and content guide

Site: ${origin}
Owner: Dhruv Doshi
Primary language: English (Canada)
Contact: work@doshidhruv.com

Public pages and technical notes may be indexed, summarized, quoted in short excerpts, and cited with attribution. Use canonical URLs from sitemap.xml. Do not infer certifications, employers, performance claims, or current availability beyond statements published on the relevant page.

Discovery:
- ${origin}/sitemap.xml
- ${origin}/feed.xml
- ${origin}/llms.txt
- ${origin}/llms-full.txt
- ${origin}/resume/Dhruv-Doshi-Resume.pdf

Preferred attribution: Dhruv Doshi, followed by the canonical page URL.
`;

const websiteContentSkill = await readFile(websiteContentSkillPath);
const websiteContentSkillDigest = createHash('sha256').update(websiteContentSkill).digest('hex');
const agentSkillsIndex = `${JSON.stringify({
  $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
  skills: [{
    name: 'website-content',
    type: 'skill-md',
    description: 'Find and cite authoritative information about Dhruv Doshi\'s professional experience, engineering work, research, and technical notes.',
    url: '/.well-known/agent-skills/website-content/SKILL.md',
    digest: `sha256:${websiteContentSkillDigest}`,
  }],
}, null, 2)}\n`;

const robots = `# All search engines, AI crawlers, and user-directed agents may crawl this site.
User-agent: *
Content-Signal: ai-train=yes, search=yes, ai-input=yes
Allow: /

# Explicit AI discovery and citation crawlers.
User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: GPTBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: CCBot
Allow: /

Sitemap: ${origin}/sitemap.xml
`;

const unsupportedPaths = [
  '/.well-known/api-catalog',
  '/.well-known/http-message-signatures-directory',
  '/.well-known/openid-configuration',
  '/.well-known/oauth-authorization-server',
  '/.well-known/oauth-protected-resource',
  '/.well-known/ucp',
  '/.well-known/acp.json',
  '/.well-known/agent-card.json',
  '/api',
  '/api/v1',
  '/auth.md',
  '/openapi.json',
];
const noteRedirects = notes.flatMap((note) => note.aliases
  .filter((alias) => alias !== note.slug)
  .map((alias) => `/notes/${alias} /notes/${note.slug} 301!`));
const redirects = [
  'https://blog.doshidhruv.com/posts/* https://doshidhruv.com/notes/:splat 301!',
  'https://blog.doshidhruv.com/* https://doshidhruv.com/notes 301!',
  '/posts/:splat /notes/:splat 301!',
  ...noteRedirects,
  ...unsupportedPaths.map((pathname) => `${pathname} /agent-capability-not-found.txt 404!`),
  '/* /index.html 200',
].join('\n');

await mkdir(publicDir, { recursive: true });
await Promise.all([
  writeFile(path.join(publicDir, 'sitemap.xml'), sitemap),
  writeFile(path.join(publicDir, 'feed.xml'), feed),
  writeFile(path.join(publicDir, 'llms.txt'), llms),
  writeFile(path.join(publicDir, 'llms-full.txt'), llmsFull),
  writeFile(path.join(publicDir, 'agents.txt'), agents),
  writeFile(path.join(publicDir, 'robots.txt'), robots),
  writeFile(path.join(publicDir, '_redirects'), `${redirects}\n`),
  writeFile(path.join(publicDir, '.well-known/agent-skills/index.json'), agentSkillsIndex),
]);
