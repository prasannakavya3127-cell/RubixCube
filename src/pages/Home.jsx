import { navigate } from '../lib/router.js';
import { useScan } from '../state/ScanContext.jsx';
import { FACES } from '../cube/cubies.js';

const STEPS = [
  { title: 'Scan six faces', text: 'Use the camera or upload a photo of each face, one at a time.' },
  { title: 'Check the colours', text: 'Review the detected stickers and correct any mistakes by tapping them.' },
  { title: 'Follow the solution', text: 'Step through each move in 3D, with the affected layer highlighted.' },
];

export default function Home() {
  const { capturedFaces, isComplete } = useScan();
  const started = capturedFaces.length > 0;

  return (
    <div className="space-y-10">
      <section className="grid items-center gap-8 md:grid-cols-2">
        <div className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Camera-based solver</p>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Scan your cube. Get a verified solution.
          </h1>
          <p className="text-lg text-slate-600">
            Show each of the six faces to your camera. We read the stickers, check the cube is valid, and walk you through the solve.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('scan')}
              className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              {started ? 'Continue scanning' : 'Start scanning'}
            </button>
            {isComplete && (
              <button
                type="button"
                onClick={() => navigate('review')}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold hover:bg-slate-100"
              >
                Review scanned cube
              </button>
            )}
          </div>
          {started && (
            <p className="text-sm text-slate-600" aria-live="polite">
              Progress: {capturedFaces.length} of {FACES.length} faces captured.
            </p>
          )}
        </div>
        <div className="flex justify-center" aria-hidden="true">
          <CubeIllustration />
        </div>
      </section>

      <section aria-labelledby="how-heading">
        <h2 id="how-heading" className="mb-4 text-xl font-bold">How it works</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="mb-3 grid h-8 w-8 place-items-center rounded-full bg-slate-900 text-sm font-bold text-white">
                {i + 1}
              </span>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <h2 className="mb-1 font-semibold">Tips for good scans</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Use even, diffuse light and avoid glare on the stickers.</li>
          <li>Fill the guide square with one face and hold the cube still.</li>
          <li>Standard colours work best, but any colour scheme is supported; the centres set the reference colours.</li>
        </ul>
      </section>
    </div>
  );
}

function CubeIllustration() {
  const cells = ['#f5f5f0', '#c8102e', '#1f5fd6', '#00a651', '#ffd500', '#ff6a13', '#f5f5f0', '#c8102e', '#00a651'];
  return (
    <div className="grid w-64 grid-cols-3 gap-2 rounded-3xl bg-slate-900 p-4 shadow-xl">
      {cells.map((c, i) => (
        <div key={i} className="aspect-square rounded-md shadow-inner" style={{ background: c }} />
      ))}
    </div>
  );
}
