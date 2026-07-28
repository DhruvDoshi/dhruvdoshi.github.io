import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

import Main from '../layouts/Main';
import { findNote, notes, slugify } from '../data/notes';

const formatDate = (date) => new Intl.DateTimeFormat('en-CA', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
}).format(new Date(`${date}T00:00:00Z`));

const headingText = (children) => Array.isArray(children)
  ? children.map((child) => (typeof child === 'string' ? child : '')).join('')
  : String(children);

const Note = () => {
  const { slug } = useParams();
  const note = findNote(slug);
  const [copied, setCopied] = useState(false);
  const headings = useMemo(() => note?.body
    .split('\n')
    .filter((line) => /^##\s+/.test(line))
    .map((line) => line.replace(/^##\s+/, '').replace(/[*_`]/g, '').trim()) || [], [note]);

  if (!note) return <Navigate to="/not-found" replace />;
  if (slug !== note.slug) return <Navigate to={`/notes/${note.slug}`} replace />;

  const noteIndex = notes.findIndex((candidate) => candidate.slug === note.slug);
  const newer = noteIndex > 0 ? notes[noteIndex - 1] : null;
  const older = noteIndex < notes.length - 1 ? notes[noteIndex + 1] : null;

  const copyLink = async () => {
    if (!navigator.clipboard?.writeText) return;
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <Main title={note.title} description={note.excerpt} type="article" published={note.date}>
      <article className="note-page page-shell">
        <header className="note-header">
          <Link className="note-back" to="/notes">← All notes</Link>
          <p className="note-topic">{note.topic}</p>
          <h1 data-testid="heading">{note.title}</h1>
          <div className="note-meta">
            <time dateTime={note.date}>{formatDate(note.date)}</time>
            <span>{note.readTime} min read</span>
            <button type="button" onClick={copyLink}>{copied ? 'Copied' : 'Copy link'}</button>
          </div>
        </header>

        <div className="note-layout">
          {headings.length > 1 && (
            <aside className="note-aside">
              <nav aria-label="On this page">
                <span>On this page</span>
                {headings.map((heading) => <a href={`#${slugify(heading)}`} key={heading}>{heading}</a>)}
              </nav>
            </aside>
          )}

          <div className="article-prose">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                a: ({ href, children, ...props }) => (
                  <a href={href} target={href?.startsWith('http') ? '_blank' : undefined} rel={href?.startsWith('http') ? 'noreferrer' : undefined} {...props}>{children}</a>
                ),
                h2: ({ children, ...props }) => <h2 id={slugify(headingText(children))} {...props}>{children}</h2>,
                img: ({ alt, ...props }) => <img alt={alt || ''} loading="lazy" {...props} />,
              }}
            >
              {note.body}
            </ReactMarkdown>
          </div>
        </div>

        <nav className="note-pagination" aria-label="Adjacent notes">
          {newer ? <Link to={`/notes/${newer.slug}`}><span>Newer</span><strong>{newer.title}</strong></Link> : <span />}
          {older && <Link to={`/notes/${older.slug}`}><span>Older</span><strong>{older.title}</strong></Link>}
        </nav>
      </article>
    </Main>
  );
};

export default Note;
