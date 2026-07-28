import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { NodeHtmlMarkdown } from 'node-html-markdown';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist');
const markdownDir = path.join(distDir, '.well-known/markdown');

const findRouteDocuments = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const documents = [];

  for (const entry of entries) {
    if (entry.name === 'assets' || entry.name === '.well-known') continue;
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) documents.push(...await findRouteDocuments(entryPath));
    if (entry.isFile() && entry.name === 'index.html') documents.push(entryPath);
  }

  return documents;
};

const documents = await findRouteDocuments(distDir);

await Promise.all(documents.map(async (documentPath) => {
  const html = await readFile(documentPath, 'utf8');
  const relativeDirectory = path.relative(distDir, path.dirname(documentPath));
  const route = relativeDirectory ? `/${relativeDirectory.replaceAll(path.sep, '/')}/` : '/';
  const canonical = `https://doshidhruv.com${route}`;
  const title = html.match(/<title>(.*?)<\/title>/s)?.[1] || 'Dhruv Doshi';
  const description = html.match(/<meta name="description" content="([^"]*)"\s*\/?>/)?.[1] || '';
  const rootContent = html.match(/<div id="root">([\s\S]*?)<\/div>\s*<script/)?.[1] || html;
  const body = NodeHtmlMarkdown.translate(rootContent, {
    bulletMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    keepDataImages: false,
    maxConsecutiveNewlines: 2,
    preferNativeParser: false,
    useLinkReferenceDefinitions: false,
  }).trim();
  const frontmatter = `---\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(description)}\ncanonical: ${canonical}\nauthor: Dhruv Doshi\n---\n\n`;
  const outputDirectory = path.join(markdownDir, relativeDirectory);

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(path.join(outputDirectory, 'index.md'), `${frontmatter}${body}\n`);
}));
