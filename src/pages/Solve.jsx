import { useEffect, useMemo, useState } from 'react';
import { FACES } from '../cube/cubies.js';
import { SOLVED_FACELETS } from '../cube/cubeState.js';
import { solveFacelets, stepStates } from '../cube/solver.js';
import { describeMove, affectedStickers, parseMove } from '../cube/moves.js';
import { navigate } from '../lib/router.js';
import { useScan } from '../state/ScanContext.jsx';
import CrossNet from '../components/CrossNet.jsx';
import CubeViewer from '../components/CubeViewer.jsx';
import EmptyState from '../components/EmptyState.jsx';

const AUTOPLAY_MS = 1200;
const EMPTY_SET = new Set();

export default function Solve() {
  const { scan, isComplete } = useScan();
  const key = scan.facelets ? scan.facelets.join('') : '';
  const [solved, setSolved] = useState({ key: '', result: null, states: null });

  // Results are tagged with the scan they came from, so a stale result is never shown.
  useEffect(() => {
    if (!key) return undefined;
    let cancelled = false;
    const facelets = key.split('');
    solveFacelets(facelets).then(async (result) => {
      const states = result.ok ? await stepStates(facelets, result.moves) : null;
      if (!cancelled) setSolved({ key, result, states });
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  if (!isComplete || !key) {
    return (
      <EmptyState
        title="Scan all six faces first"
        text="A solution needs a complete, reviewed cube state."
        action="Go to scanning"
        onAction={() => navigate('scan')}
      />
    );
  }

  if (solved.key !== key) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center" role="status">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-indigo-600" aria-hidden="true" />
        <p className="font-semibold">Generating solution…</p>
        <p className="text-sm text-slate-600">This usually takes a second.</p>
      </div>
    );
  }

  if (!solved.result.ok) {
    return (
      <div className="mx-auto max-w-xl space-y-4 rounded-2xl border border-rose-300 bg-rose-50 p-6 text-rose-900" role="alert">
        <h1 className="text-xl font-bold">No solution was generated</h1>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {solved.result.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => navigate('review')}
          className="rounded-lg bg-slate-900 px-4 py-2.5 font-semibold text-white"
        >
          Back to colour review
        </button>
      </div>
    );
  }

  return <SolvePlayer key={key} result={solved.result} states={solved.states} />;
}

/** Playback view. Remounted (state reset) whenever the scan changes. */
function SolvePlayer({ result, states }) {
  const { solution, moves } = result;
  const total = moves.length;
  const setup = useMemo(() => solution.invert(), [solution]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return undefined;
    const t = setTimeout(() => {
      setIndex((i) => Math.min(i + 1, total));
      if (index + 1 >= total) setPlaying(false);
    }, AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [playing, index, total]);

  const goTo = (i) => {
    setPlaying(false);
    setIndex(Math.max(0, Math.min(total, i)));
  };

  const current = index < total ? moves[index] : null;
  const info = current ? describeMove(current) : null;
  const highlight = current ? affectedStickers(parseMove(current).face) : EMPTY_SET;
  const shown = states?.[index] ?? null;
  const stickersByFace = shown
    ? Object.fromEntries(FACES.map((f, fi) => [f, shown.slice(fi * 9, fi * 9 + 9).map((face) => ({ face }))]))
    : null;
  const done = index >= total;
  const verified = Boolean(states?.[total]) && states[total].every((l, i) => l === SOLVED_FACELETS[i]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Solve</h1>
          <p className="text-slate-600">
            {total === 0 ? 'The cube is already solved.' : `${total} moves. Follow them one at a time.`}
          </p>
        </div>
        {verified && (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800" role="status">
            Verified solved
          </span>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <CubeViewer setup={setup} moves={moves} index={index} />

          <div className="space-y-2">
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
              role="progressbar"
              aria-label="Solution progress"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={index}
            >
              <div className="h-full bg-indigo-600 transition-all" style={{ width: `${total ? (index / total) * 100 : 100}%` }} />
            </div>
            <p className="text-sm text-slate-600">
              Move {index} of {total} · {total - index} remaining
            </p>
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Playback controls">
            <ControlButton onClick={() => goTo(0)} label="Reset to the scrambled start">Reset</ControlButton>
            <ControlButton onClick={() => goTo(index - 1)} disabled={index === 0} label="Previous move">Previous</ControlButton>
            <ControlButton onClick={() => goTo(index + 1)} disabled={done} label="Next move" primary>Next</ControlButton>
            <ControlButton
              onClick={() => setPlaying((p) => !p)}
              disabled={done || total === 0}
              label={playing ? 'Pause auto-play' : 'Start auto-play'}
            >
              {playing ? 'Pause' : 'Auto-play'}
            </ControlButton>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" aria-live="polite">
            <h2 className="text-sm font-semibold text-slate-500">
              {done ? 'Finished' : `Next move (${index + 1} of ${total})`}
            </h2>
            {done ? (
              <p className="mt-2 text-lg font-semibold">
                {total === 0 ? 'Nothing to do: the cube is solved.' : 'All moves complete. The cube is solved.'}
              </p>
            ) : (
              <>
                <p className="mt-1 font-mono text-4xl font-bold">{current}</p>
                <p className="mt-2 font-semibold">{info.title}</p>
                <p className="mt-1 text-sm text-slate-600">{info.detail}</p>
                <p className="mt-2 text-xs text-slate-500">
                  The highlighted stickers in the net show the layer that turns. Hold the cube so the turning face is toward you.
                </p>
              </>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-500">Cube state</h2>
            {stickersByFace && <CrossNet label="Cube state net" stickersByFace={stickersByFace} highlight={highlight} />}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-500">All moves</h2>
            <ol className="flex flex-wrap gap-1.5">
              {moves.map((m, i) => (
                <li key={`${i}-${m}`}>
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Jump to move ${i + 1}: ${m}`}
                    aria-current={i === index ? 'step' : undefined}
                    className={`min-w-10 rounded-md px-2 py-1 font-mono text-sm ${
                      i < index
                        ? 'bg-slate-100 text-slate-400'
                        : i === index
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                    }`}
                  >
                    {m}
                  </button>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-slate-500">
              Each move turns one face as seen from that face. A prime (') is counter-clockwise and 2 is a half turn.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function ControlButton({ onClick, disabled, label, children, primary }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`rounded-lg px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
        primary ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'border border-slate-300 bg-white hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  );
}
