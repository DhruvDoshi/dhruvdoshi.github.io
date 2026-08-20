import { useEffect, useRef, useState } from 'react';

import visitedPlaces, { countryCount } from '../../data/travel';

const GLOBE_SCRIPT = 'https://cdn.jsdelivr.net/npm/globe.gl@2.46.1/dist/globe.gl.min.js';
const COUNTRIES_DATA = 'https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson';
const INDIA_STATES_DATA = 'https://cdn.jsdelivr.net/gh/india-in-data/india-states-2019/india_states.geojson';

let globeScriptPromise;

const loadGlobe = () => {
  if (window.Globe) return Promise.resolve(window.Globe);
  if (globeScriptPromise) return globeScriptPromise;

  globeScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GLOBE_SCRIPT;
    script.async = true;
    script.dataset.travelGlobe = 'true';
    script.onload = () => resolve(window.Globe);
    script.onerror = () => reject(new Error('The globe library could not be loaded.'));
    document.head.appendChild(script);
  });

  return globeScriptPromise;
};

const surfaceTexture = (dark) => {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 2;
  const context = canvas.getContext('2d');
  context.fillStyle = dark ? '#202224' : '#eef1f3';
  context.fillRect(0, 0, 2, 2);
  return canvas.toDataURL();
};

const Globe = () => {
  const containerRef = useRef(null);
  const globeRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const [rotating, setRotating] = useState(false);

  useEffect(() => {
    let disposed = false;
    let resizeObserver;
    let themeObserver;
    const abortController = new AbortController();

    const initialise = async () => {
      try {
        const [GlobeFactory, countries, indiaStates] = await Promise.all([
          loadGlobe(),
          fetch(COUNTRIES_DATA, { signal: abortController.signal }).then((response) => {
            if (!response.ok) throw new Error('Country boundaries could not be loaded.');
            return response.json();
          }),
          fetch(INDIA_STATES_DATA, { signal: abortController.signal })
            .then((response) => (response.ok ? response.json() : null))
            .catch(() => null),
        ]);

        if (disposed || !containerRef.current) return;

        const countryFeatures = indiaStates
          ? countries.features.filter(({ properties }) => properties.ISO_A2 !== 'AQ' && properties.ISO_A2 !== 'IN')
          : countries.features.filter(({ properties }) => properties.ISO_A2 !== 'AQ');
        const boundaries = indiaStates
          ? [...countryFeatures, ...indiaStates.features]
          : countryFeatures;
        const container = containerRef.current;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const shouldRotate = !prefersReducedMotion.matches;

        const globe = GlobeFactory()(container)
          .backgroundColor('rgba(0,0,0,0)')
          .width(container.clientWidth || 960)
          .height(container.clientHeight || 560)
          .showAtmosphere(true)
          .atmosphereAltitude(0.16)
          .polygonsData(boundaries)
          .polygonSideColor(() => 'rgba(0,0,0,0)')
          .polygonAltitude(0.006)
          .pointsData(visitedPlaces)
          .pointLat('lat')
          .pointLng('lng')
          .pointColor(() => '#d7472f')
          .pointAltitude(0.012)
          .pointRadius(0.28)
          .pointResolution(14)
          .pointLabel(({ city, country }) => `<div class="travel-tooltip"><strong>${city}</strong><span>${country}</span></div>`)
          .onPointClick(({ lat, lng }) => globe.pointOfView({ lat, lng, altitude: 1.35 }, 900));

        const applyTheme = () => {
          const dark = document.documentElement.dataset.theme === 'dark';
          globe
            .globeImageUrl(surfaceTexture(dark))
            .polygonCapColor(() => (dark ? '#303438' : '#cbd2d8'))
            .polygonStrokeColor(() => (dark ? '#686f76' : '#8f9aa4'))
            .atmosphereColor(dark ? '#93a8c0' : '#6f8eae');
        };

        applyTheme();
        globe.pointOfView({ lat: 22, lng: 78, altitude: 2.2 });

        const controls = globe.controls();
        controls.autoRotate = shouldRotate;
        controls.autoRotateSpeed = 0.4;
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.minDistance = 125;
        controls.maxDistance = 500;

        globeRef.current = globe;
        setRotating(shouldRotate);
        setStatus('ready');

        resizeObserver = new ResizeObserver(([entry]) => {
          globe.width(entry.contentRect.width).height(entry.contentRect.height);
        });
        resizeObserver.observe(container);

        themeObserver = new MutationObserver(applyTheme);
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      } catch (error) {
        if (!disposed && error.name !== 'AbortError') setStatus('error');
      }
    };

    initialise();

    return () => {
      disposed = true;
      abortController.abort();
      resizeObserver?.disconnect();
      themeObserver?.disconnect();
      globeRef.current?._destructor?.();
      globeRef.current = null;
    };
  }, []);

  const toggleRotation = () => {
    const controls = globeRef.current?.controls();
    if (!controls) return;
    controls.autoRotate = !controls.autoRotate;
    setRotating(controls.autoRotate);
  };

  return (
    <div className="travel-globe-wrap">
      <div
        ref={containerRef}
        className="travel-globe"
        role="img"
        aria-label={`Interactive globe marking ${visitedPlaces.length} cities in ${countryCount} countries. Drag to rotate and scroll to zoom.`}
      />
      {status === 'loading' && <p className="travel-globe__status" role="status">Drawing the globe…</p>}
      {status === 'error' && <p className="travel-globe__status">The interactive globe is unavailable. Every place is still listed below.</p>}
      {status === 'ready' && (
        <button className="travel-globe__control" type="button" onClick={toggleRotation} aria-pressed={rotating}>
          {rotating ? 'Pause rotation' : 'Start rotation'}
        </button>
      )}
      <p className="travel-globe__hint" aria-hidden="true">Drag to explore · Scroll to zoom · Select a marker to focus</p>
    </div>
  );
};

const TravelPlaces = () => (
  <section className="about-travel" aria-labelledby="places-title">
    <header className="travel-hero page-shell">
      <div>
        <p className="eyebrow">Travel journal</p>
        <h2 id="places-title">Places I’ve been</h2>
      </div>
      <div className="travel-hero__copy">
        <p>A growing map of cities that have been part of my story—from home bases to memorable stops along the way.</p>
        <dl className="travel-totals" aria-label="Travel totals">
          <div><dt>{visitedPlaces.length}</dt><dd>cities</dd></div>
          <div><dt>{countryCount}</dt><dd>countries</dd></div>
        </dl>
      </div>
    </header>

    <div className="travel-map" aria-labelledby="travel-map-title">
      <h2 className="sr-only" id="travel-map-title">Interactive travel map</h2>
      <Globe />
    </div>

    <section className="travel-ledger page-shell" aria-labelledby="travel-ledger-title">
      <div>
        <p className="eyebrow">The map, in words</p>
        <h2 id="travel-ledger-title">City ledger</h2>
      </div>
      <ol className="travel-place-list">
        {visitedPlaces.map(({ city, country }) => (
          <li key={`${city}-${country}`}>
            <span>{city}</span>
            <span>{country}</span>
          </li>
        ))}
      </ol>
    </section>

    <p className="travel-credit page-shell">
      Page idea inspired by <a href="https://sarthak.site" target="_blank" rel="noreferrer">Sarthak Aggarwal’s places page</a>.
    </p>
  </section>
);

export default TravelPlaces;
