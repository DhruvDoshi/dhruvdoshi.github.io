import { Link } from 'react-router-dom';

import Main from '../layouts/Main';
import { profile } from '../data/profile';

const About = () => (
  <Main
    title="About"
    description="About Dhruv Doshi, a Toronto-based Staff Software Developer and Enterprise Architect."
  >
    <header className="about-hero page-shell">
      <div className="about-hero__portrait">
        <div className="portrait-frame">
          <img src={`${import.meta.env.BASE_URL}images/me.png`} alt="Dhruv Doshi" />
        </div>
        <span>Toronto · Canada</span>
      </div>
      <div className="about-hero__copy">
        <p className="eyebrow">About</p>
        <h1 data-testid="heading">Engineer, architect, and persistent <em>student.</em></h1>
        <p className="about-hero__lede">I’m Dhruv. I like the part of engineering where a fuzzy, high-stakes problem becomes a system people trust.</p>
        <p>{profile.introduction}</p>
      </div>
    </header>

    <section className="principles section--tinted">
      <div className="page-shell principles__grid">
        <div>
          <p className="eyebrow">How I work</p>
          <h2>Architecture is a team sport.</h2>
        </div>
        <div className="principle-list">
          <article>
            <span>01</span>
            <h3>Evidence over theatre</h3>
            <p>A diagram is the start of a decision, not proof that the system works. I connect design intent to code, telemetry, and ownership.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Standards should remove work</h3>
            <p>Good platforms and governance make the safe path easier. If a standard creates another queue, it is not finished.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Teach the reasoning</h3>
            <p>I use reviews, ADRs, and working sessions to make decisions reusable—not to become the only person who can explain them.</p>
          </article>
        </div>
      </div>
    </section>

    <section className="personal-note page-shell">
      <div>
        <p className="eyebrow">Away from the architecture diagrams</p>
        <h2>I learn by building, writing, and following ideas further than necessary.</h2>
      </div>
      <div>
        <p>That has taken me from blockchain research and a Springer publication to graduate cloud-computing labs, enterprise observability, architecture automation, and applied AI.</p>
        <p>Outside work, you’ll usually find me writing, playing chess, collecting coins, planning travel, or trying to improve my swimming.</p>
        <div className="button-row">
          <a className="button button--text" href="https://blog.doshidhruv.com" target="_blank" rel="noreferrer">Read my writing <span aria-hidden="true">↗</span></a>
          <Link className="button button--text" to="/contact">Get in touch <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
    </section>
  </Main>
);

export default About;
