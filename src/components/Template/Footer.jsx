import { Link } from 'react-router-dom';

import { profile } from '../../data/profile';

const Footer = () => (
  <footer className="site-footer">
    <div className="page-shell site-footer__grid">
      <div>
        <strong>Dhruv Doshi</strong>
        <p>Staff Software Developer and Enterprise Architect in Toronto.</p>
      </div>
      <div className="site-footer__contact">
        <a href={`mailto:${profile.email}`}>{profile.email}</a>
        <span>{profile.location}</span>
      </div>
      <div className="site-footer__links">
        <Link to="/notes">Notes</Link>
        <Link to="/research">Research</Link>
        <a href="https://www.linkedin.com/in/dhruvdoshi25071999" target="_blank" rel="noreferrer">LinkedIn</a>
        <a href="https://github.com/DhruvDoshi" target="_blank" rel="noreferrer">GitHub</a>
        <Link to="/contact">Contact</Link>
      </div>
      <div className="site-footer__machine">
        <a href="/sitemap.xml">Sitemap</a>
        <a href="/feed.xml">RSS</a>
        <a href="/llms.txt">LLMs</a>
      </div>
      <p className="site-footer__legal">© {new Date().getFullYear()} Dhruv Doshi. Content may be quoted with attribution.</p>
    </div>
  </footer>
);

export default Footer;
