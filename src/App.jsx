import { lazy, Suspense } from 'react';
import { ScanProvider } from './state/ScanContext.jsx';
import { useRoute } from './lib/router.js';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Scan from './pages/Scan.jsx';
import Review from './pages/Review.jsx';

// The solver and 3D viewer are large, so they load only when the solve page opens.
const Solve = lazy(() => import('./pages/Solve.jsx'));

const PAGES = {
  home: Home,
  scan: Scan,
  review: Review,
  solve: Solve,
};

export default function App() {
  const route = useRoute();
  const Page = PAGES[route];
  return (
    <ScanProvider>
      <Layout route={route}>
        <Suspense
          fallback={
            <div className="py-24 text-center text-sm text-slate-600" role="status">
              Loading…
            </div>
          }
        >
          <Page />
        </Suspense>
      </Layout>
    </ScanProvider>
  );
}
