import ContactIcons from '../components/Contact/ContactIcons';
import Main from '../layouts/Main';
import { profile } from '../data/profile';

const Contact = () => (
  <Main
    title="Contact"
    description="Contact Dhruv Doshi about Staff-level AI systems, distributed platforms, observability, or selective architecture consulting."
  >
    <section className="contact-page page-shell">
      <div>
        <h1 data-testid="heading">Contact</h1>
        <p>{profile.availability}</p>
        <p>{profile.consulting}</p>
      </div>
      <div className="contact-card">
        <a className="contact-card__email" href={`mailto:${profile.email}`}>{profile.email}</a>
        <p>Include the context, constraints, and intended outcome.</p>
      </div>
      <div className="contact-page__social">
        <ContactIcons />
      </div>
    </section>
  </Main>
);

export default Contact;
