import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import About from '../pages/About';
import Contact from '../pages/Contact';
import Index from '../pages/Index';
import Note from '../pages/Note';
import Notes from '../pages/Notes';
import NotFound from '../pages/NotFound';
import Projects from '../pages/Projects';
import Resume from '../pages/Resume';

const pages = [
  {
    route: '/',
    heading: 'I make complex systems easier to ship.',
    component: Index,
  },
  {
    route: '/about',
    heading: 'Engineer, architect, and persistent student.',
    component: About,
  },
  {
    route: '/projects',
    heading: 'Systems with consequences.',
    component: Projects,
  },
  {
    route: '/contact',
    heading: 'Let’s discuss a problem worth solving.',
    component: Contact,
  },
  {
    route: '/resume',
    heading: 'Staff-level scope. Builder’s mindset.',
    component: Resume,
  },
  {
    route: '/notes',
    heading: 'Ideas made useful through writing.',
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
  expect(screen.getByText('From the archive')).toBeInTheDocument();
  expect(screen.getAllByRole('img').length).toBeGreaterThan(0);
});
