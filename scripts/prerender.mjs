import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

import { normalizeNote, slugify } from '../src/data/note-utils.js';
import { guides } from '../src/data/guides.js';
import { caseStudies, capabilities, education, experience, profile, selectedProjects } from '../src/data/profile.js';
import topicDescriptions from '../src/data/topic-definitions.js';

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
const searchEntries = [
  ...guides.map((guide) => ({ title: guide.title, description: guide.description, href: `/guides/${guide.slug}`, kind: 'Guide', date: guide.reviewed, topics: guide.topics })),
  ...caseStudies.map((project) => ({ title: project.title, description: project.summary, href: `/projects#${project.slug}`, kind: 'Project', topics: project.topics })),
  ...selectedProjects.map((project) => ({ title: project.title, description: project.description, href: `/projects#${project.slug}`, kind: 'Project', topics: project.topics })),
  ...experience.map((item) => ({ title: `${item.role} — ${item.company}`, description: item.summary, href: `/resume#experience-${slugify(item.company)}`, kind: 'Experience', topics: item.company === 'Royal Bank of Canada' ? ['Platform architecture', 'Observability', 'AI governance', 'Staff engineering'] : ['Platform architecture'] })),
  { title: 'Decentralized Cloud Storage Based on Blockchain Networking', description: 'Published research on attribute-based access control, blockchain security events, and untrusted cloud storage.', href: '/research', kind: 'Research', date: '2020-01-01', topics: ['Distributed systems', 'Blockchain systems', 'Cloud architecture'] },
  ...notes.map((note) => ({ title: note.title, description: note.excerpt, href: `/notes/${note.slug}`, kind: 'Note', date: note.date, topics: [note.topic] })),
];
const topics = Object.entries(topicDescriptions).map(([name, description]) => ({
  name,
  slug: slugify(name),
  description,
  entries: searchEntries.filter((entry) => entry.topics.includes(name)),
})).filter((topic) => topic.entries.length > 0).sort((a, b) => a.name.localeCompare(b.name));

const renderDocument = ({ breadcrumbs, title, description, pathname, content, type = 'WebPage', datePublished, dateModified }) => {
  const canonical = `${origin}${pathname === '/' ? '/' : `${pathname.replace(/\/$/, '')}/`}`;
  const pageTitle = title ? `${title} | Dhruv Doshi` : 'Dhruv Doshi | Staff Software Developer and Enterprise Architect';
  const person = { '@type': 'Person', '@id': `${origin}/#person`, name: 'Dhruv Doshi', url: `${origin}/`, jobTitle: 'Staff Software Developer and Enterprise Architect', address: { '@type': 'PostalAddress', addressLocality: 'Toronto', addressCountry: 'CA' }, sameAs: ['https://github.com/DhruvDoshi', 'https://www.linkedin.com/in/dhruvdoshi25071999'] };
  const website = { '@type': 'WebSite', '@id': `${origin}/#website`, url: `${origin}/`, name: 'Dhruv Doshi', author: { '@id': person['@id'] }, potentialAction: { '@type': 'SearchAction', target: `${origin}/search/?q={search_term_string}`, 'query-input': 'required name=search_term_string' } };
  const pageEntity = type === 'Article'
    ? { '@type': 'Article', '@id': `${canonical}#article`, headline: title, description, datePublished, dateModified: dateModified || datePublished, mainEntityOfPage: { '@id': canonical }, author: { '@id': person['@id'] }, publisher: { '@id': person['@id'] }, isPartOf: { '@id': website['@id'] } }
    : { '@type': type, '@id': canonical, name: pageTitle, description, url: canonical, isPartOf: { '@id': website['@id'] }, author: { '@id': person['@id'] }, ...(type === 'ProfilePage' ? { mainEntity: { '@id': person['@id'] } } : {}) };
  const breadcrumbItems = pathname === '/' ? [] : [{ name: 'Home', path: '/' }, ...(breadcrumbs || [{ name: title, path: pathname }])];
  const breadcrumb = breadcrumbItems.length ? { '@type': 'BreadcrumbList', '@id': `${canonical}#breadcrumb`, itemListElement: breadcrumbItems.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: `${origin}${item.path === '/' ? '/' : `${item.path.replace(/\/$/, '')}/`}` })) } : null;
  const schema = { '@context': 'https://schema.org', '@graph': [person, website, pageEntity, ...(breadcrumb ? [breadcrumb] : [])] };

  return template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(pageTitle)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${canonical}" />`)
    .replace('</head>', `<meta property="og:title" content="${escapeHtml(pageTitle)}" /><meta property="og:description" content="${escapeHtml(description)}" /><meta property="og:url" content="${canonical}" /><meta property="og:type" content="${type === 'Article' ? 'article' : 'website'}" /><script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script></head>`)
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
  type: 'ProfilePage',
  description: 'Dhruv Doshi is a Staff Software Developer and Enterprise Architect in Toronto working across platform engineering, distributed systems, observability, and applied AI.',
  content: page('Dhruv Doshi', `<p><strong>${profile.role}</strong></p><p>${profile.introduction}</p><h2>Selected work</h2>${list(caseStudies.map((item) => `<a href="/projects#${item.slug}">${escapeHtml(item.title)}</a> — ${escapeHtml(item.summary)}`))}<h2>Technical guides</h2>${list(guides.map((guide) => `<a href="/guides/${guide.slug}">${escapeHtml(guide.title)}</a>`))}<h2>Recent technical notes</h2>${list(notes.slice(0, 8).map((note) => `<a href="/notes/${note.slug}">${escapeHtml(note.title)}</a>`))}`),
});

