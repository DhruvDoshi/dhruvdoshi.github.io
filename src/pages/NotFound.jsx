import { Link } from 'react-router-dom';

import Main from '../layouts/Main';

const PageNotFound = () => (
  <Main title="Page not found" description="The requested page could not be found.">
    <section className="not-found page-shell">
      <p className="eyebrow">404 · Route not found</p>
      <h1 data-testid="heading">This path does not lead to a system.</h1>
      <p>The page may have moved, or the address may be incorrect.</p>
      <Link className="button button--primary" to="/">Return home</Link>
    </section>
  </Main>
);

export default PageNotFound;
