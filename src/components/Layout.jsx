import { ROUTES } from '../lib/router.js';

const LABELS = { home: 'Home', scan: 'Scan', review: 'Review', solve: 'Solve' };

export default function Layout({ route, children }) {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <a href="#/home" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="grid h-7 w-7 grid-cols-2 gap-[2px] rounded-md bg-slate-900 p-[3px]" aria-hidden="true">
              <span className="rounded-[2px] bg-rose-500" />
              <span className="rounded-[2px] bg-white" />
              <span className="rounded-[2px] bg-blue-500" />
              <span className="rounded-[2px] bg-yellow-400" />
            </span>
            Cube Solver
          </a>
          <nav aria-label="Main" className="flex gap-1 text-sm">
            {ROUTES.map((r) => (
              <a
                key={r}
                href={`#/${r}`}
                aria-current={route === r ? 'page' : undefined}
                className={`rounded-md px-3 py-1.5 font-medium transition ${
                  route === r ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {LABELS[r]}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">{children}</main>
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        Processing runs in your browser. No images are uploaded.
      </footer>
    </div>
  );
}
