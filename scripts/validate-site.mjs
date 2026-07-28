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
}

if (errors.length) {
  console.error(`Site validation failed with ${errors.length} issue${errors.length === 1 ? '' : 's'}:`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Validated ${htmlFiles.length} static pages, ${sitemapUrls.length} sitemap URLs, and ${feedUrls.length} feed entries.`);
