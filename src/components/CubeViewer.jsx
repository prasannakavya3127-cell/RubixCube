import { useEffect, useRef } from 'react';
import { TwistyPlayer } from 'cubing/twisty';
import { Alg } from 'cubing/alg';

/**
 * Interactive 3D cube (cubing.js TwistyPlayer).
 *
 * The player starts from the scrambled state (`setup`, the inverse of the
 * solution). `index` is the number of solution moves applied so far. Stepping
 * forward appends one move (animated); any other change rebuilds the alg prefix.
 */
export default function CubeViewer({ setup, moves, index }) {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const shownRef = useRef(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const player = new TwistyPlayer({
      puzzle: '3x3x3',
      visualization: '3D',
      experimentalSetupAlg: setup,
      alg: '',
      controlPanel: 'none',
      background: 'none',
      hintFacelets: 'none',
      backView: 'none',
      tempoScale: 2,
    });
    // Fill the host exactly; the player sizes its canvas from its own box.
    Object.assign(player.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' });
    host.appendChild(player);
    playerRef.current = player;
    shownRef.current = 0;
    return () => {
      playerRef.current = null;
      player.remove();
    };
  }, [setup]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    if (index === shownRef.current + 1 && index <= moves.length) {
      player.experimentalAddMove(moves[index - 1], { cancel: false });
    } else {
      player.alg = new Alg(moves.slice(0, index).join(' '));
    }
    shownRef.current = index;
  }, [index, moves, setup]);

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label="3D view of the cube at the current step"
      className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200"
    />
  );
}
