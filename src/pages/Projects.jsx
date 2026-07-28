import Main from '../layouts/Main';
import { caseStudies, selectedProjects } from '../data/profile';

const Projects = () => (
  <Main
    title="Selected work"
    description="Selected platform engineering, distributed systems, observability, and product work by Dhruv Doshi."
  >
    <header className="utility-page-header page-shell">
      <h1 data-testid="heading">Work</h1>
      <p>Platform engineering, distributed systems, observability, product development, and applied research.</p>
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
            <article className="project-card" key={project.title}>
              <p className="project-card__type">{project.type}</p>
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              {project.link && <a href={project.link} target="_blank" rel="noreferrer">{project.linkLabel} <span aria-hidden="true">↗</span></a>}
            </article>
          ))}
        </div>
      </div>
    </section>
  </Main>
);

export default Projects;
