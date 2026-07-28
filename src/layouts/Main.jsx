import PropTypes from 'prop-types';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

import Analytics from '../components/Template/Analytics';
import Footer from '../components/Template/Footer';
import Navigation from '../components/Template/Navigation';
import ScrollToTop from '../components/Template/ScrollToTop';

const Main = ({ children, description, published, title, type }) => {
  const { pathname } = useLocation();
  const canonical = `https://doshidhruv.com${pathname === '/' ? '' : pathname.replace(/\/$/, '')}`;
  const pageTitle = title ? `${title} | Dhruv Doshi` : 'Dhruv Doshi | Staff Software Developer and Enterprise Architect';
  const structuredData = type === 'article'
    ? {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: title,
      description,
      datePublished: published,
      dateModified: published,
      mainEntityOfPage: canonical,
      author: { '@type': 'Person', name: 'Dhruv Doshi', url: 'https://doshidhruv.com' },
      publisher: { '@type': 'Person', name: 'Dhruv Doshi', url: 'https://doshidhruv.com' },
    }
    : {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Person',
          '@id': 'https://doshidhruv.com/#person',
          name: 'Dhruv Doshi',
          url: 'https://doshidhruv.com',
          jobTitle: 'Staff Software Developer and Enterprise Architect',
          address: { '@type': 'PostalAddress', addressLocality: 'Toronto', addressCountry: 'CA' },
          sameAs: ['https://github.com/DhruvDoshi', 'https://www.linkedin.com/in/dhruvdoshi25071999'],
          knowsAbout: ['Platform engineering', 'Distributed systems', 'Observability', 'Enterprise architecture', 'Applied artificial intelligence'],
        },
        {
          '@type': 'WebSite',
          '@id': 'https://doshidhruv.com/#website',
          url: 'https://doshidhruv.com',
          name: 'Dhruv Doshi',
          author: { '@id': 'https://doshidhruv.com/#person' },
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://doshidhruv.com/notes?q={search_term_string}',
            'query-input': 'required name=search_term_string',
          },
        },
      ],
    };

  return (
    <HelmetProvider>
      <Analytics />
      <ScrollToTop />
      <Helmet htmlAttributes={{ lang: 'en-CA' }} titleTemplate="%s | Dhruv Doshi" defaultTitle="Dhruv Doshi | Staff Software Developer and Enterprise Architect" defer={false}>
        {title && <title>{title}</title>}
        <meta name="description" content={description} />
        <meta name="author" content="Dhruv Doshi" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <link rel="canonical" href={canonical} />
        <link rel="alternate" type="application/rss+xml" title="Dhruv Doshi — Technical Notes" href="https://doshidhruv.com/feed.xml" />
        <meta property="og:site_name" content="Dhruv Doshi" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content={type} />
        <meta property="og:url" content={canonical} />
        <meta property="og:locale" content="en_CA" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={description} />
        {published && <meta property="article:published_time" content={published} />}
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Navigation />
      <main id="main-content">{children}</main>
      <Footer />
    </HelmetProvider>
  );
};

Main.propTypes = {
  children: PropTypes.node,
  title: PropTypes.string,
  description: PropTypes.string,
  published: PropTypes.string,
  type: PropTypes.string,
};

Main.defaultProps = {
  children: null,
  title: null,
  description: 'Dhruv Doshi is a staff software developer and enterprise architect building platforms, distributed systems, and observability infrastructure.',
  published: null,
  type: 'website',
};

export default Main;
