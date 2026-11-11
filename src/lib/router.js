import { useEffect, useState } from 'react';

// Minimal hash router (#/scan, #/review, #/solve) so the app needs no router dependency.
// A query can follow the route, e.g. #/scan?face=R, to open a specific face.
export const ROUTES = ['home', 'scan', 'review', 'solve'];

const readHash = () => window.location.hash.replace(/^#\/?/, '');

const readRoute = () => {
  const name = readHash().split(/[/?]/)[0];
  return ROUTES.includes(name) ? name : 'home';
};

const readParams = () => new URLSearchParams(readHash().split('?')[1] ?? '');

export function useRoute() {
  const [route, setRoute] = useState(readRoute);
  useEffect(() => {
    const onChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

/** Current hash query parameters, updated on navigation. */
export function useHashParams() {
  const [params, setParams] = useState(readParams);
  useEffect(() => {
    const onChange = () => setParams(readParams());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return params;
}

export function navigate(route, query) {
  window.location.hash = query ? `/${route}?${new URLSearchParams(query)}` : `/${route}`;
}
