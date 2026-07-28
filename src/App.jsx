import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import './static/css/main.scss'; // All of our styles

// Every route - we lazy load so that each page can be chunked
// NOTE that some of these chunks are very small. We should optimize
// which pages are lazy loaded in the future.
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Index = lazy(() => import('./pages/Index'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Note = lazy(() => import('./pages/Note'));
const Notes = lazy(() => import('./pages/Notes'));
const Search = lazy(() => import('./pages/Search'));
const Guides = lazy(() => import('./pages/Guides'));
const Guide = lazy(() => import('./pages/Guide'));
const Topics = lazy(() => import('./pages/Topics'));
const Topic = lazy(() => import('./pages/Topic'));
const LegacyPostRedirect = lazy(() => import('./pages/LegacyPostRedirect'));
const Projects = lazy(() => import('./pages/Projects'));
const Resume = lazy(() => import('./pages/Resume'));
const Research = lazy(() => import('./pages/Research'));
const Pictures = lazy(() => import('./pages/Pictures'));

const App = () => (
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    <Suspense fallback={<div className="route-loader" role="status">Loading page…</div>}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/about" element={<About />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/resume" element={<Resume />} />
        <Route path="/research" element={<Research />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/notes/:slug" element={<Note />} />
        <Route path="/search" element={<Search />} />
        <Route path="/guides" element={<Guides />} />
        <Route path="/guides/:slug" element={<Guide />} />
        <Route path="/topics" element={<Topics />} />
        <Route path="/topics/:slug" element={<Topic />} />
        <Route path="/posts/:slug" element={<LegacyPostRedirect />} />
        <Route path="/blog/*" element={<Notes />} />
        <Route path="/blogs/*" element={<Notes />} />
        <Route path="/pictures" element={<Pictures />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default App;
