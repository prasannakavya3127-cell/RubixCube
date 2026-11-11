import { describe, it, expect } from 'vitest';
import { cube3x3x3 } from 'cubing/puzzles';
import { KPattern } from 'cubing/kpuzzle';
import { decodeCube, encodeCube, SOLVED_FACELETS } from './cubeState.js';
import { solveFacelets, stepStates, patternFromFacelets } from './solver.js';

const MOVES = ['U', 'D', 'L', 'R', 'F', 'B'];
const SUFFIXES = ['', "'", '2'];

// Deterministic pseudo-random scrambles so failures are reproducible.
function scrambleAlg(seed, length) {
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  const out = [];
  let last = '';
  while (out.length < length) {
    const m = MOVES[Math.floor(rand() * MOVES.length)];
    if (m === last) continue;
    last = m;
    out.push(m + SUFFIXES[Math.floor(rand() * 3)]);
  }
  return out.join(' ');
}

const kpuzzle = await cube3x3x3.kpuzzle();
const solvedPattern = kpuzzle.defaultPattern();
const facelet = (pattern) => encodeCube(pattern.patternData);

describe('reference behaviour of the cube model', () => {
  it('matches the standard facelet string after one R turn', () => {
    // Kociemba-order facelets after R from solved (UUF... standard reference).
    const expected = 'UUFUUFUUFRRRRRRRRRFFDFFDFFDDDBDDBDDBLLLLLLLLLUBBUBBUBB';
    expect(facelet(solvedPattern.applyAlg('R')).join('')).toBe(expected);
  });

  it('round-trips random scrambles through facelets', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const pattern = solvedPattern.applyAlg(scrambleAlg(seed, 25));
      const { errors, patternData } = decodeCube(facelet(pattern));
      expect(errors).toEqual([]);
      const rebuilt = new KPattern(kpuzzle, {
        ...solvedPattern.patternData,
        CORNERS: patternData.CORNERS,
        EDGES: patternData.EDGES,
      });
      expect(rebuilt.isIdentical(pattern)).toBe(true);
    }
  });

  it('accepts every state reachable by face turns', () => {
    const { errors } = decodeCube(facelet(solvedPattern.applyAlg("R U R' U' F2 D B L2")));
    expect(errors).toEqual([]);
  });
});

describe('solver', () => {
  it('returns an empty solution for a solved cube', async () => {
    const result = await solveFacelets(SOLVED_FACELETS);
    expect(result.ok).toBe(true);
    expect(result.moves).toEqual([]);
  });

  it('solves random scrambles and the verified solution really solves the cube', async () => {
    for (let seed = 100; seed < 106; seed++) {
      const state = facelet(solvedPattern.applyAlg(scrambleAlg(seed, 22)));
      const result = await solveFacelets(state);
      expect(result.ok).toBe(true);
      expect(result.moves.length).toBeGreaterThan(0);

      // Independently replay the moves on the decoded pattern.
      const { pattern } = await patternFromFacelets(state);
      const solved = pattern.applyAlg(result.solution);
      expect(solved.isIdentical(solvedPattern)).toBe(true);
    }
  }, 60000);

  it('uses only standard face-turn notation', async () => {
    const state = facelet(solvedPattern.applyAlg(scrambleAlg(7, 20)));
    const { moves } = await solveFacelets(state);
    for (const m of moves) expect(m).toMatch(/^[UDLRFB]2?'?$/);
  }, 60000);

  it('provides a state for each step, ending in the solved state', async () => {
    const state = facelet(solvedPattern.applyAlg(scrambleAlg(11, 18)));
    const { moves } = await solveFacelets(state);
    const states = await stepStates(state, moves);
    expect(states).toHaveLength(moves.length + 1);
    expect(states[0]).toEqual(state);
    expect(states[moves.length]).toEqual(SOLVED_FACELETS);
  }, 60000);

  it('refuses an invalid state without solving it', async () => {
    const bad = [...SOLVED_FACELETS];
    bad[0] = 'R';
    const result = await solveFacelets(bad);
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
