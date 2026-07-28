import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { normalizeNote } from '../src/data/note-utils.js';

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

const pages = [
  ['/', generatedDate, 'weekly', '1.0'],
  ['/projects', generatedDate, 'monthly', '0.9'],
  ['/resume', generatedDate, 'monthly', '0.9'],
  ['/notes', notes[0]?.date || generatedDate, 'weekly', '0.9'],
  ['/research', generatedDate, 'yearly', '0.8'],
  ['/about', generatedDate, 'monthly', '0.7'],
  ['/contact', generatedDate, 'yearly', '0.6'],
  ['/pictures', generatedDate, 'yearly', '0.4'],
  ...notes.map((note) => [`/notes/${note.slug}`, note.date, 'yearly', '0.7']),
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

const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Dhruv Doshi — Technical Notes</title>
    <link>${pageUrl('/notes')}</link>
    <description>Technical notes on cloud architecture, blockchain systems, artificial intelligence, and machine learning.</description>
    <language>en-ca</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${origin}/feed.xml" rel="self" type="application/rss+xml" />
${notes.map((note) => `    <item>
      <title>${xml(note.title)}</title>
      <link>${pageUrl(`/notes/${note.slug}`)}</link>
      <guid isPermaLink="true">${pageUrl(`/notes/${note.slug}`)}</guid>
      <pubDate>${new Date(`${note.date}T12:00:00Z`).toUTCString()}</pubDate>
      <category>${xml(note.topic)}</category>
      <description>${xml(note.excerpt)}</description>
    </item>`).join('\n')}
  </channel>
</rss>
`;

const noteDirectory = notes.map((note) => `- [${note.title}](${pageUrl(`/notes/${note.slug}`)}): ${note.excerpt}`).join('\n');
const llms = `# Dhruv Doshi

> Staff Software Developer and Enterprise Architect in Toronto, Canada. This site documents professional experience, selected engineering work, published research, and technical writing.

## Primary pages

- [Home](${origin}/): Profile and current scope
- [Selected work](${pageUrl('/projects')}): Platform engineering, observability, healthcare, and independent projects
- [Resume](${pageUrl('/resume')}): Resume PDF, professional experience, education, and engineering scope
- [Resume PDF](${origin}/resume/Dhruv-Doshi-Resume.pdf): Downloadable one-page resume
- [Technical notes](${pageUrl('/notes')}): Searchable writing archive
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

await mkdir(publicDir, { recursive: true });
await Promise.all([
  writeFile(path.join(publicDir, 'sitemap.xml'), sitemap),
  writeFile(path.join(publicDir, 'feed.xml'), feed),
  writeFile(path.join(publicDir, 'llms.txt'), llms),
  writeFile(path.join(publicDir, 'llms-full.txt'), llmsFull),
  writeFile(path.join(publicDir, 'agents.txt'), agents),
  writeFile(path.join(publicDir, 'robots.txt'), robots),
  writeFile(path.join(publicDir, '.well-known/agent-skills/index.json'), agentSkillsIndex),
]);
