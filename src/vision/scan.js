import { FACES, DEFAULT_SCHEME } from '../cube/cubies.js';
import { rgbToLab, deltaE } from './color.js';

// Turn raw captures (nine RGB samples per face) into a 54-sticker facelet
// state. Each face's centre sticker is its own colour reference, so sticker
// colours are matched against the six centres of the same scan. That makes the
// result adapt to the lighting and to the cube's actual colour scheme.

// Uncertainty thresholds in CIE76 units. A sticker is flagged when it is far
// from every reference, or when the best and second-best references are close.
const MAX_CONFIDENT_DISTANCE = 45;
const MIN_MARGIN = 8;
// Centres closer than this are very likely to be confused with each other.
const CENTRE_SIMILARITY_WARNING = 18;

/** Rotate a 9-cell face 90 degrees clockwise `turns` times (cells row-major). */
export function rotateCells(cells, turns = 0) {
  let out = cells;
  for (let t = 0; t < ((turns % 4) + 4) % 4; t++) {
    const next = new Array(9);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) next[r * 3 + c] = out[(2 - c) * 3 + r];
    }
    out = next;
  }
  return out;
}

/**
 * Classify a complete scan.
 *
 * captures: { [face]: { samples: [[r,g,b] x9], rotation?: 0-3, overrides?: { [cell]: face } } }
 * Returns:
 *   facelets:  54 face letters, or null if any face is missing
 *   stickers:  { [face]: [{ face, uncertain, rgb }] x9 } in display order
 *   warnings:  string[]
 */
export function classifyScan(captures) {
  const warnings = [];
  const present = FACES.filter((f) => captures[f]?.samples?.length === 9);
  if (present.length < FACES.length) {
    return { facelets: null, stickers: {}, warnings };
  }

  const refs = {};
  for (const f of FACES) refs[f] = rgbToLab(captures[f].samples[4]);

  for (let i = 0; i < FACES.length; i++) {
    for (let j = i + 1; j < FACES.length; j++) {
      const a = FACES[i];
      const b = FACES[j];
      if (deltaE(refs[a], refs[b]) < CENTRE_SIMILARITY_WARNING) {
        warnings.push(
          `The ${DEFAULT_SCHEME[a]} and ${DEFAULT_SCHEME[b]} centres look very similar. Check lighting and retake these faces if the colours are wrong.`,
        );
      }
    }
  }

  const facelets = new Array(54);
  const stickers = {};
  for (const f of FACES) {
    const { samples, rotation = 0, overrides = {} } = captures[f];
    const cells = rotateCells(samples, rotation);
    stickers[f] = cells.map((rgb, cell) => {
      const lab = rgbToLab(rgb);
      const ranked = FACES.map((face) => ({ face, d: deltaE(lab, refs[face]) })).sort((x, y) => x.d - y.d);
      const best = ranked[0];
      const second = ranked[1];
      const uncertain = best.d > MAX_CONFIDENT_DISTANCE || second.d - best.d < MIN_MARGIN;
      const letter = overrides[cell] ?? best.face;
      facelets[FACES.indexOf(f) * 9 + cell] = letter;
      return { face: letter, uncertain: uncertain && overrides[cell] === undefined, rgb };
    });
  }

  return { facelets, stickers, warnings };
}
