import PropTypes from 'prop-types';
import { Helmet, HelmetProvider } from 'react-helmet-async';

import Analytics from '../components/Template/Analytics';
import Footer from '../components/Template/Footer';
import Navigation from '../components/Template/Navigation';
import ScrollToTop from '../components/Template/ScrollToTop';

const Main = ({ children, description, title, type }) => (
  <HelmetProvider>
    <Analytics />
    <ScrollToTop />
    <Helmet titleTemplate="%s | Dhruv Doshi" defaultTitle="Dhruv Doshi — Staff Software Developer" defer={false}>
      {title && <title>{title}</title>}
      <meta name="description" content={description} />
      <meta property="og:title" content={title ? `${title} | Dhruv Doshi` : 'Dhruv Doshi — Staff Software Developer'} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
    </Helmet>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <Navigation />
    <main id="main-content">{children}</main>
    <Footer />
  </HelmetProvider>
);

Main.propTypes = {
  children: PropTypes.node,
  title: PropTypes.string,
  description: PropTypes.string,
  type: PropTypes.string,
};

Main.defaultProps = {
  children: null,
  title: null,
  description: 'Dhruv Doshi is a staff software developer and enterprise architect building platforms, distributed systems, and observability infrastructure.',
  type: 'website',
};

export default Main;
