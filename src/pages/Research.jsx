import Main from '../layouts/Main';
import { Link } from 'react-router';

const Research = () => (
  <Main
    title="Research"
    description="Published research by Dhruv Doshi in decentralised cloud storage, access control, and blockchain systems."
    pageType="CollectionPage"
  >
    <header className="utility-page-header page-shell">
      <h1 data-testid="heading">Research</h1>
      <p>My early research explored how decentralised ledgers and cryptographic access controls could make untrusted cloud storage more accountable.</p>
    </header>

    <section className="publication page-shell">
      <div className="publication__meta">
        <span>Springer Nature</span>
        <span>2020</span>
        <span>ISBN 978-3-030-49795-8</span>
      </div>
      <div className="publication__body">
        <div>
          <p>Conference paper</p>
          <h2>Decentralized Cloud Storage Based on Blockchain Networking</h2>
          <p className="publication__authors">Dhruv Doshi · Satvik Khara</p>
        </div>
        <div>
          <p>The paper presents a multi-user access-control model for data stored in an untrusted cloud environment. Attribute-based encryption protects the data while a decentralised ledger records security events such as key generation, policy changes, revocation, and access requests.</p>
          <p>The work included a functioning smart-contract prototype and protocols designed to keep private keys and sensitive operations off the ledger.</p>
          <a href="https://link.springer.com/chapter/10.1007/978-3-030-49795-8_54" target="_blank" rel="noreferrer">Read the paper on Springer</a>
          <p className="publication__related">Related: <Link to="/guides/platform-architecture">Platform architecture guide</Link> · <Link to="/notes/what-if-we-combine-blockchain-and-cloud-computing">Blockchain and cloud note</Link> · <Link to="/topics/distributed-systems">Distributed systems topic</Link></p>
        </div>
      </div>
      <div className="publication__topics">
        <span>Cloud storage</span>
        <span>Attribute-based access control</span>
        <span>Encryption</span>
        <span>Smart contracts</span>
        <span>Distributed systems</span>
      </div>
    </section>
  </Main>
);

export default Research;
