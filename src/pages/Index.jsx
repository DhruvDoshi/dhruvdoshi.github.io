import { Link } from 'react-router-dom';

import Main from '../layouts/Main';
import {
  capabilities,
  caseStudies,
  impact,
  profile,
} from '../data/profile';
import { notes } from '../data/notes';

const recentNotes = notes.slice(0, 4);

const formatNoteDate = (date) => new Intl.DateTimeFormat('en-CA', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
}).format(new Date(`${date}T00:00:00Z`));

const Index = () => (
  <Main>
    <section className="hero hero--compact page-shell">
      <div className="hero__copy">
        <div className="hero__status"><span /> Available for staff-level conversations</div>
        <p className="eyebrow">Staff software developer · Enterprise architect · Toronto</p>
        <h1 data-testid="heading">I make complex systems easier to <em>ship.</em></h1>
        <p className="hero__lede">{profile.introduction}</p>
        <div className="button-row">
          <Link className="button button--primary" to="/projects">Explore selected work</Link>
          <Link className="button button--text" to="/resume">View experience <span aria-hidden="true">↗</span></Link>
        </div>
      </div>

      <aside className="signal-panel" aria-label="Current engineering focus">
        <div className="signal-panel__header"><span>Current focus</span><span>2026</span></div>
        <dl>
          <div><dt>Building</dt><dd>Enterprise architecture platforms</dd></div>
          <div><dt>Scaling</dt><dd>Observable, vendor-neutral systems</dd></div>
          <div><dt>Exploring</dt><dd>Governed AI and RAG workflows</dd></div>
          <div><dt>Working from</dt><dd>Toronto, Canada</dd></div>
        </dl>
        <Link to="/about">How I work <span aria-hidden="true">↗</span></Link>
      </aside>
    </section>

    <section className="impact-strip" aria-label="Selected impact">
      <div className="page-shell impact-strip__grid">
        {impact.map((item) => (
          <div className="impact-item" key={item.value}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </section>

    <section className="section section--compact page-shell" id="selected-work">
      <div className="compact-section-heading">
        <div>
          <p className="eyebrow">Selected work</p>
          <h2>Systems built for real constraints</h2>
        </div>
        <Link to="/projects">All case studies <span aria-hidden="true">↗</span></Link>
      </div>

      <div className="case-list">
        {caseStudies.map((study, index) => (
          <article className="case-row" key={study.slug}>
            <div className="case-row__index">0{index + 1}</div>
            <div className="case-row__content">
              <div className="case-row__meta">
                <span>{study.eyebrow}</span>
                <span className="status-badge">{study.status}</span>
              </div>
              <h3>{study.title}</h3>
              <p>{study.summary}</p>
              <ul className="tag-list" aria-label={`${study.title} technologies`}>
                {study.technologies.map((technology) => <li key={technology}>{technology}</li>)}
              </ul>
            </div>
            <Link className="case-row__link" to={`/projects#${study.slug}`} aria-label={`Read more about ${study.title}`}>View case <span aria-hidden="true">↗</span></Link>
          </article>
        ))}
      </div>
    </section>

    <section className="home-notes section--tinted">
      <div className="page-shell home-notes__layout">
        <div className="home-notes__intro">
          <p className="eyebrow">Technical notes</p>
          <h2>Writing is part of the engineering work.</h2>
          <p>{notes.length} notes across cloud architecture, blockchain systems, and machine learning.</p>
          <Link className="button button--secondary" to="/notes">Browse the archive</Link>
        </div>
        <div className="home-note-list">
          {recentNotes.map((note) => (
            <Link to={`/notes/${note.slug}`} key={note.slug}>
              <span>{note.topic}</span>
              <strong>{note.title}</strong>
              <small>{formatNoteDate(note.date)} · {note.readTime} min</small>
            </Link>
          ))}
        </div>
      </div>
    </section>

    <section className="section section--compact">
      <div className="page-shell">
        <div className="compact-section-heading">
          <div>
            <p className="eyebrow">Technical range</p>
            <h2>Range with a reason</h2>
          </div>
        </div>
        <div className="capability-grid">
          {capabilities.map((capability) => (
            <article className="capability-card" key={capability.title}>
              <h3>{capability.title}</h3>
              <p>{capability.description}</p>
              <p className="capability-card__tools">{capability.tools.join(' · ')}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="contact-band page-shell">
      <p className="eyebrow">The next problem</p>
      <h2>Shape the architecture. Challenge the implementation.</h2>
      <div>
        <p>{profile.availability}</p>
        <Link className="button button--primary" to="/contact">Start a conversation</Link>
      </div>
    </section>
  </Main>
);

export default Index;
