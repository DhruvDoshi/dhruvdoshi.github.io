import { normalizeNote, slugify } from './note-utils';

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
  .sort((a, b) => b.date.localeCompare(a.date));

const topics = [...new Set(notes.map((note) => note.topic))];
const featuredNotes = notes.filter((note) => note.featured);
const findNote = (slug) => notes.find((note) => note.slug === slug || note.aliases.includes(slug));

export { featuredNotes, findNote, notes, slugify, topics };
