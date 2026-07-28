import { useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import Main from '../layouts/Main';
import { findGuide } from '../data/guides';
import { findNote, slugify } from '../data/notes';
import { topicSlug } from '../data/search';

const headingText = (children) => Array.isArray(children)
  ? children.map((child) => (typeof child === 'string' ? child : '')).join('')
  : String(children);

const formatDate = (date) => new Intl.DateTimeFormat('en-CA', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
}).format(new Date(`${date}T00:00:00Z`));

const Guide = () => {
  const { slug } = useParams();
  const guide = findGuide(slug);
  const headings = useMemo(() => guide?.body
    .split('\n')
    .filter((line) => /^##\s+/.test(line))
    .map((line) => line.replace(/^##\s+/, '').trim()) || [], [guide]);

  if (!guide) return <Navigate to="/not-found" replace />;

  const relatedNotes = guide.relatedNotes.map(findNote).filter(Boolean);

  return (
    <Main
      title={guide.title}
      description={guide.description}
      type="article"
      published={guide.published}
      modified={guide.reviewed}
      breadcrumbs={[
        { name: 'Guides', path: '/guides' },
        { name: guide.title, path: `/guides/${guide.slug}` },
      ]}
    >
      <article className="note-page page-shell">
        <header className="note-header">
          <Link className="note-back" to="/guides">← All guides</Link>
          <p className="note-topic">{guide.topics.join(' · ')}</p>
          <h1 data-testid="heading">{guide.title}</h1>
          <p className="guide-description">{guide.description}</p>
          <div className="note-meta">
            <span>Published <time dateTime={guide.published}>{formatDate(guide.published)}</time></span>
            <span>Last reviewed <time dateTime={guide.reviewed}>{formatDate(guide.reviewed)}</time></span>
            <span>{guide.readTime} min read</span>
          </div>
        </header>

        <div className="note-layout">
          <aside className="note-aside">
            <nav aria-label="On this page">
              <span>On this page</span>
              {headings.map((heading) => <a href={`#${slugify(heading)}`} key={heading}>{heading}</a>)}
            </nav>
          </aside>
          <div className="article-prose">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children, ...props }) => (
                  href?.startsWith('/')
                    ? <Link to={href} {...props}>{children}</Link>
                    : <a href={href} target="_blank" rel="noreferrer" {...props}>{children}</a>
                ),
                h2: ({ children, ...props }) => <h2 id={slugify(headingText(children))} {...props}>{children}</h2>,
              }}
            >
              {guide.body}
            </ReactMarkdown>
          </div>
        </div>

        <section className="related-content" aria-labelledby="guide-related-notes">
          <h2 id="guide-related-notes">Notes behind this guide</h2>
          <div className="related-link-list">
            {relatedNotes.map((note) => (
              <Link to={`/notes/${note.slug}`} key={note.slug}>
                <strong>{note.title}</strong>
                <span>{note.topic} · {note.readTime} min</span>
              </Link>
            ))}
          </div>
          <p className="related-topics">Topics: {guide.topics.map((topic, index) => <span key={topic}>{index > 0 && ' · '}<Link to={`/topics/${topicSlug(topic)}`}>{topic}</Link></span>)}</p>
        </section>
      </article>
    </Main>
  );
};

export default Guide;
