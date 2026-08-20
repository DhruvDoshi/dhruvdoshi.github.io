import { Link } from 'react-router';

import Main from '../layouts/Main';
import TravelPlaces from '../components/About/TravelPlaces';
import { profile } from '../data/profile';

const About = () => (
  <Main
    title="About"
    pageType="ProfilePage"
    description="About Dhruv Doshi: working principles, interests, and a travel map alongside his work across AI systems, distributed platforms, observability, and security."
  >
    <header className="about-hero page-shell">
      <div className="about-hero__portrait">
        <div className="portrait-frame">
          <img src={`${import.meta.env.BASE_URL}images/me.png`} alt="Dhruv Doshi" />
        </div>
        <span>Toronto · Canada</span>
      </div>
      <div className="about-hero__copy">
        <h1 data-testid="heading">About</h1>
        <p className="about-hero__lede">Hands-on Staff engineer and enterprise architect based in Toronto.</p>
        <p>{profile.introduction}</p>
      </div>
    </header>

    <section className="principles">
      <div className="page-shell principles__grid">
        <div>
          <h2>How I work</h2>
        </div>
        <div className="principle-list">
          <article>
            <h3>Evidence over theatre</h3>
            <p>A diagram is the start of a decision, not proof that the system works. I connect design intent to code, telemetry, and ownership.</p>
          </article>
          <article>
            <h3>Standards should remove work</h3>
            <p>Good platforms and governance make the safe path easier. If a standard creates another queue, it is not finished.</p>
          </article>
          <article>
            <h3>Teach the reasoning</h3>
            <p>I use reviews, ADRs, and working sessions to make decisions reusable—not to become the only person who can explain them.</p>
          </article>
        </div>
      </div>
    </section>

    <section className="personal-note page-shell">
      <div>
        <h2>Background and interests</h2>
      </div>
      <div>
        <p>That has taken me from blockchain research and a Springer publication to graduate cloud-computing labs, enterprise observability, architecture automation, and secure AI systems.</p>
        <p>Outside work, you’ll usually find me writing, playing chess, collecting coins, planning travel, or trying to improve my swimming.</p>
        <div className="button-row">
          <Link to="/notes">Read technical notes</Link>
          <Link to="/contact">Contact me</Link>
        </div>
      </div>
    </section>

    <TravelPlaces />
  </Main>
);

export default About;
