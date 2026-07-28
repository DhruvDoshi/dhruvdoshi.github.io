import PropTypes from 'prop-types';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useLocation } from 'react-router';

import Analytics from '../components/Template/Analytics';
import Footer from '../components/Template/Footer';
import Navigation from '../components/Template/Navigation';
import ScrollToTop from '../components/Template/ScrollToTop';

const Main = ({ breadcrumbs, children, description, modified, pageType, published, title, type }) => {
  const { pathname } = useLocation();
  const canonical = `https://doshidhruv.com${pathname === '/' ? '/' : `${pathname.replace(/\/$/, '')}/`}`;
  const pageTitle = title ? `${title} | Dhruv Doshi` : 'Dhruv Doshi | Staff Software Developer and Enterprise Architect';
  const person = {
    '@type': 'Person',
    '@id': 'https://doshidhruv.com/#person',
    name: 'Dhruv Doshi',
    url: 'https://doshidhruv.com/',
    jobTitle: 'Staff Software Developer and Enterprise Architect',
    address: { '@type': 'PostalAddress', addressLocality: 'Toronto', addressCountry: 'CA' },
    sameAs: ['https://github.com/DhruvDoshi', 'https://www.linkedin.com/in/dhruvdoshi25071999'],
    knowsAbout: ['Platform engineering', 'Distributed systems', 'Observability', 'Enterprise architecture', 'Applied artificial intelligence'],
  };
  const website = {
    '@type': 'WebSite',
    '@id': 'https://doshidhruv.com/#website',
    url: 'https://doshidhruv.com/',
    name: 'Dhruv Doshi',
    author: { '@id': person['@id'] },
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://doshidhruv.com/search/?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };
  const pageEntity = type === 'article'
    ? {
      '@type': 'Article',
      '@id': `${canonical}#article`,
      headline: title,
      description,
      datePublished: published,
      dateModified: modified || published,
      mainEntityOfPage: { '@id': canonical },
      author: { '@id': person['@id'] },
      publisher: { '@id': person['@id'] },
      isPartOf: { '@id': website['@id'] },
    }
    : {
      '@type': pageType,
      '@id': canonical,
      name: pageTitle,
      description,
      url: canonical,
      isPartOf: { '@id': website['@id'] },
      author: { '@id': person['@id'] },
      ...(pageType === 'ProfilePage' ? { mainEntity: { '@id': person['@id'] } } : {}),
    };
  const breadcrumbItems = pathname === '/'
    ? []
    : [{ name: 'Home', path: '/' }, ...(breadcrumbs || [{ name: title, path: pathname }])];
  const breadcrumb = breadcrumbItems.length > 0 ? {
    '@type': 'BreadcrumbList',
    '@id': `${canonical}#breadcrumb`,
    itemListElement: breadcrumbItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `https://doshidhruv.com${item.path === '/' ? '/' : `${item.path.replace(/\/$/, '')}/`}`,
    })),
  } : null;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [person, website, pageEntity, ...(breadcrumb ? [breadcrumb] : [])],
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
        {modified && <meta property="article:modified_time" content={modified} />}
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
  breadcrumbs: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string, path: PropTypes.string })),
  children: PropTypes.node,
  title: PropTypes.string,
  description: PropTypes.string,
  modified: PropTypes.string,
  pageType: PropTypes.oneOf(['WebPage', 'ProfilePage', 'CollectionPage']),
  published: PropTypes.string,
  type: PropTypes.string,
};

Main.defaultProps = {
  breadcrumbs: null,
  children: null,
  title: null,
  description: 'Dhruv Doshi is a staff software developer and enterprise architect building platforms, distributed systems, and observability infrastructure.',
  modified: null,
  pageType: 'WebPage',
  published: null,
  type: 'website',
};

export default Main;
