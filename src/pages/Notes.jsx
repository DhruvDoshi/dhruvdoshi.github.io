import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import Main from '../layouts/Main';
import { notes, topics } from '../data/notes';

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
      title="Notes"
      description="Dhruv Doshi's technical notes on cloud architecture, blockchain systems, artificial intelligence, and machine learning."
    >
      <section className="notes-index page-shell" aria-labelledby="notes-title">
        <div className="notes-toolbar">
          <h1 id="notes-title" data-testid="heading">Notes</h1>
          <label className="notes-search">
            <span className="sr-only">Search notes</span>
            <input
              ref={searchRef}
              type="search"
              value={query}
              placeholder="Search 35 notes"
              onChange={(event) => updateParam('q', event.target.value)}
            />
            <kbd aria-hidden="true">/</kbd>
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

        <p className="notes-result-count" aria-live="polite">
          {filteredNotes.length === notes.length ? `${notes.length} notes` : `${filteredNotes.length} of ${notes.length} notes`}
        </p>
        <div className="note-list">
          {filteredNotes.map((note) => (
            <Link className="note-row" to={`/notes/${note.slug}`} key={note.slug}>
              <time dateTime={note.date}>{formatDate(note.date)}</time>
              <div>
                <h3>{note.title}</h3>
                <span>{note.topic}</span>
              </div>
              <small>{note.readTime} min</small>
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
