import { guides } from './guides';
import { notes } from './notes';
import { caseStudies, experience, selectedProjects } from './profile';
import { slugify, stripMarkup } from './note-utils';

const topicSlug = (topic) => slugify(topic);

const noteEntries = notes.map((note) => ({
  id: `note-${note.slug}`,
  title: note.title,
  description: note.excerpt,
  href: `/notes/${note.slug}`,
  kind: 'Note',
  date: note.date,
  topics: [note.topic],
  searchText: stripMarkup(note.body),
}));

const guideEntries = guides.map((guide) => ({
  id: `guide-${guide.slug}`,
  title: guide.title,
  description: guide.description,
  href: `/guides/${guide.slug}`,
  kind: 'Guide',
  date: guide.reviewed,
  topics: guide.topics,
  searchText: stripMarkup(guide.body),
}));

const projectEntries = [...caseStudies, ...selectedProjects].map((project) => ({
  id: `project-${project.slug}`,
  title: project.title,
  description: project.summary || project.description,
  href: `/projects#${project.slug}`,
  kind: 'Project',
  topics: project.topics,
  searchText: `${project.technologies?.join(' ') || ''} ${project.details?.join(' ') || ''} ${project.outcome || ''}`,
}));

const experienceEntries = experience.map((item) => ({
  id: `experience-${slugify(item.company)}`,
  title: `${item.role} — ${item.company}`,
  description: item.summary,
  href: `/resume#experience-${slugify(item.company)}`,
  kind: 'Experience',
  topics: item.company === 'Royal Bank of Canada'
    ? ['Platform architecture', 'Observability', 'AI governance', 'Staff engineering']
    : ['Platform architecture'],
  searchText: `${item.period} ${item.location} ${item.highlights.join(' ')}`,
}));

const researchEntries = [{
  id: 'research-dcs-bbn',
  title: 'Decentralized Cloud Storage Based on Blockchain Networking',
  description: 'Published research on attribute-based access control, blockchain security events, and untrusted cloud storage.',
  href: '/research',
  kind: 'Research',
  date: '2020-01-01',
  topics: ['Distributed systems', 'Blockchain systems', 'Cloud architecture'],
  searchText: 'Springer Nature smart contracts encryption cryptographic access control DCS-BBN',
}];

const searchEntries = [
  ...guideEntries,
  ...projectEntries,
  ...experienceEntries,
  ...researchEntries,
  ...noteEntries,
];

const search = (query) => {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return searchEntries;

  return searchEntries
    .map((entry) => {
      const title = entry.title.toLowerCase();
      const haystack = `${entry.title} ${entry.description} ${entry.kind} ${entry.topics.join(' ')} ${entry.searchText}`.toLowerCase();
      if (!terms.every((term) => haystack.includes(term))) return null;
      const score = terms.reduce((total, term) => total + (title.includes(term) ? 4 : 1), 0);
      return { ...entry, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
};

export { search, searchEntries, topicSlug };
