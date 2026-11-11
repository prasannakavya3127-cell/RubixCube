import { useMemo, useState } from 'react';
import { FACES, FACE_NAMES, DEFAULT_SCHEME } from '../cube/cubies.js';
import { decodeCube } from '../cube/cubeState.js';
import { navigate } from '../lib/router.js';
import { COLOUR_HEX } from '../lib/colors.js';
import { useScan } from '../state/ScanContext.jsx';
import CrossNet from '../components/CrossNet.jsx';
import ValidationPanel from '../components/ValidationPanel.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function Review() {
  const { captures, scan, capturedFaces, isComplete, rotate, clearFace, setSticker } = useScan();
  const [selected, setSelected] = useState(null);

  const validation = useMemo(
    () => (scan.facelets ? decodeCube(scan.facelets) : null),
    [scan.facelets],
  );

  const stickersByFace = useMemo(() => {
    const out = {};
    for (const f of FACES) {
      const raw = scan.stickers[f];
      if (!raw) continue;
      const overrides = captures[f]?.overrides ?? {};
      out[f] = raw.map((s, cell) => ({
        face: s.face,
        rgb: s.rgb,
        uncertain: s.uncertain,
        overridden: overrides[cell] !== undefined,
      }));
    }
    return out;
  }, [scan.stickers, captures]);

  const uncertainCount = useMemo(
    () => FACES.reduce((n, f) => n + (scan.stickers[f]?.filter((s) => s.uncertain).length ?? 0), 0),
    [scan.stickers],
  );

  if (capturedFaces.length === 0) {
    return (
      <EmptyState
        title="No faces scanned yet"
        text="Scan the six faces of your cube first, then come back here to check the colours."
        action="Start scanning"
        onAction={() => navigate('scan')}
      />
    );
  }

  const errors = validation?.errors ?? [];
  const canSolve = isComplete && errors.length === 0;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold sm:text-3xl">Check the colours</h1>
        <p className="text-slate-600">
          Each sticker shows the colour the camera saw and the face it was matched to. Tap a sticker to correct it.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <CrossNet
            label="Scanned cube net"
            stickersByFace={stickersByFace}
            selected={selected}
            onSelect={(face, cell) => setSelected({ face, cell })}
          />

          <div className="rounded-xl bg-slate-50 p-3">
            {selected ? (
              <>
                <p className="mb-2 text-sm font-medium">
                  Set the {FACE_NAMES[selected.face]} face sticker #{selected.cell + 1} to:
                </p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Correct sticker colour">
                  {FACES.map((letter) => (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => setSticker(selected.face, selected.cell, letter)}
                      className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium hover:border-slate-500"
                    >
                      <span
                        className="h-4 w-4 rounded-sm ring-1 ring-black/10"
                        style={{ background: COLOUR_HEX[DEFAULT_SCHEME[letter]] }}
                        aria-hidden="true"
                      />
                      {DEFAULT_SCHEME[letter]} ({letter})
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Colour names follow the standard scheme. Your cube may use another scheme; the labels still identify faces correctly.
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-600">Tap any sticker in the net to correct its colour. Centre stickers define the colours and cannot be changed.</p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {FACES.map((f) => (
              <FaceCard
                key={f}
                face={f}
                captured={Boolean(captures[f])}
                corrected={Object.keys(captures[f]?.overrides ?? {}).length}
                onRotate={() => rotate(f)}
                onRetake={() => navigate('scan', { face: f })}
                onClear={() => clearFace(f)}
              />
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <ValidationPanel
            complete={isComplete}
            errors={errors}
            warnings={scan.warnings}
            uncertainCount={uncertainCount}
          />
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-1 font-semibold">Next</h2>
            <p className="mb-3 text-sm text-slate-600">
              {canSolve
                ? 'The cube is valid. Generate the solution to start the guided solve.'
                : 'Fix the problems above, or retake a face, before generating the solution.'}
            </p>
            <button
              type="button"
              disabled={!canSolve}
              onClick={() => navigate('solve')}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Generate solution
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function FaceCard({ face, captured, corrected, onRotate, onRetake, onClear }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 p-3">
      <div className="min-w-0">
        <p className="font-semibold">{FACE_NAMES[face]} ({face})</p>
        <p className="text-xs text-slate-500">
          {captured ? `${corrected} manual correction${corrected === 1 ? '' : 's'}` : 'Not scanned'}
        </p>
      </div>
      {captured ? (
        <div className="flex shrink-0 gap-1.5">
          <SmallButton onClick={onRotate} label={`Rotate ${FACE_NAMES[face]} face 90 degrees`}>Rotate</SmallButton>
          <SmallButton onClick={onRetake} label={`Retake ${FACE_NAMES[face]} face`}>Retake</SmallButton>
          <SmallButton onClick={onClear} label={`Remove ${FACE_NAMES[face]} face scan`} danger>Remove</SmallButton>
        </div>
      ) : (
        <SmallButton onClick={onRetake} label={`Scan ${FACE_NAMES[face]} face`}>Scan</SmallButton>
      )}
    </div>
  );
}

function SmallButton({ onClick, label, children, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
        danger ? 'border-rose-200 text-rose-700 hover:bg-rose-50' : 'border-slate-300 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  );
}