await writeRoute('/notes', {
  title: 'Notes',
  description: 'Technical notes by Dhruv Doshi on cloud architecture, blockchain systems, artificial intelligence, and machine learning.',
  type: 'CollectionPage',
  content: page('Notes', list(notes.map((note) => `<time datetime="${note.date}">${note.date}</time> · <a href="/notes/${note.slug}">${escapeHtml(note.title)}</a> · ${escapeHtml(note.topic)} · ${note.readTime} min`))),
});

for (const note of notes) {
  const markdown = renderToStaticMarkup(React.createElement(ReactMarkdown, { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeRaw] }, note.body));
  const relatedGuides = guides.filter((guide) => guide.relatedNotes.includes(note.slug));
  const relatedNotes = notes.filter((candidate) => candidate.slug !== note.slug && candidate.topic === note.topic).slice(0, 4);
  const relatedContent = [...relatedGuides.map((guide) => `<a href="/guides/${guide.slug}">${escapeHtml(guide.title)}</a> · Guide`), ...relatedNotes.map((candidate) => `<a href="/notes/${candidate.slug}">${escapeHtml(candidate.title)}</a> · Note`)];
  await writeRoute(`/notes/${note.slug}`, {
    title: note.title,
    description: note.excerpt,
    type: 'Article',
    datePublished: note.date,
    dateModified: note.reviewed || note.date,
    breadcrumbs: [{ name: 'Notes', path: '/notes' }, { name: note.title, path: `/notes/${note.slug}` }],
    content: `<main class="page-shell note-page"><article><header class="note-header"><p><a href="/notes">All notes</a></p><p class="note-topic"><a href="/topics/${slugify(note.topic)}">${escapeHtml(note.topic)}</a></p><h1>${escapeHtml(note.title)}</h1><p><time datetime="${note.date}">${note.date}</time> · ${note.readTime} minute read</p></header><div class="note-layout"><div class="article-prose">${markdown}</div></div>${relatedContent.length ? `<section><h2>Continue reading</h2>${list(relatedContent)}</section>` : ''}</article></main>`,
  });
}

await writeRoute('/search', {
  title: 'Search',
  description: 'Search Dhruv Doshi’s technical notes, guides, projects, research, and professional experience.',
  type: 'CollectionPage',
  content: page('Search', `<p>Search or browse all ${searchEntries.length} indexed pages and records.</p>${list(searchEntries.map((entry) => `<a href="${entry.href}">${escapeHtml(entry.title)}</a> · ${escapeHtml(entry.kind)} · ${escapeHtml(entry.description)}`))}`),
});

await writeRoute('/guides', {
  title: 'Technical guides',
  description: 'Evergreen engineering guides by Dhruv Doshi on platform architecture, observability, AI governance, cloud migration, and staff engineering.',
  type: 'CollectionPage',
  content: page('Technical guides', list(guides.map((guide) => `<time datetime="${guide.reviewed}">Reviewed ${guide.reviewed}</time> · <a href="/guides/${guide.slug}">${escapeHtml(guide.title)}</a> · ${escapeHtml(guide.description)}`))),
});

for (const guide of guides) {
  const markdown = renderToStaticMarkup(React.createElement(ReactMarkdown, { remarkPlugins: [remarkGfm] }, guide.body));
  const related = guide.relatedNotes.map((slug) => notes.find((note) => note.slug === slug)).filter(Boolean);
  await writeRoute(`/guides/${guide.slug}`, {
    title: guide.title,
    description: guide.description,
    type: 'Article',
    datePublished: guide.published,
    dateModified: guide.reviewed,
    breadcrumbs: [{ name: 'Guides', path: '/guides' }, { name: guide.title, path: `/guides/${guide.slug}` }],
    content: `<main class="page-shell note-page"><article><header class="note-header"><p><a href="/guides">All guides</a></p><p class="note-topic">${escapeHtml(guide.topics.join(' · '))}</p><h1>${escapeHtml(guide.title)}</h1><p>${escapeHtml(guide.description)}</p><p>Published <time datetime="${guide.published}">${guide.published}</time> · Last reviewed <time datetime="${guide.reviewed}">${guide.reviewed}</time> · ${guide.readTime} minute read</p></header><div class="note-layout"><div class="article-prose">${markdown}</div></div><section><h2>Notes behind this guide</h2>${list(related.map((note) => `<a href="/notes/${note.slug}">${escapeHtml(note.title)}</a>`))}</section></article></main>`,
  });
}

