import { Link } from 'react-router';

import Main from '../layouts/Main';
import {
  capabilities,
  caseStudies,
  impact,
  profile,
} from '../data/profile';
import { homepageGuides, homepageNotes } from '../data/homepage';

const formatNoteDate = (date) => new Intl.DateTimeFormat('en-CA', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
}).format(new Date(`${date}T00:00:00Z`));

const Index = () => (
  <Main pageType="ProfilePage">
    <header className="document-intro page-shell">
      <h1 data-testid="heading">Dhruv Doshi</h1>
      <p className="document-intro__role">{profile.role}</p>
      <p className="document-intro__summary">{profile.introduction}</p>
      <p className="document-intro__links">
        <Link to="/resume">Experience</Link>
        <Link to="/projects">Selected work</Link>
        <Link to="/notes">Technical notes</Link>
        <Link to="/guides">Technical guides</Link>
        <a href={`mailto:${profile.email}`}>Email</a>
      </p>
    </header>

    <section className="document-section page-shell" aria-labelledby="scope-heading">
      <header className="section-index"><h2 id="scope-heading">Work at a glance</h2></header>
      <dl className="impact-strip__grid">
        {impact.map((item) => (
          <div className="impact-item" key={item.value}>
            <dt>{item.value}</dt>
            <dd>{item.label}</dd>
          </div>
        ))}
      </dl>
    </section>

    <section className="document-section page-shell" id="selected-work">
      <header className="compact-section-heading">
        <h2>Selected work</h2>
        <Link to="/projects">All work</Link>
      </header>

      <div className="case-list">
        {caseStudies.map((study) => (
          <article className="case-row" key={study.slug}>
            <div className="case-row__content">
              <p className="case-row__meta">{study.eyebrow} · {study.status}</p>
              <h3>{study.title}</h3>
              <p>{study.summary}</p>
              <p className="case-row__tools"><strong>Technologies:</strong> {study.technologies.join(', ')}</p>
            </div>
            <Link className="case-row__link" to={`/projects#${study.slug}`} aria-label={`Read more about ${study.title}`}>Details</Link>
          </article>
        ))}
      </div>
    </section>

    <section className="document-section page-shell">
      <div className="home-notes__layout">
        <header className="home-notes__intro">
          <h2>Guides</h2>
          <Link to="/topics">Browse topics</Link>
        </header>
        <div className="home-note-list">
          {homepageGuides.map((guide) => (
            <Link to={`/guides/${guide.slug}`} key={guide.slug}>
              <strong>{guide.title}</strong>
              <span>{guide.topic}</span>
              <time dateTime={guide.reviewed}>Reviewed {formatNoteDate(guide.reviewed)}</time>
            </Link>
          ))}
        </div>
      </div>
    </section>

    <section className="document-section page-shell">
      <div className="home-notes__layout">
        <header className="home-notes__intro">
          <h2>Notes</h2>
          <Link to="/notes">All notes</Link>
        </header>
        <div className="home-note-list">
          {homepageNotes.map((note) => (
            <Link to={`/notes/${note.slug}`} key={note.slug}>
              <strong>{note.title}</strong>
              <span>{note.topic}</span>
              <time dateTime={note.date}>{formatNoteDate(note.date)} · {note.readTime} min</time>
            </Link>
          ))}
        </div>
      </div>
    </section>

    <section className="document-section page-shell">
      <header className="compact-section-heading"><h2>Engineering scope</h2></header>
      <div className="capability-grid">
        {capabilities.map((capability) => (
          <article className="capability-card" key={capability.title}>
            <h3>{capability.title}</h3>
            <p>{capability.description}</p>
            <p className="capability-card__tools">{capability.tools.join(' · ')}</p>
          </article>
        ))}
      </div>
    </section>

  </Main>
);

export default Index;
