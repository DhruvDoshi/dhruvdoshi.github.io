import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

import { normalizeNote } from '../src/data/note-utils.js';
import { caseStudies, capabilities, education, experience, profile } from '../src/data/profile.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist');
const notesDir = path.join(root, 'src/content/notes');
const origin = 'https://doshidhruv.com';
const template = await readFile(path.join(distDir, 'index.html'), 'utf8');

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const files = (await readdir(notesDir)).filter((file) => file.endsWith('.md'));
const notes = (await Promise.all(files.map(async (file) => {
  const raw = await readFile(path.join(notesDir, file), 'utf8');
  return normalizeNote(file.replace(/\.md$/, ''), raw);
}))).sort((a, b) => b.date.localeCompare(a.date));

const renderDocument = ({ title, description, pathname, content, type = 'WebPage', datePublished }) => {
  const canonical = `${origin}${pathname === '/' ? '' : pathname}`;
  const pageTitle = title ? `${title} | Dhruv Doshi` : 'Dhruv Doshi | Staff Software Developer and Enterprise Architect';
  const schema = type === 'TechArticle'
    ? { '@context': 'https://schema.org', '@type': type, headline: title, description, datePublished, dateModified: datePublished, mainEntityOfPage: canonical, author: { '@type': 'Person', name: 'Dhruv Doshi', url: origin } }
    : { '@context': 'https://schema.org', '@type': type, name: pageTitle, description, url: canonical, author: { '@type': 'Person', name: 'Dhruv Doshi', url: origin } };

  return template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(pageTitle)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${canonical}" />`)
    .replace('</head>', `<meta property="og:title" content="${escapeHtml(pageTitle)}" /><meta property="og:description" content="${escapeHtml(description)}" /><meta property="og:url" content="${canonical}" /><meta property="og:type" content="${type === 'TechArticle' ? 'article' : 'website'}" /><script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script></head>`)
    .replace('<div id="root"></div>', `<div id="root"><div class="prerendered-page">${content}</div></div>`);
};

const writeRoute = async (pathname, options) => {
  const directory = pathname === '/' ? distDir : path.join(distDir, pathname.replace(/^\//, ''));
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'index.html'), renderDocument({ pathname, ...options }));
};

const list = (items) => `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;
const page = (heading, body) => `<main class="page-shell document-intro"><h1>${heading}</h1>${body}</main>`;

await writeRoute('/', {
  description: 'Dhruv Doshi is a Staff Software Developer and Enterprise Architect in Toronto working across platform engineering, distributed systems, observability, and applied AI.',
  content: page('Dhruv Doshi', `<p><strong>${profile.role}</strong></p><p>${profile.introduction}</p><h2>Selected work</h2>${list(caseStudies.map((item) => `<a href="/projects#${item.slug}">${escapeHtml(item.title)}</a> — ${escapeHtml(item.summary)}`))}<h2>Recent technical notes</h2>${list(notes.slice(0, 8).map((note) => `<a href="/notes/${note.slug}">${escapeHtml(note.title)}</a>`))}`),
});

await writeRoute('/notes', {
  title: 'Technical notes',
  description: 'Technical notes by Dhruv Doshi on cloud architecture, blockchain systems, artificial intelligence, and machine learning.',
  content: page('Technical notes', `<p>${notes.length} articles, ordered by publication date.</p>${list(notes.map((note) => `<a href="/notes/${note.slug}">${escapeHtml(note.title)}</a> — <time datetime="${note.date}">${note.date}</time><br />${escapeHtml(note.excerpt)}`))}`),
});

for (const note of notes) {
  const markdown = renderToStaticMarkup(React.createElement(ReactMarkdown, { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeRaw] }, note.body));
  await writeRoute(`/notes/${note.slug}`, {
    title: note.title,
    description: note.excerpt,
    type: 'TechArticle',
    datePublished: note.date,
    content: `<main class="page-shell note-page"><article><header class="note-header"><p><a href="/notes">All notes</a></p><p class="eyebrow">${escapeHtml(note.topic)}</p><h1>${escapeHtml(note.title)}</h1><p>${escapeHtml(note.excerpt)}</p><p><time datetime="${note.date}">${note.date}</time> · ${note.readTime} minute read</p></header><div class="note-layout"><aside class="note-aside"><strong>Archived technical note</strong></aside><div class="article-prose">${markdown}</div></div></article></main>`,
  });
}

await writeRoute('/projects', {
  title: 'Selected work',
  description: 'Selected platform engineering, distributed systems, observability, and product work by Dhruv Doshi.',
  content: page('Selected software engineering work', caseStudies.map((item) => `<article id="${item.slug}"><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.summary)}</p>${list(item.details.map(escapeHtml))}<p><strong>Technologies:</strong> ${escapeHtml(item.technologies.join(', '))}</p></article>`).join('')),
});

await writeRoute('/resume', {
  title: 'Experience',
  description: 'Professional experience, education, and technical capabilities of Dhruv Doshi.',
  content: page('Professional experience', `${experience.map((item) => `<article><h2>${escapeHtml(item.role)}</h2><p><strong>${escapeHtml(item.company)}</strong> · ${escapeHtml(item.period)} · ${escapeHtml(item.location)}</p><p>${escapeHtml(item.summary)}</p>${list(item.highlights.map(escapeHtml))}</article>`).join('')}<h2>Education</h2>${list(education.map((item) => `${escapeHtml(item.credential)}, ${escapeHtml(item.institution)} — ${escapeHtml(item.detail)}`))}<h2>Capabilities</h2>${list(capabilities.map((item) => `<strong>${escapeHtml(item.title)}</strong>: ${escapeHtml(item.tools.join(', '))}`))}`),
});

const staticRoutes = [
  ['/about', 'About', 'About Dhruv Doshi', `<p>${escapeHtml(profile.introduction)}</p><p>Dhruv is based in Toronto and works across platform engineering, distributed systems, observability, enterprise architecture, and applied AI.</p>`],
  ['/research', 'Research', 'Published research', '<h2>Decentralized Cloud Storage Based on Blockchain Networking</h2><p>A Springer Nature conference paper by Dhruv Doshi and Satvik Khara on attribute-based access control, blockchain security events, and untrusted cloud storage.</p><p><a href="https://link.springer.com/chapter/10.1007/978-3-030-49795-8_54">Read the paper on Springer</a></p>'],
  ['/contact', 'Contact', 'Contact Dhruv Doshi', `<p>${escapeHtml(profile.availability)}</p><p>Email: <a href="mailto:${profile.email}">${profile.email}</a></p>`],
  ['/pictures', 'Photo archive', 'Photo archive', '<p>Travel, milestones, people, and places outside software engineering work.</p>'],
];

for (const [pathname, title, heading, body] of staticRoutes) {
  await writeRoute(pathname, { title, description: `${heading}. Dhruv Doshi, Staff Software Developer and Enterprise Architect.`, content: page(heading, body) });
}
