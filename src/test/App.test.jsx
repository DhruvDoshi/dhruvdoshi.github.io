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
import { notes } from '../data/notes';

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

  expect(screen.getByText('16 of 35 notes')).toBeInTheDocument();
});

test('Keeps scheduled notes out of public content', () => {
  expect(notes).toHaveLength(35);
  expect(notes.some((note) => note.title === 'Design the platform as a product')).toBe(false);
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
