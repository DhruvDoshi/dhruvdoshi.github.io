import { Link } from 'react-router-dom';

import { profile } from '../../data/profile';

const Footer = () => (
  <footer className="site-footer">
    <div className="page-shell site-footer__grid">
      <div>
        <p className="eyebrow">Build with clarity</p>
        <p className="site-footer__statement">Complex systems deserve simple explanations and dependable execution.</p>
      </div>
      <div className="site-footer__contact">
        <a href={`mailto:${profile.email}`}>{profile.email}</a>
        <span>{profile.location}</span>
      </div>
      <div className="site-footer__links">
        <Link to="/notes">Technical notes</Link>
        <Link to="/research">Research</Link>
        <a href="https://www.linkedin.com/in/dhruvdoshi25071999" target="_blank" rel="noreferrer">LinkedIn</a>
        <a href="https://github.com/DhruvDoshi" target="_blank" rel="noreferrer">GitHub</a>
        <Link to="/contact">Contact</Link>
      </div>
      <p className="site-footer__legal">© {new Date().getFullYear()} Dhruv Doshi</p>
    </div>
  </footer>
);

export default Footer;
