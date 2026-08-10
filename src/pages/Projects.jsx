import Main from '../layouts/Main';
import { caseStudies, selectedProjects } from '../data/profile';
import { findNote } from '../data/notes';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

const RelatedNotes = ({ slugs }) => {
  const related = slugs.map(findNote).filter(Boolean);
  return (
    <p className="project-related">
      <strong>Related notes:</strong>{' '}
      {related.map((note, index) => <span key={note.slug}>{index > 0 && ' · '}<Link to={`/notes/${note.slug}`}>{note.title}</Link></span>)}
    </p>
  );
};

RelatedNotes.propTypes = {
  slugs: PropTypes.arrayOf(PropTypes.string).isRequired,
};

const Projects = () => (
  <Main
    title="Selected work"
    description="Selected AI systems, platform engineering, distributed systems, observability, and product work by Dhruv Doshi."
    pageType="CollectionPage"
  >
    <header className="utility-page-header page-shell">
      <h1 data-testid="heading">Work</h1>
      <p>Hands-on work across AI systems, distributed platforms, observability, architecture automation, and regulated product engineering.</p>
    </header>

    <section className="case-study-stack page-shell">
      {caseStudies.map((study) => (
        <article className="case-study" id={study.slug} key={study.slug}>
          <header className="case-study__header">
            <div>
              <p>{study.eyebrow}</p>
              <h2>{study.title}</h2>
            </div>
            <span>{study.status}</span>
          </header>
          <div className="case-study__body">
            <div>
              <p className="case-study__summary">{study.summary}</p>
            </div>
            <div>
              <h3>Responsibilities</h3>
              <ul className="detail-list">
                {study.details.map((detail) => <li key={detail}>{detail}</li>)}
              </ul>
            </div>
            <aside className="outcome-block">
              <strong>Outcome</strong>
              <p>{study.outcome}</p>
            </aside>
          </div>
          <p className="case-study__tools"><strong>Technologies:</strong> {study.technologies.join(', ')}</p>
          <RelatedNotes slugs={study.relatedNotes} />
        </article>
      ))}
    </section>

    <section className="section">
      <div className="page-shell">
        <div className="section-heading">
          <div>
            <h2>Research and independent projects</h2>
          </div>
        </div>
        <div className="project-grid">
          {selectedProjects.map((project) => (
            <article className="project-card" id={project.slug} key={project.title}>
              <p className="project-card__type">{project.type}</p>
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              {project.link && <a href={project.link} target="_blank" rel="noreferrer">{project.linkLabel} <span aria-hidden="true">↗</span></a>}
              <RelatedNotes slugs={project.relatedNotes} />
            </article>
          ))}
        </div>
      </div>
    </section>
  </Main>
);

export default Projects;
