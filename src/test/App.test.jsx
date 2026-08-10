import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';

import About from '../pages/About';
import Contact from '../pages/Contact';
import Index from '../pages/Index';
import Note from '../pages/Note';
import Notes from '../pages/Notes';
import NotFound from '../pages/NotFound';
import Projects from '../pages/Projects';
import Resume from '../pages/Resume';
import Search from '../pages/Search';
import Guide from '../pages/Guide';
import Topic from '../pages/Topic';
import { featuredNotes, notes } from '../data/notes';
import { homepageNotes } from '../data/homepage';

const pages = [
  {
    route: '/',
    heading: 'Dhruv Doshi',
    component: Index,
  },
  {
    route: '/about',
    heading: 'About',
    component: About,
  },
  {
    route: '/projects',
    heading: 'Work',
    component: Projects,
  },
  {
    route: '/contact',
    heading: 'Contact',
    component: Contact,
  },
  {
    route: '/resume',
    heading: 'Resume',
    component: Resume,
  },
  {
    route: '/notes',
    heading: 'Notes',
    component: Notes,
  },
];

// Adds router to Page context and allows us to navigate to the
// correct page. See:
// https://testing-library.com/docs/example-react-router/#reducing-boilerplate
const renderWithRouter = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return render(ui, { wrapper: BrowserRouter });
};

window.scrollTo = () => {};

test('Renders 404 Page Component', () => {
  renderWithRouter(<NotFound />);
  const linkElement = screen.getByTestId('heading');
  expect(linkElement).toBeInTheDocument();
});

const checkPageComponent = (page) => {
  test(`Renders ${page.route} Component`, () => {
    renderWithRouter(<page.component />, { route: page.route });
    expect(screen.getByTestId('heading')).toHaveTextContent(page.heading);
  });
};

pages.forEach((page) => checkPageComponent(page));

test('Renders a consolidated technical note', () => {
  renderWithRouter(
    <Routes>
      <Route path="/notes/:slug" element={<Note />} />
    </Routes>,
    { route: '/notes/deep-learning-explained-from-basics-to-advanced' },
  );

  expect(screen.getByTestId('heading')).toHaveTextContent('Deep Learning Explained - From Basics to Advanced');
  expect(screen.getByText('AI & machine learning')).toBeInTheDocument();
  expect(screen.getAllByRole('img').length).toBeGreaterThan(0);
});

test('Filters notes from the first search control', () => {
  renderWithRouter(<Notes />, { route: '/notes' });
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search notes' }), {
    target: { value: 'cloud' },
  });

  expect(screen.getByText(/of 69 notes$/)).toBeInTheDocument();
});

test('Publishes the historical note series while keeping scheduled content private', () => {
  expect(notes).toHaveLength(69);
  expect(notes.some((note) => note.title === 'Design the platform as a product')).toBe(true);
  expect(notes.some((note) => note.title === 'Architecture decision records that remain useful')).toBe(true);
  expect(notes.every((note) => note.status === 'published')).toBe(true);
});

test('Positions the homepage around hands-on AI systems work without changing the official role', () => {
  renderWithRouter(<Index />, { route: '/' });

  expect(screen.getByText('Staff Software Developer & Enterprise Architect')).toBeInTheDocument();
  expect(screen.getByText(/AI systems, distributed platforms, observability/)).toBeInTheDocument();
  expect([...document.querySelectorAll('.case-row h3')].map((heading) => heading.textContent)).toEqual([
    'Architecture Solution Blueprint platform',
    'Vendor-neutral observability platform',
    'ASB Assist',
    'Healthcare verification platform',
  ]);
});

test('Surfaces a balanced, deliberately ordered set of homepage notes', () => {
  expect(homepageNotes.map((note) => note.slug)).toEqual([
    'production-rag-requires-retrieval-evidence-and-control',
    'finos-calm-and-architecture-as-code',
    'design-safe-tool-use-for-ai-agents',
    'evaluate-llm-systems-as-systems',
    'opentelemetry-pipeline-architecture-for-vendor-neutral-observability',
    'measure-whether-an-internal-platform-creates-leverage',
  ]);
  expect(homepageNotes).toEqual(featuredNotes.map(({
    slug, title, topic, date, readTime,
  }) => ({ slug, title, topic, date, readTime })));
});

test('Links architecture and observability notes to selected work', () => {
  renderWithRouter(
    <Routes><Route path="/notes/:slug" element={<Note />} /></Routes>,
    { route: '/notes/pattern-matching-algorithms-for-architecture-recommendations' },
  );

  expect(screen.getByRole('link', { name: /Architecture Solution Blueprint platform/ })).toHaveAttribute(
    'href',
    '/projects#architecture-blueprints',
  );
});

test('Links OpenTelemetry notes back to the vendor-neutral observability platform', () => {
  renderWithRouter(
    <Routes><Route path="/notes/:slug" element={<Note />} /></Routes>,
    { route: '/notes/opentelemetry-pipeline-architecture-for-vendor-neutral-observability' },
  );

  expect(screen.getByRole('link', { name: /Vendor-neutral observability platform/ })).toHaveAttribute(
    'href',
    '/projects#observability-platform',
  );
});

test('Provides the authored resume PDF instead of a print action', () => {
  renderWithRouter(<Resume />, { route: '/resume' });

  expect(screen.getByRole('link', { name: 'Open PDF' })).toHaveAttribute(
    'href',
    '/resume/Dhruv-Doshi-Resume.pdf',
  );
  expect(screen.queryByText('Print or save as PDF')).not.toBeInTheDocument();
});

test('Searches notes, guides, projects, research, and experience from one field', () => {
  renderWithRouter(<Search />, { route: '/search' });
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search notes, guides, work, research, and experience' }), {
    target: { value: 'OpenTelemetry' },
  });

  expect(screen.getByText('Vendor-neutral observability platform')).toBeInTheDocument();
  expect(screen.getByText(/result.*for “OpenTelemetry”/)).toBeInTheDocument();
});

test('Renders a maintained guide with review and source-note links', () => {
  renderWithRouter(
    <Routes><Route path="/guides/:slug" element={<Guide />} /></Routes>,
    { route: '/guides/platform-architecture' },
  );

  expect(screen.getByTestId('heading')).toHaveTextContent('Platform architecture');
  expect(screen.getByText(/Last reviewed/)).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Notes behind this guide' })).toBeInTheDocument();
});

test('Exposes static topic indexes across content types', () => {
  renderWithRouter(
    <Routes><Route path="/topics/:slug" element={<Topic />} /></Routes>,
    { route: '/topics/platform-architecture' },
  );

  expect(screen.getByTestId('heading')).toHaveTextContent('Platform architecture');
  expect(screen.getByText('Architecture Solution Blueprint platform')).toBeInTheDocument();
  expect(screen.getByText('Platform architecture: from standards to a usable product')).toBeInTheDocument();
});
