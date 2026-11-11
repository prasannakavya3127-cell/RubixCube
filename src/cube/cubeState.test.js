import { describe, it, expect } from 'vitest';
import { decodeCube, encodeCube, SOLVED_FACELETS } from './cubeState.js';
import { CORNER_INDICES, EDGE_INDICES } from './cubies.js';

const solvedPattern = () => ({
  CORNERS: { pieces: [0, 1, 2, 3, 4, 5, 6, 7], orientation: Array(8).fill(0) },
  EDGES: { pieces: Array.from({ length: 12 }, (_, i) => i), orientation: Array(12).fill(0) },
});

// Swap two stickers (by facelet index) in a copy of the state.
const swap = (state, a, b) => {
  const next = [...state];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
};

describe('cube state decoding', () => {
  it('accepts the solved state', () => {
    const { errors, patternData } = decodeCube(SOLVED_FACELETS);
    expect(errors).toEqual([]);
    expect(patternData).toEqual(solvedPattern());
  });

  it('encodes the solved pattern back to the solved facelets', () => {
    expect(encodeCube(solvedPattern())).toEqual(SOLVED_FACELETS);
  });

  it('rejects a state with the wrong length', () => {
    expect(decodeCube(SOLVED_FACELETS.slice(1)).errors[0]).toMatch(/54 stickers/);
  });

  it('reports wrong sticker counts', () => {
    const bad = [...SOLVED_FACELETS];
    bad[0] = 'R'; // one white sticker becomes red
    const { errors } = decodeCube(bad);
    expect(errors).toContain('The white (Up) colour appears 8 times; it must appear exactly 9 times.');
    expect(errors).toContain('The red (Right) colour appears 10 times; it must appear exactly 9 times.');
  });

  it('reports a centre that is not its face colour', () => {
    // Swap the Up and Right centres: counts stay balanced, so only the centre check fails.
    const bad = swap(SOLVED_FACELETS, 4, 13);
    const { errors } = decodeCube(bad);
    expect(errors.some((e) => /centre of the Up face/.test(e))).toBe(true);
    expect(errors.some((e) => /centre of the Right face/.test(e))).toBe(true);
  });

  it('detects a flipped edge', () => {
    // Swap the two stickers of the UF edge: the edge is flipped in place.
    const [a, b] = EDGE_INDICES[0];
    const { errors } = decodeCube(swap(SOLVED_FACELETS, a, b));
    expect(errors.some((e) => /edge is flipped/.test(e))).toBe(true);
  });

  it('detects a twisted corner', () => {
    // Rotate the three stickers of the UFR corner one step.
    const [a, b, c] = CORNER_INDICES[0];
    const next = [...SOLVED_FACELETS];
    next[a] = SOLVED_FACELETS[c];
    next[b] = SOLVED_FACELETS[a];
    next[c] = SOLVED_FACELETS[b];
    const { errors } = decodeCube(next);
    expect(errors.some((e) => /corner is twisted/.test(e))).toBe(true);
  });

  it('detects a parity mismatch from exchanging two edges', () => {
    // Exchange the UF and UR edges: edge permutation parity flips, corners are
    // untouched, so no sequence of face turns can produce this state.
    const [uf1, uf2] = EDGE_INDICES[0];
    const [ur1, ur2] = EDGE_INDICES[1];
    let next = swap(SOLVED_FACELETS, uf1, ur1);
    next = swap(next, uf2, ur2);
    const { errors } = decodeCube(next);
    expect(errors.some((e) => /different parity/.test(e))).toBe(true);
  });

  it('detects an invalid colour combination on a corner', () => {
    // Change one sticker on the UFR corner and one on the U face elsewhere so the
    // counts still balance. UFR then shows two white stickers.
    const [u8] = CORNER_INDICES[0].map((i) => i);
    const next = [...SOLVED_FACELETS];
    next[CORNER_INDICES[0][1]] = 'U'; // R sticker of UFR becomes U
    next[0] = 'R'; // U0 (a different corner) becomes R to keep counts balanced
    expect(next[u8]).toBe('U');
    const { errors } = decodeCube(next);
    expect(errors.some((e) => /not a valid corner colour combination/.test(e))).toBe(true);
  });
});
