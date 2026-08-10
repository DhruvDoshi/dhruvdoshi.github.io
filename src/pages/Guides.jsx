import { Link } from 'react-router';

import Main from '../layouts/Main';
import { guides } from '../data/guides';
import { topicSlug } from '../data/search';

const Guides = () => (
  <Main
    title="Technical guides"
    description="Evergreen engineering guides by Dhruv Doshi on platform architecture, observability, AI governance, cloud migration, and staff engineering."
    pageType="CollectionPage"
    items={guides.map((guide) => ({ name: guide.title, path: `/guides/${guide.slug}` }))}
  >
    <header className="utility-page-header page-shell">
      <h1 data-testid="heading">Technical guides</h1>
      <p>Maintained guides that connect practical engineering decisions to the underlying notes, projects, and primary references.</p>
    </header>

    <section className="content-index page-shell" aria-label="Technical guides">
      {guides.map((guide) => (
        <article className="content-index__row" key={guide.slug}>
          <div>
            <time dateTime={guide.reviewed}>Reviewed {guide.reviewed}</time>
            <span>{guide.readTime} min</span>
          </div>
          <div>
            <h2><Link to={`/guides/${guide.slug}`}>{guide.title}</Link></h2>
            <p>{guide.description}</p>
            <p className="content-index__topics">
              {guide.topics.map((topic) => <Link to={`/topics/${topicSlug(topic)}`} key={topic}>{topic}</Link>)}
            </p>
          </div>
        </article>
      ))}
    </section>
  </Main>
);

export default Guides;
