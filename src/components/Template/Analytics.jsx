import { useEffect } from 'react';
import { useLocation } from 'react-router';
import ReactGA from 'react-ga4';

const trackingId = import.meta.env.VITE_GA_TRACKING_ID;

if (import.meta.env.PROD && trackingId) {
  ReactGA.initialize(trackingId);
}

const Analytics = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (import.meta.env.PROD && trackingId) {
      ReactGA.send({
        hitType: 'pageview',
        page: pathname,
      });
    }
  }, [pathname]);

  return null;
};

export default Analytics;
