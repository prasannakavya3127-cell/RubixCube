import { FACE_NAMES, ADJACENT_LAYER_CELLS } from './cubies.js';

// Notation helpers for standard face turns (U D L R F B with ', 2 suffixes).

const MOVE_PATTERN = /^([UDLRFB])(2?'?)$/;

/** Parse "R", "R'", "R2" (or "R2'") into { face, turns } where turns is 1, 2 or 3. */
export function parseMove(notation) {
  const match = MOVE_PATTERN.exec(notation);
  if (!match) return null;
  const [, face, suffix] = match;
  let turns = 1;
  if (suffix === "2'" || suffix === '2') turns = 2;
  else if (suffix === "'") turns = 3;
  return { face, turns };
}

const TURN_TEXT = {
  1: 'clockwise',
  2: 'half turn (180°)',
  3: 'counter-clockwise',
};

/**
 * Plain-language description of a move. Turns are described as seen when
 * looking directly at the face being turned.
 */
export function describeMove(notation) {
  const parsed = parseMove(notation);
  if (!parsed) return { face: null, title: notation, detail: 'Unsupported move notation.' };
  const name = FACE_NAMES[parsed.face];
  const direction = TURN_TEXT[parsed.turns];
  return {
    face: parsed.face,
    title: `${name} face`,
    detail: `Turn the ${name} face ${direction}, as seen when looking straight at that face.`,
  };
}

/**
 * Stickers affected by a face turn, as "F:cell" keys: the turned face plus the
 * outer-layer cells on the four neighbouring faces. Used to highlight the layer
 * in the cube net.
 */
export function affectedStickers(face) {
  const keys = new Set();
  for (let cell = 0; cell < 9; cell++) keys.add(`${face}:${cell}`);
  for (const [neighbour, cells] of Object.entries(ADJACENT_LAYER_CELLS[face] ?? {})) {
    for (const cell of cells) keys.add(`${neighbour}:${cell}`);
  }
  return keys;
}