await writeRoute('/topics', {
  title: 'Topics',
  description: 'Topic index for Dhruv Doshi’s technical guides, notes, projects, research, and professional experience.',
  type: 'CollectionPage',
  content: page('Topics', list(topics.map((topic) => `<a href="/topics/${topic.slug}">${escapeHtml(topic.name)}</a> — ${escapeHtml(topic.description)} (${topic.entries.length})`))),
});

for (const topic of topics) {
  await writeRoute(`/topics/${topic.slug}`, {
    title: topic.name,
    description: topic.description,
    type: 'CollectionPage',
    breadcrumbs: [{ name: 'Topics', path: '/topics' }, { name: topic.name, path: `/topics/${topic.slug}` }],
    content: page(topic.name, `<p>${escapeHtml(topic.description)}</p>${list(topic.entries.map((entry) => `<a href="${entry.href}">${escapeHtml(entry.title)}</a> · ${escapeHtml(entry.kind)} · ${escapeHtml(entry.description)}`))}`),
  });
}

await writeRoute('/projects', {
  title: 'Selected work',
  description: 'Selected platform engineering, distributed systems, observability, and product work by Dhruv Doshi.',
  type: 'CollectionPage',
  content: page('Work', `${caseStudies.map((item) => `<article id="${item.slug}"><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.summary)}</p>${list(item.details.map(escapeHtml))}<p><strong>Technologies:</strong> ${escapeHtml(item.technologies.join(', '))}</p>${list(item.relatedNotes.map((slug) => { const note = notes.find((candidate) => candidate.slug === slug); return note ? `<a href="/notes/${note.slug}">${escapeHtml(note.title)}</a>` : ''; }).filter(Boolean))}</article>`).join('')}<h2>Research and independent projects</h2>${selectedProjects.map((item) => `<article id="${item.slug}"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p></article>`).join('')}`),
});

await writeRoute('/resume', {
  title: 'Resume',
  description: 'Professional experience, education, and technical capabilities of Dhruv Doshi.',
  type: 'ProfilePage',
  content: page('Resume', `<p><a href="/resume/Dhruv-Doshi-Resume.pdf">Open resume PDF</a></p>${experience.map((item) => `<article id="experience-${slugify(item.company)}"><h2>${escapeHtml(item.role)}</h2><p><strong>${escapeHtml(item.company)}</strong> · ${escapeHtml(item.period)} · ${escapeHtml(item.location)}</p><p>${escapeHtml(item.summary)}</p>${list(item.highlights.map(escapeHtml))}</article>`).join('')}<h2>Education</h2>${list(education.map((item) => `${escapeHtml(item.credential)}, ${escapeHtml(item.institution)} — ${escapeHtml(item.detail)}`))}<h2>Engineering scope</h2>${list(capabilities.map((item) => `<strong>${escapeHtml(item.title)}</strong>: ${escapeHtml(item.description)}`))}`),
});

const staticRoutes = [
  ['/about', 'About', 'About', `<p>${escapeHtml(profile.introduction)}</p><p>Dhruv is based in Toronto and works across platform engineering, distributed systems, observability, enterprise architecture, and applied AI.</p>`, 'ProfilePage'],
  ['/research', 'Research', 'Research', '<h2>Decentralized Cloud Storage Based on Blockchain Networking</h2><p>A Springer Nature conference paper by Dhruv Doshi and Satvik Khara on attribute-based access control, blockchain security events, and untrusted cloud storage.</p><p><a href="https://link.springer.com/chapter/10.1007/978-3-030-49795-8_54">Read the paper on Springer</a></p>', 'CollectionPage'],
  ['/contact', 'Contact', 'Contact', `<p>${escapeHtml(profile.availability)}</p><p>Email: <a href="mailto:${profile.email}">${profile.email}</a></p>`],
  ['/pictures', 'Pictures', 'Pictures', '<p>Travel, milestones, people, and places outside software engineering work.</p>', 'CollectionPage'],
];

for (const [pathname, title, heading, body, type] of staticRoutes) {
  await writeRoute(pathname, { title, type, description: `${heading}. Dhruv Doshi, Staff Software Developer and Enterprise Architect.`, content: page(heading, body) });
}
