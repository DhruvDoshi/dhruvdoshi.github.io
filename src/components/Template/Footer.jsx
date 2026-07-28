import { Link } from 'react-router';

import { profile } from '../../data/profile';

const Footer = () => (
  <footer className="site-footer">
    <div className="page-shell site-footer__grid">
      <p><strong>Dhruv Doshi</strong> · {profile.location} · <a href={`mailto:${profile.email}`}>{profile.email}</a></p>
      <div className="site-footer__links">
        <Link to="/resume">Resume</Link>
        <Link to="/notes">Notes</Link>
        <Link to="/guides">Guides</Link>
        <Link to="/topics">Topics</Link>
        <Link to="/search">Search</Link>
        <Link to="/research">Research</Link>
        <a href="https://www.linkedin.com/in/dhruvdoshi25071999" target="_blank" rel="noreferrer">LinkedIn</a>
        <a href="https://github.com/DhruvDoshi" target="_blank" rel="noreferrer">GitHub</a>
      </div>
      <div className="site-footer__machine">
        <a href="/sitemap.xml">Sitemap</a>
        <a href="/feed.xml">RSS</a>
        <a href="/llms.txt">LLMs</a>
      </div>
      <p className="site-footer__legal">© {new Date().getFullYear()} Dhruv Doshi</p>
    </div>
  </footer>
);

export default Footer;
