import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import About from '../pages/About';
import Contact from '../pages/Contact';
import Index from '../pages/Index';
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
