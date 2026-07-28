import ContactIcons from '../components/Contact/ContactIcons';
import Main from '../layouts/Main';
import { profile } from '../data/profile';

const Contact = () => (
  <Main
    title="Contact"
    description="Contact Dhruv Doshi about staff software engineering, platform architecture, observability, and applied AI work."
  >
    <section className="contact-page page-shell">
      <div>
        <p className="eyebrow">Contact</p>
        <h1 data-testid="heading">Let’s discuss a problem worth <em>solving.</em></h1>
        <p>{profile.availability}</p>
      </div>
      <div className="contact-card">
        <span className="contact-card__label">Best place to start</span>
        <a className="contact-card__email" href={`mailto:${profile.email}`}>{profile.email}</a>
        <p>Share the context, the constraints, and what a good outcome looks like. I’ll respond with a useful next step.</p>
        <a className="button button--primary" href={`mailto:${profile.email}?subject=Engineering%20conversation`}>Write an email</a>
      </div>
      <div className="contact-page__social">
        <span className="section-label">Elsewhere</span>
        <ContactIcons />
      </div>
    </section>
  </Main>
);

export default Contact;
