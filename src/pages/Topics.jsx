import { Link } from 'react-router';

import Main from '../layouts/Main';
import { topics } from '../data/topics';

const Topics = () => (
  <Main
    title="Topics"
    description="Topic index for Dhruv Doshi's technical guides, notes, projects, research, and professional experience."
    pageType="CollectionPage"
  >
    <header className="utility-page-header page-shell">
      <h1 data-testid="heading">Topics</h1>
      <p>Browse related guides, notes, projects, research, and experience through a shared subject index.</p>
    </header>
    <section className="topic-index page-shell" aria-label="Topics">
      {topics.map((topic) => (
        <article key={topic.slug}>
          <h2><Link to={`/topics/${topic.slug}`}>{topic.name}</Link></h2>
          <p>{topic.description}</p>
          <span>{topic.entries.length} item{topic.entries.length === 1 ? '' : 's'}</span>
        </article>
      ))}
    </section>
  </Main>
);

export default Topics;
