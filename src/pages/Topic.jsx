import { Link, Navigate, useParams } from 'react-router';

import Main from '../layouts/Main';
import { findTopic } from '../data/topics';

const Topic = () => {
  const { slug } = useParams();
  const topic = findTopic(slug);
  if (!topic) return <Navigate to="/not-found" replace />;

  return (
    <Main
      title={topic.name}
      description={topic.description}
      pageType="CollectionPage"
      breadcrumbs={[
        { name: 'Topics', path: '/topics' },
        { name: topic.name, path: `/topics/${topic.slug}` },
      ]}
    >
      <header className="utility-page-header page-shell">
        <Link className="note-back" to="/topics">← All topics</Link>
        <h1 data-testid="heading">{topic.name}</h1>
        <p>{topic.description}</p>
      </header>
      <section className="content-index page-shell" aria-label={`${topic.name} content`}>
        {topic.entries.map((entry) => (
          <article className="content-index__row" key={entry.id}>
            <div><span>{entry.kind}</span>{entry.date && <time dateTime={entry.date}>{entry.date.slice(0, 4)}</time>}</div>
            <div>
              <h2><Link to={entry.href}>{entry.title}</Link></h2>
              <p>{entry.description}</p>
            </div>
          </article>
        ))}
      </section>
    </Main>
  );
};

export default Topic;
