import { Link, useSearchParams } from 'react-router';

import Main from '../layouts/Main';
import { notes, topics } from '../data/notes';

const formatDate = (date) => new Intl.DateTimeFormat('en-CA', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
}).format(new Date(`${date}T00:00:00Z`));

const Notes = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const topic = searchParams.get('topic') || 'All';

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
      description="Technical notes by Dhruv Doshi on AI systems, agent security, distributed systems, observability, platform engineering, cloud architecture, and the blockchain archive."
      pageType="CollectionPage"
    >
      <section className="notes-index page-shell" aria-labelledby="notes-title">
        <div className="notes-toolbar">
          <h1 id="notes-title" data-testid="heading">Notes</h1>
          <label className="notes-search">
            <span className="sr-only">Search notes</span>
            <input
              type="search"
              value={query}
              placeholder={`Search ${notes.length} notes`}
              onChange={(event) => updateParam('q', event.target.value)}
            />
          </label>
        </div>

        <nav className="collection-links" aria-label="Related technical writing">
          <Link to="/guides">Technical guides</Link>
          <Link to="/topics">Browse topics</Link>
          <Link to="/search">Search the whole site</Link>
        </nav>

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
