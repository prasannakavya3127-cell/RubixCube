import { cube3x3x3 } from 'cubing/puzzles';
import { KPattern } from 'cubing/kpuzzle';
import { experimentalSolve3x3x3IgnoringCenters } from 'cubing/search';
import { decodeCube, encodeCube } from './cubeState.js';

// Thin wrapper around cubing's Kociemba-style 3x3x3 solver. All validation
// happens in cubeState.js first; this module never solves an invalid state.

let puzzlePromise = null;
const loadPuzzle = () => (puzzlePromise ??= cube3x3x3.kpuzzle());

/** Build a cubing KPattern from a decoded corner/edge pattern. */
export async function patternFromFacelets(facelets) {
  const decoded = decodeCube(facelets);
  if (decoded.errors.length) return { errors: decoded.errors };
  const kpuzzle = await loadPuzzle();
  const base = kpuzzle.defaultPattern().patternData;
  const pattern = new KPattern(kpuzzle, {
    ...base,
    CORNERS: decoded.patternData.CORNERS,
    EDGES: decoded.patternData.EDGES,
  });
  return { errors: [], pattern, kpuzzle };
}

/**
 * Solve a facelet state. Resolves to { ok: true, solution, moves, facelets }
 * or { ok: false, errors }. The solution is verified on the cube model before
 * it is returned.
 */
export async function solveFacelets(facelets) {
  const built = await patternFromFacelets(facelets);
  if (built.errors.length) return { ok: false, errors: built.errors };
  const { pattern, kpuzzle } = built;

  let solution;
  try {
    solution = await experimentalSolve3x3x3IgnoringCenters(pattern);
  } catch (err) {
    return { ok: false, errors: [`The solver failed: ${err.message ?? err}`] };
  }

  const solved = kpuzzle.defaultPattern();
  if (!pattern.applyAlg(solution).isIdentical(solved)) {
    return { ok: false, errors: ['The generated solution did not verify on the cube model. No solution is shown.'] };
  }

  const moves = [...solution.childAlgNodes()].map((node) => node.toString());
  return { ok: true, solution, moves, facelets: encodeCube(pattern.patternData) };
}

/**
 * Facelet state before each move and after the last one: result[k] is the
 * state after k moves, so result.length === moves.length + 1.
 */
export async function stepStates(facelets, moves) {
  const built = await patternFromFacelets(facelets);
  if (built.errors.length) return [];
  let pattern = built.pattern;
  const states = [encodeCube(pattern.patternData)];
  for (const move of moves) {
    pattern = pattern.applyMove(move);
    states.push(encodeCube(pattern.patternData));
  }
  return states;
}
