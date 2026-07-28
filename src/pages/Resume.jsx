import Main from '../layouts/Main';
import { slugify } from '../data/note-utils';
import {
  capabilities,
  education,
  experience,
  profile,
} from '../data/profile';

const Resume = () => (
  <Main
    title="Resume"
    description="Experience, education, and technical capabilities of Dhruv Doshi, Staff Software Developer and Enterprise Architect."
    pageType="ProfilePage"
  >
    <header className="utility-page-header page-shell">
      <h1 data-testid="heading">Resume</h1>
      <p>{profile.role} · {profile.location}</p>
      <div className="resume-actions">
        <a href="/resume/Dhruv-Doshi-Resume.pdf" target="_blank" rel="noreferrer">Open PDF</a>
        <a href="/resume/Dhruv-Doshi-Resume.pdf" download>Download PDF</a>
        <a href={`mailto:${profile.email}`}>Email</a>
      </div>
    </header>

    <section className="resume-layout page-shell" aria-labelledby="experience-title">
      <div className="experience-list">
        <h2 id="experience-title">Experience</h2>
        {experience.map((item) => (
          <article className="experience-item" id={`experience-${slugify(item.company)}`} key={`${item.company}-${item.period}`}>
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
          <h2>Engineering scope</h2>
          {capabilities.map((capability) => (
            <div className="resume-capability" key={capability.title}>
              <h3>{capability.title}</h3>
              <p>{capability.description}</p>
              <span>{capability.tools.join(' · ')}</span>
            </div>
          ))}
        </section>
        <section>
          <h2>Education</h2>
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
