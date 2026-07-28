import { Link } from 'react-router-dom';

import Main from '../layouts/Main';
import {
  capabilities,
  caseStudies,
  impact,
  profile,
} from '../data/profile';

const Index = () => (
  <Main>
    <section className="hero page-shell">
      <div className="hero__copy">
        <p className="eyebrow">Staff software developer · Enterprise architect · Toronto</p>
        <h1 data-testid="heading">I make complex systems easier to <em>ship.</em></h1>
        <p className="hero__lede">{profile.introduction}</p>
        <div className="button-row">
          <Link className="button button--primary" to="/projects">Explore selected work</Link>
          <Link className="button button--text" to="/resume">View experience <span aria-hidden="true">↗</span></Link>
        </div>
      </div>

      <aside className="system-map" aria-label="How Dhruv approaches engineering work">
        <div className="system-map__header">
          <span>Operating model</span>
          <span>Staff / 01</span>
        </div>
        <ol>
          <li><span>01</span><strong>Frame the problem</strong><small>Intent, constraints, risk</small></li>
          <li><span>02</span><strong>Design the system</strong><small>Boundaries, data, failure modes</small></li>
          <li><span>03</span><strong>Stay close to delivery</strong><small>Code, reviews, decisions</small></li>
          <li><span>04</span><strong>Make it operable</strong><small>Telemetry, standards, ownership</small></li>
        </ol>
        <p>Architecture is useful when it improves the next engineering decision.</p>
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

    <section className="section page-shell" id="selected-work">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Selected work</p>
          <h2>Platforms built for real constraints.</h2>
        </div>
        <p>Enterprise scale, regulated environments, and systems that need to remain understandable after launch.</p>
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

    <section className="section section--tinted">
      <div className="page-shell">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Technical range</p>
            <h2>Broad enough to connect the system. Deep enough to build it.</h2>
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
      <h2>Looking for someone who can shape the architecture and still challenge the implementation?</h2>
      <div>
        <p>{profile.availability}</p>
        <Link className="button button--primary" to="/contact">Start a conversation</Link>
      </div>
    </section>
  </Main>
);

export default Index;
