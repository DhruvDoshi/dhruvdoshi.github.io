import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router';

import Main from '../layouts/Main';
import { search, searchEntries, topicSlug } from '../data/search';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchRef = useRef(null);
  const query = searchParams.get('q') || '';
  const results = search(query);

  useEffect(() => {
    searchRef.current?.focus();
    const focusSearch = (event) => {
      if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  const setQuery = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('q', value);
    else next.delete('q');
    setSearchParams(next, { replace: true });
  };

  return (
    <Main
      title={query ? `Search: ${query}` : 'Search'}
      description="Search Dhruv Doshi's technical notes, guides, projects, research, and professional experience."
      pageType="CollectionPage"
    >
      <section className="search-page page-shell" aria-labelledby="search-title">
        <header className="search-page__header">
          <h1 id="search-title" data-testid="heading">Search</h1>
          <form role="search" onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="site-search">Search notes, guides, work, research, and experience</label>
            <div className="search-input-row">
              <input
                id="site-search"
                ref={searchRef}
                type="search"
                aria-keyshortcuts="/"
                value={query}
                autoComplete="off"
                placeholder={`Search ${searchEntries.length} pages and records`}
                onChange={(event) => setQuery(event.target.value)}
              />
              {query && <button type="button" onClick={() => setQuery('')}>Clear</button>}
            </div>
          </form>
        </header>

        <p className="search-summary" aria-live="polite">
          {query ? `${results.length} result${results.length === 1 ? '' : 's'} for “${query}”` : `Browse all ${results.length} indexed pages and records`}
        </p>

        <div className="search-results">
          {results.map((result) => (
            <article className="search-result" key={result.id}>
              <div className="search-result__meta">
                <span>{result.kind}</span>
                {result.date && <time dateTime={result.date}>{result.date.slice(0, 4)}</time>}
              </div>
              <div>
                <h2><Link to={result.href}>{result.title}</Link></h2>
                <p>{result.description}</p>
                <div className="search-result__topics">
                  {result.topics.map((topic) => <Link to={`/topics/${topicSlug(topic)}`} key={topic}>{topic}</Link>)}
                </div>
              </div>
            </article>
          ))}
          {results.length === 0 && (
            <div className="search-empty">
              <h2>No matching content</h2>
              <p>Try fewer words or browse the <Link to="/topics">topic index</Link>.</p>
            </div>
          )}
        </div>
      </section>
    </Main>
  );
};

export default Search;
