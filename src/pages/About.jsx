import React from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

import Main from '../layouts/Main';
import markdown from '../data/about.md?raw';

const count = markdown.split(/\s+/)
  .map((s) => s.replace(/\W/g, ''))
  .filter((s) => s.length).length;

const LinkRenderer = ({ href, ...props }) => {
  if (href?.startsWith('/')) {
    return <Link to={href} {...props} />;
  }

  return <a href={href} {...props} />;
};

const About = () => (
  <Main
    title="About"
    description="Learn about Dhruv Doshi"
  >
    <article className="post markdown" id="about">
      <header>
        <div className="title">
          <h2 data-testid="heading"><Link to="/about">About Me</Link></h2>
          <p>(in about {count} words)</p>
        </div>
      </header>
      <ReactMarkdown
        components={{
          a: LinkRenderer,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </article>
  </Main>
);

export default About;
