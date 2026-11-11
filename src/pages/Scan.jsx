import { useMemo, useState } from 'react';
import { FACES, FACE_NAMES } from '../cube/cubies.js';
import { navigate, useHashParams } from '../lib/router.js';
import { useScan } from '../state/ScanContext.jsx';
import CameraCapture from '../components/CameraCapture.jsx';
import { sampleImageFile } from '../lib/capture.js';
import { rgbToCss } from '../lib/colors.js';
import { nearestDefaultColour } from '../vision/color.js';

// Which way the top row of each face's grid must point. Faces are read as seen
// from outside the cube, with the cube turned (not flipped) between steps.
const ORIENTATION = {
  U: 'Hold the cube so the top face faces you. The top row of the grid should point toward the back of the cube.',
  R: 'Turn the cube to show the right face. The top row of the grid should point up, toward the top face.',
  F: 'Show the front face. The top row of the grid should point up, toward the top face.',
  D: 'Turn the cube to show the bottom face, viewed from below. The top row of the grid should point toward the front.',
  L: 'Turn the cube to show the left face. The top row of the grid should point up, toward the top face.',
  B: 'Turn the cube to show the back face. The top row of the grid should point up, toward the top face.',
};

export default function Scan() {
  const { captures, capture, capturedFaces, isComplete } = useScan();
  const [mode, setMode] = useState('camera');
  const [uploadError, setUploadError] = useState('');
  const [busy, setBusy] = useState(false);

  // The active face comes from the URL (#/scan?face=R) so retake links work;
  // without one, the first face not yet captured is active.
  const requested = useHashParams().get('face');
  const activeFace = FACES.includes(requested) ? requested : (FACES.find((f) => !captures[f]) ?? 'U');
  const setActiveFace = (face) => navigate('scan', { face });

  const nextMissing = (after) => {
    const start = FACES.indexOf(after);
    for (let i = 1; i <= FACES.length; i++) {
      const f = FACES[(start + i) % FACES.length];
      if (!captures[f]) return f;
    }
    return null;
  };

  const handleSamples = (face, samples) => {
    capture(face, samples);
    setUploadError('');
    const next = nextMissing(face);
    if (next) setActiveFace(next);
  };

  const handleUpload = async (face, file) => {
    if (!file) return;
    setBusy(true);
    setUploadError('');
    try {
      handleSamples(face, await sampleImageFile(file));
    } catch {
      setUploadError('That file could not be read as an image. Try a JPG or PNG photo.');
    } finally {
      setBusy(false);
    }
  };

  const activeCapture = captures[activeFace];
  const activeIndex = FACES.indexOf(activeFace);
  const preview = useMemo(
    () => (activeCapture ? activeCapture.samples.map((rgb) => ({ rgb, name: nearestDefaultColour(rgb) })) : null),
    [activeCapture],
  );

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm font-semibold text-indigo-600">
          Step {activeIndex + 1} of {FACES.length}
        </p>
        <h1 className="text-2xl font-bold sm:text-3xl">Scan the {FACE_NAMES[activeFace]} face</h1>
        <p className="text-slate-600">{ORIENTATION[activeFace]}</p>
      </header>

      <nav aria-label="Faces" className="flex flex-wrap gap-2">
        {FACES.map((f) => {
          const done = Boolean(captures[f]);
          const current = f === activeFace;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFace(f)}
              aria-current={current ? 'step' : undefined}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                current
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : done
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span aria-hidden="true">{done ? '✓' : '○'}</span>
              {FACE_NAMES[f]}
            </button>
          );
        })}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex gap-2" role="tablist" aria-label="Capture method">
            <ModeTab active={mode === 'camera'} onClick={() => setMode('camera')}>Camera</ModeTab>
            <ModeTab active={mode === 'upload'} onClick={() => setMode('upload')}>Upload photo</ModeTab>
          </div>

          {mode === 'camera' ? (
            <CameraCapture
              key={activeFace}
              disabled={busy}
              onCapture={(samples) => handleSamples(activeFace, samples)}
            />
          ) : (
            <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 p-8 text-center hover:border-indigo-400">
              <span className="font-semibold">Choose a photo of the {FACE_NAMES[activeFace]} face</span>
              <span className="text-sm text-slate-500">Crop the photo so the face fills the frame.</span>
              <input
                type="file"
                accept="image/*"
                disabled={busy}
                aria-label={`Upload photo of the ${FACE_NAMES[activeFace]} face`}
                className="text-sm"
                onChange={(e) => handleUpload(activeFace, e.target.files?.[0])}
              />
              {busy && <span className="text-sm text-slate-600">Reading the stickers…</span>}
            </label>
          )}

          {uploadError && <p role="alert" className="text-sm text-rose-700">{uploadError}</p>}
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold">
              {activeCapture ? `Captured ${FACE_NAMES[activeFace]} face` : `${FACE_NAMES[activeFace]} face not captured yet`}
            </h2>
            {preview ? (
              <div className="mx-auto grid w-40 grid-cols-3 gap-1" aria-label="Captured sticker colours">
                {preview.map((p, i) => (
                  <div
                    key={i}
                    title={p.name}
                    className="aspect-square rounded-sm ring-1 ring-black/10"
                    style={{ background: rgbToCss(p.rgb) }}
                  />
                ))}
              </div>
            ) : (
              <EmptyPreview />
            )}
            <p className="mt-3 text-xs text-slate-500">
              Captured faces can be retaken at any time. Colours are checked on the review screen.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold">Progress</h2>
            <p className="text-sm text-slate-600">{capturedFaces.length} of {FACES.length} faces captured</p>
            <button
              type="button"
              disabled={!isComplete}
              onClick={() => navigate('review')}
              className="mt-3 w-full rounded-lg bg-slate-900 px-4 py-2.5 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Review colours
            </button>
            {!isComplete && <p className="mt-2 text-xs text-slate-500">Capture all six faces to continue.</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}

function ModeTab({ active, onClick, children }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium ${active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
    >
      {children}
    </button>
  );
}

function EmptyPreview() {
  return (
    <p className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">
      No capture yet. Show the face inside the guide and capture it.
    </p>
  );
}
