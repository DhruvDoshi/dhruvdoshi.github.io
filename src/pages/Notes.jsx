import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import Main from '../layouts/Main';
import { featuredNotes, notes, topics } from '../data/notes';

const formatDate = (date) => new Intl.DateTimeFormat('en-CA', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
}).format(new Date(`${date}T00:00:00Z`));

const Notes = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchRef = useRef(null);
  const query = searchParams.get('q') || '';
  const topic = searchParams.get('topic') || 'All';

  useEffect(() => {
    const focusSearch = (event) => {
      if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  const filteredNotes = notes.filter((note) => {
    const matchesTopic = topic === 'All' || note.topic === topic;
    const searchText = `${note.title} ${note.excerpt} ${note.topic}`.toLowerCase();
    return matchesTopic && searchText.includes(query.toLowerCase());
  });

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'All') next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  return (
    <Main
      title="Technical notes"
      description="Dhruv Doshi's technical notes on cloud architecture, blockchain systems, artificial intelligence, and machine learning."
    >
      <section className="notes-hero page-shell">
        <div>
          <p className="eyebrow">2019—2022 archive</p>
          <h1 data-testid="heading">Technical notes</h1>
        </div>
        <div className="notes-hero__summary">
          <strong>{notes.length} notes</strong>
          <p>Articles about cloud computing, distributed ledgers, artificial intelligence, and machine learning. Search by title, subject, or description.</p>
        </div>
      </section>

      <section className="featured-notes page-shell" aria-labelledby="featured-notes-title">
        <div className="compact-section-heading">
          <p className="eyebrow">Featured</p>
          <h2 id="featured-notes-title">Selected notes</h2>
        </div>
        <div className="featured-note-grid">
          {featuredNotes.map((note) => (
            <Link className="featured-note" to={`/notes/${note.slug}`} key={note.slug}>
              <span>{note.topic}</span>
              <h3>{note.title}</h3>
              <p>{note.excerpt}</p>
              <small>{formatDate(note.date)} · {note.readTime} min</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="notes-index page-shell" aria-labelledby="all-notes-title">
        <div className="notes-toolbar">
          <div>
            <h2 id="all-notes-title">All notes</h2>
          </div>
          <label className="notes-search">
            <span className="sr-only">Search technical notes</span>
            <input
              ref={searchRef}
              type="search"
              value={query}
              placeholder="Search notes"
              onChange={(event) => updateParam('q', event.target.value)}
            />
            <kbd>/</kbd>
          </label>
        </div>

        <div className="topic-filter" aria-label="Filter notes by topic">
          {['All', ...topics].map((item) => (
            <button
              type="button"
              className={topic === item ? 'is-active' : undefined}
              aria-pressed={topic === item}
              onClick={() => updateParam('topic', item)}
              key={item}
            >
              {item}
            </button>
          ))}
        </div>

        <p className="notes-result-count" aria-live="polite">{filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}</p>
        <div className="note-list">
          {filteredNotes.map((note) => (
            <Link className="note-row" to={`/notes/${note.slug}`} key={note.slug}>
              <time dateTime={note.date}>{formatDate(note.date)}</time>
              <div>
                <span>{note.topic}</span>
                <h3>{note.title}</h3>
                <p>{note.excerpt}</p>
              </div>
              <small>{note.readTime} min <span aria-hidden="true">↗</span></small>
            </Link>
          ))}
          {filteredNotes.length === 0 && (
            <div className="notes-empty">
              <h3>No matching notes</h3>
              <p>Try a broader phrase or select another topic.</p>
              <button type="button" onClick={() => setSearchParams({}, { replace: true })}>Clear filters</button>
            </div>
          )}
        </div>
      </section>
    </Main>
  );
};

export default Notes;
