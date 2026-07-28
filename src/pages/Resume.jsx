import Main from '../layouts/Main';
import {
  capabilities,
  education,
  experience,
  profile,
} from '../data/profile';

const Resume = () => (
  <Main
    title="Experience"
    description="Experience, education, and technical capabilities of Dhruv Doshi, Staff Software Developer and Enterprise Architect."
  >
    <header className="page-hero page-shell resume-hero">
      <div>
        <p className="eyebrow">Experience</p>
        <h1 data-testid="heading">Professional experience</h1>
        <p>{profile.summary}</p>
      </div>
      <div className="resume-actions">
        <button type="button" onClick={() => window.print()}>Print or save as PDF</button>
        <a href={`mailto:${profile.email}`}>Request a tailored résumé</a>
      </div>
    </header>

    <section className="resume-layout page-shell">
      <div className="experience-list">
        <div className="section-label">Professional experience</div>
        {experience.map((item) => (
          <article className="experience-item" key={`${item.company}-${item.period}`}>
            <div className="experience-item__rail">
              <span>{item.period}</span>
              <span>{item.location}</span>
            </div>
            <div className="experience-item__content">
              <h2>{item.role}</h2>
              <h3>{item.company}</h3>
              <p>{item.summary}</p>
              {item.highlights.length > 0 && (
                <ul className="detail-list">
                  {item.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}
                </ul>
              )}
            </div>
          </article>
        ))}
      </div>

      <aside className="resume-sidebar">
        <section>
          <div className="section-label">Core capabilities</div>
          {capabilities.map((capability) => (
            <div className="resume-capability" key={capability.title}>
              <h3>{capability.title}</h3>
              <p>{capability.tools.join(', ')}</p>
            </div>
          ))}
        </section>
        <section>
          <div className="section-label">Education</div>
          {education.map((item) => (
            <div className="education-item" key={item.institution}>
              <h3>{item.credential}</h3>
              <p>{item.institution}</p>
              <span>{item.detail}</span>
            </div>
          ))}
        </section>
      </aside>
    </section>
  </Main>
);

export default Resume;
