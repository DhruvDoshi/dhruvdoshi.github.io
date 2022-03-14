import React from 'react';
import { Link } from 'react-router-dom';

import ContactIcons from '../Contact/ContactIcons';
import 'font-awesome/css/font-awesome.min.css';


const { PUBLIC_URL } = process.env; // set automatically from package.json:homepage

const SideBar = () => (
  <section id="sidebar">
    <section id="intro">
      <Link to="/" className="logo">
        <img src={`${PUBLIC_URL}/images/me.jpeg`} alt="" />
      </Link>
      <header>
        <h2>Ani Petrosyan</h2>
        <p><a href="apetrosyan071@gmail.com">apetrosyan071@gmail.com</a></p>
      </header>
    </section>

    <section className="blurb">
      <h2>About</h2>
      <p> Hi, I&apos;m Ani. I like building things. Hi, I'm Ani. I like building things. I was 12 years old when I became a student at TUMO Center for Creative Technologies where I learned programming and which helped me to inundate every aspect of my waking life with technology.
      In 2021, out of 120 participants, I was the only Armenian who was a participant in Barcelona International Youth Science Challenge (BIYSC )which was held in Barcelona, Spain.</p>
      <ul className="actions">
        <li>
          {!window.location.pathname.includes('/resume') ? <Link to="/resume" className="button">Learn More</Link> : <Link to="/about" className="button">About Me</Link>}
        </li>
      </ul>
    </section>

    <section id="footer">
      <ContactIcons />
      <p className="copyright">&copy; Ani Petrosyan </p>
    </section>
  </section>
);

export default SideBar;
