import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Main from './layouts/Main'; // fallback for lazy pages
import './static/css/main.scss'; // All of our styles

// Every route - we lazy load so that each page can be chunked
// NOTE that some of these chunks are very small. We should optimize
// which pages are lazy loaded in the future.
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Index = lazy(() => import('./pages/Index'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Projects = lazy(() => import('./pages/Projects'));
const Resume = lazy(() => import('./pages/Resume'));
const Research = lazy(() => import('./pages/Research'));
// const Blogs = lazy(() => import('./pages/Blogs'));
// const Travel = lazy(() => import('./pages/Travel'));
const Pictures = lazy(() => import('./pages/Pictures'));

const App = () => (
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    <Suspense fallback={<Main />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/about" element={<About />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/resume" element={<Resume />} />
        <Route path="/research" element={<Research />} />
        {/* <Route path="/blogs/" component={Blogs} /> */}
        <Route path="/pictures" element={<Pictures />} />
        {/* <Route path="/travel/" component={Travel} /> */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default App;
