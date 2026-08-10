import { normalizeNote, slugify } from './note-utils';
import { guides } from './guides';
import { homepageNoteSlugs } from './homepage';
import { caseStudies, selectedProjects } from './profile';

const noteModules = import.meta.glob('../content/notes/*.md', {
  eager: true,
  import: 'default',
  query: '?raw',
});

const notes = Object.entries(noteModules)
  .map(([path, raw]) => {
    const sourceSlug = path.split('/').pop().replace(/\.md$/, '');
    const note = normalizeNote(sourceSlug, raw);
    return { ...note, featured: homepageNoteSlugs.includes(note.slug) };
  })
  .filter((note) => note.status === 'published')
  .sort((a, b) => b.date.localeCompare(a.date));

const topics = [...new Set(notes.map((note) => note.topic))];
const featuredNotes = homepageNoteSlugs.map((slug) => notes.find((note) => note.slug === slug)).filter(Boolean);
const findNote = (slug) => notes.find((note) => note.slug === slug || note.aliases.includes(slug));
const relatedNotes = (note, limit = 4) => notes
  .filter((candidate) => candidate.slug !== note.slug)
  .map((candidate) => ({
    ...candidate,
    relevance: (candidate.topic === note.topic ? 3 : 0)
      + candidate.categories.filter((category) => note.categories.includes(category)).length,
  }))
  .filter((candidate) => candidate.relevance > 0)
  .sort((a, b) => b.relevance - a.relevance || b.date.localeCompare(a.date))
  .slice(0, limit);
const guidesForNote = (note) => guides.filter((guide) => guide.relatedNotes.includes(note.slug));
const projectsForNote = (note) => [...caseStudies, ...selectedProjects]
  .filter((project) => project.relatedNotes.includes(note.slug));

export { featuredNotes, findNote, guidesForNote, notes, projectsForNote, relatedNotes, slugify, topics };
