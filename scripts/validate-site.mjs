import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist');
const origin = 'https://doshidhruv.com';

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(entryPath) : [entryPath];
  }));
  return nested.flat();
};

const files = await walk(distDir);
const htmlFiles = files.filter((file) => file.endsWith('index.html'));
const routeForFile = (file) => {
  const relative = path.relative(distDir, path.dirname(file)).replaceAll(path.sep, '/');
  return relative ? `/${relative}/` : '/';
};
const fileForPath = (pathname) => {
  const decoded = decodeURIComponent(pathname);
  if (decoded === '/') return path.join(distDir, 'index.html');
  const relative = decoded.replace(/^\//, '');
  return path.extname(relative) ? path.join(distDir, relative) : path.join(distDir, relative, 'index.html');
};
const exists = async (file) => access(file).then(() => true).catch(() => false);
const errors = [];

for (const htmlFile of htmlFiles) {
  const html = await readFile(htmlFile, 'utf8');
  const route = routeForFile(htmlFile);
  const markdownFile = path.join(distDir, '.well-known/markdown', path.relative(distDir, path.dirname(htmlFile)), 'index.md');
  if (!await exists(markdownFile)) errors.push(`${route}: missing generated Markdown representation`);
  if (!html.includes('rel="alternate" type="text/markdown"')) errors.push(`${route}: missing Markdown alternate link`);
  if (!html.includes('rel="describedby" type="application/json" href="https://doshidhruv.com/content-index.json"')) errors.push(`${route}: missing content-index discovery link`);
  const attributes = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map((match) => match[1]);

  for (const value of attributes) {
    if (/^(?:mailto:|tel:|data:|javascript:)/i.test(value) || value.startsWith('#')) continue;
    const target = new URL(value, `${origin}${route}`);
    if (target.origin !== origin) continue;
    const targetFile = fileForPath(target.pathname);
    if (!await exists(targetFile)) {
      errors.push(`${route}: ${value} does not resolve to a generated page or asset`);
      continue;
    }
    if (target.hash && targetFile.endsWith('.html')) {
      const targetHtml = targetFile === htmlFile ? html : await readFile(targetFile, 'utf8');
      const id = decodeURIComponent(target.hash.slice(1));
      if (!targetHtml.includes(`id="${id}"`)) errors.push(`${route}: ${value} points to a missing anchor`);
    }
  }

  const schemaScripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (schemaScripts.length === 0) errors.push(`${route}: missing JSON-LD`);
  for (const [, json] of schemaScripts) {
    try {
      JSON.parse(json);
    } catch {
      errors.push(`${route}: invalid JSON-LD`);
    }
  }
}

const sitemap = await readFile(path.join(distDir, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
const duplicateSitemapUrls = sitemapUrls.filter((url, index) => sitemapUrls.indexOf(url) !== index);
if (duplicateSitemapUrls.length) errors.push(`sitemap.xml: duplicate URLs: ${[...new Set(duplicateSitemapUrls)].join(', ')}`);

const generatedRoutes = new Set(htmlFiles.map((file) => `${origin}${routeForFile(file)}`));
const sitemapSet = new Set(sitemapUrls);
for (const route of generatedRoutes) {
  if (!sitemapSet.has(route)) errors.push(`sitemap.xml: missing generated route ${route}`);
}
for (const url of sitemapUrls) {
  if (!generatedRoutes.has(url)) errors.push(`sitemap.xml: ${url} has no generated HTML page`);
}

const feed = await readFile(path.join(distDir, 'feed.xml'), 'utf8');
const feedUrls = [...feed.matchAll(/<guid isPermaLink="true">(.*?)<\/guid>/g)].map((match) => match[1]);
for (const url of feedUrls) {
  if (!sitemapSet.has(url)) errors.push(`feed.xml: ${url} is absent from sitemap.xml`);
}
if (feedUrls.length === 0) errors.push('feed.xml: no entries found');

const jsonFeed = JSON.parse(await readFile(path.join(distDir, 'feed.json'), 'utf8'));
if (jsonFeed.version !== 'https://jsonfeed.org/version/1.1') errors.push('feed.json: unsupported or missing JSON Feed version');
if (jsonFeed.items.length !== feedUrls.length) errors.push(`feed.json: expected ${feedUrls.length} items, found ${jsonFeed.items.length}`);
for (const item of jsonFeed.items) {
  if (!sitemapSet.has(item.url)) errors.push(`feed.json: ${item.url} is absent from sitemap.xml`);
  if (!item.content_text || item.content_text.length < 100) errors.push(`feed.json: ${item.url} is missing full text`);
}

const contentIndex = JSON.parse(await readFile(path.join(distDir, 'content-index.json'), 'utf8'));
const contentNdjson = (await readFile(path.join(distDir, 'content-index.ndjson'), 'utf8')).trim().split('\n').map((line) => JSON.parse(line));
if (contentIndex.entries.length !== feedUrls.length) errors.push(`content-index.json: expected ${feedUrls.length} entries, found ${contentIndex.entries.length}`);
if (contentNdjson.length !== contentIndex.entries.length) errors.push('content-index.ndjson: entry count does not match content-index.json');
for (const entry of contentIndex.entries) {
  if (!sitemapSet.has(entry.canonical)) errors.push(`content-index.json: ${entry.canonical} is absent from sitemap.xml`);
  if (!entry.contentMarkdown || entry.contentMarkdown.length < 100) errors.push(`content-index.json: ${entry.canonical} is missing full Markdown`);
}

const llmsFull = await readFile(path.join(distDir, 'llms-full.txt'), 'utf8');
for (const entry of contentIndex.entries) {
  if (!llmsFull.includes(`Canonical: ${entry.canonical}`)) errors.push(`llms-full.txt: missing full entry for ${entry.canonical}`);
}

const robots = await readFile(path.join(distDir, 'robots.txt'), 'utf8');
const allowedBots = ['*', 'OAI-SearchBot', 'ChatGPT-User', 'GPTBot', 'Googlebot', 'Google-Extended', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User'];
for (const agent of allowedBots) {
  const escapedAgent = agent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const group = robots.match(new RegExp(`User-agent: ${escapedAgent}\\n([\\s\\S]*?)(?=\\nUser-agent:|\\nSitemap:)`, 'i'))?.[1] || '';
  if (!group.includes('Allow: /')) errors.push(`robots.txt: ${agent} is not explicitly allowed`);
  if (!group.includes('search=yes') || !group.includes('ai-input=yes') || !group.includes('ai-train=yes') || !group.includes('use=full')) errors.push(`robots.txt: ${agent} is missing full content-use permission`);
}

const schemaRequirements = [
  ['/', ['Person', 'WebSite', 'ProfilePage']],
  ['/notes/', ['CollectionPage', 'BreadcrumbList']],
  ['/guides/', ['CollectionPage', 'BreadcrumbList']],
  ['/notes/what-is-cloud-computing/', ['Article', 'BreadcrumbList']],
  ['/guides/platform-architecture/', ['Article', 'BreadcrumbList']],
];
for (const [route, types] of schemaRequirements) {
  const html = await readFile(fileForPath(route), 'utf8');
  for (const type of types) {
    if (!html.includes(`"@type":"${type}"`)) errors.push(`${route}: structured data is missing ${type}`);
  }
  if (types.includes('Article')) {
    for (const property of ['articleSection', 'keywords', 'wordCount', 'isAccessibleForFree']) {
      if (!html.includes(`"${property}"`)) errors.push(`${route}: structured data is missing ${property}`);
    }
  }
  if (types.includes('CollectionPage') && !html.includes('"@type":"ItemList"')) errors.push(`${route}: structured data is missing ItemList`);
}

if (errors.length) {
  console.error(`Site validation failed with ${errors.length} issue${errors.length === 1 ? '' : 's'}:`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Validated ${htmlFiles.length} static pages, ${sitemapUrls.length} sitemap URLs, and ${feedUrls.length} feed entries.`);
