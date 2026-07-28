import { normalizeNote, slugify } from './note-utils';
import { guides } from './guides';

const noteModules = import.meta.glob('../content/notes/*.md', {
  eager: true,
  import: 'default',
  query: '?raw',
});

const featuredSlugs = new Set([
  'deep-learning-explained-from-basics-to-advanced',
  'the-fundamentals-of-machine-learning',
  'what-is-cloud-computing',
]);

const notes = Object.entries(noteModules)
  .map(([path, raw]) => {
    const sourceSlug = path.split('/').pop().replace(/\.md$/, '');
    const note = normalizeNote(sourceSlug, raw);
    return { ...note, featured: featuredSlugs.has(note.slug) };
  })
  .filter((note) => note.status === 'published')
  .sort((a, b) => b.date.localeCompare(a.date));

const topics = [...new Set(notes.map((note) => note.topic))];
const featuredNotes = notes.filter((note) => note.featured);
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

export { featuredNotes, findNote, guidesForNote, notes, relatedNotes, slugify, topics };
