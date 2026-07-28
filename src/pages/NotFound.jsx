import { Link } from 'react-router';

import Main from '../layouts/Main';

const PageNotFound = () => (
  <Main title="Page not found" description="The requested page could not be found.">
    <section className="not-found page-shell">
      <p className="eyebrow">Error 404</p>
      <h1 data-testid="heading">Page not found</h1>
      <p>The page may have moved, or the address may be incorrect.</p>
      <Link to="/">Return to the home page</Link>
    </section>
  </Main>
);

export default PageNotFound;
