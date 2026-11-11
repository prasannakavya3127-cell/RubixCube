import { describe, it, expect } from 'vitest';
import { rgbToLab, nearestDefaultColour, DEFAULT_PALETTE_RGB } from './color.js';
import { sampleFace, guideRect } from './sampling.js';
import { classifyScan, rotateCells } from './scan.js';
import { FACES } from '../cube/cubies.js';
import { SOLVED_FACELETS, decodeCube } from '../cube/cubeState.js';

// Palette used to paint synthetic faces: deliberately not the default palette,
// so the tests show classification adapts to the scanned colours.
const PAINT = {
  white: [225, 225, 220],
  yellow: [235, 225, 90],
  orange: [230, 120, 60],
  red: [170, 40, 50],
  green: [60, 150, 100],
  blue: [50, 90, 170],
};
const NAMES = Object.keys(PAINT);

// Painted colour for each face letter in a scheme where colour k goes to face k.
const faceColour = (letter, scheme) => scheme[FACES.indexOf(letter)];

/** Deterministic jitter in [-amount, amount] so tests are reproducible. */
const jitter = (rgb, seed, amount) =>
  rgb.map((c, i) => Math.max(0, Math.min(255, c + Math.round(Math.sin(seed * 7 + i * 3) * amount))));

function syntheticCaptures(facelets, scheme, { noise = 6, rotations = {}, centreOffsets = {} } = {}) {
  const captures = {};
  FACES.forEach((face, fi) => {
    const samples = [];
    for (let cell = 0; cell < 9; cell++) {
      const letter = facelets[fi * 9 + cell];
      samples.push(jitter(faceColour(letter, scheme), fi * 9 + cell, noise));
    }
    // Rotations: the stored grid is the camera's view, which can be rotated.
    const turns = rotations[face] ?? 0;
    const shown = rotateCells(samples, (4 - turns) % 4);
    captures[face] = { samples: shown, rotation: turns, overrides: {} };
    if (centreOffsets[face]) captures[face].samples[4] = centreOffsets[face];
  });
  return captures;
}

const SCHEME = NAMES.map((n) => PAINT[n]);

describe('colour utilities', () => {
  it('maps white to neutral Lab', () => {
    const [L, a, b] = rgbToLab([255, 255, 255]);
    expect(L).toBeCloseTo(100, 0);
    expect(Math.abs(a)).toBeLessThan(1);
    expect(Math.abs(b)).toBeLessThan(1);
  });

  it('names the nearest default colour', () => {
    for (const [name, rgb] of Object.entries(DEFAULT_PALETTE_RGB)) {
      expect(nearestDefaultColour(rgb)).toBe(name);
    }
  });
});

describe('sampling', () => {
  it('reads each sticker colour from a synthetic 3x3 image', () => {
    const size = 30;
    const data = new Uint8ClampedArray(size * size * 4);
    const colours = [
      [255, 0, 0], [0, 255, 0], [0, 0, 255],
      [255, 255, 0], [255, 255, 255], [0, 0, 0],
      [255, 128, 0], [128, 0, 255], [0, 255, 255],
    ];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const cell = Math.floor(y / 10) * 3 + Math.floor(x / 10);
        const i = (y * size + x) * 4;
        [data[i], data[i + 1], data[i + 2]] = colours[cell];
        data[i + 3] = 255;
      }
    }
    const samples = sampleFace({ data, width: size, height: size }, { x: 0, y: 0, size: 30 });
    expect(samples).toEqual(colours);
  });

  it('computes a centred guide square', () => {
    expect(guideRect(1000, 500)).toEqual({ x: 325, y: 75, size: 350 });
  });
});

describe('rotateCells', () => {
  it('rotates a face clockwise and returns to the start after four turns', () => {
    const cells = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    expect(rotateCells(cells, 1)).toEqual([6, 3, 0, 7, 4, 1, 8, 5, 2]);
    expect(rotateCells(cells, 4)).toEqual(cells);
  });
});

describe('scan classification', () => {
  it('recovers the solved state from a scan in a non-standard colour scheme', () => {
    const { facelets, warnings } = classifyScan(syntheticCaptures(SOLVED_FACELETS, SCHEME));
    expect(facelets).toEqual(SOLVED_FACELETS);
    expect(warnings).toEqual([]);
  });

  it('corrects faces that were captured rotated', () => {
    const captures = syntheticCaptures(SOLVED_FACELETS, SCHEME, { rotations: { U: 1, F: 3 } });
    const { facelets } = classifyScan(captures);
    expect(facelets).toEqual(SOLVED_FACELETS);
  });

  it('applies manual corrections to individual stickers', () => {
    const captures = syntheticCaptures(SOLVED_FACELETS, SCHEME);
    captures.U.overrides = { 0: 'B' };
    const { facelets, stickers } = classifyScan(captures);
    expect(facelets[0]).toBe('B');
    expect(stickers.U[0].uncertain).toBe(false);
    expect(decodeCube(facelets).errors.length).toBeGreaterThan(0);
  });

  it('returns no facelets until all six faces are captured', () => {
    const captures = syntheticCaptures(SOLVED_FACELETS, SCHEME);
    delete captures.B;
    expect(classifyScan(captures).facelets).toBeNull();
  });

  it('flags stickers whose colour is ambiguous', () => {
    const captures = syntheticCaptures(SOLVED_FACELETS, SCHEME, { noise: 0 });
    // A sticker halfway between the white and yellow references.
    captures.U.samples[0] = [228, 226, 160];
    const { stickers } = classifyScan(captures);
    expect(stickers.U[0].uncertain).toBe(true);
  });

  it('warns when two centres look almost the same', () => {
    const scheme = [...SCHEME];
    scheme[1] = [...scheme[0]];
    const { warnings } = classifyScan(syntheticCaptures(SOLVED_FACELETS, scheme));
    expect(warnings.length).toBeGreaterThan(0);
  });
});
