import {
  FACES,
  FACE_NAMES,
  DEFAULT_SCHEME,
  CORNER_INDICES,
  CORNER_FACES,
  CORNER_NAMES,
  EDGE_INDICES,
  EDGE_FACES,
  EDGE_NAMES,
} from './cubies.js';

// A cube state is a 54-entry array of face letters (see cubies.js). Each
// sticker holds the letter of the face whose centre colour it shows, so a
// solved cube is simply each face letter repeated nine times in order.

export const SOLVED_FACELETS = FACES.flatMap((f) => Array(9).fill(f));

const colourLabel = (face) => `${DEFAULT_SCHEME[face]} (${FACE_NAMES[face]})`;

// The rotation o such that letters[k] === cubieFaces[(k - o) mod n], or -1.
function findOrientation(letters, cubieFaces) {
  const n = cubieFaces.length;
  for (let o = 0; o < n; o++) {
    if (letters.every((l, k) => l === cubieFaces[(k - o + n) % n])) return o;
  }
  return -1;
}

const sortedKey = (letters) => [...letters].sort().join('');
const CORNER_KEYS = CORNER_FACES.map(sortedKey);
const EDGE_KEYS = EDGE_FACES.map(sortedKey);

function permutationParity(perm) {
  let inversions = 0;
  for (let i = 0; i < perm.length; i++) {
    for (let j = i + 1; j < perm.length; j++) if (perm[i] > perm[j]) inversions++;
  }
  return inversions % 2;
}

/**
 * Decode and validate a facelet state.
 * Returns { errors, patternData }. patternData (CORNERS/EDGES permutation and
 * orientation arrays) is only present when errors is empty.
 */
export function decodeCube(facelets) {
  if (!Array.isArray(facelets) || facelets.length !== 54) {
    return { errors: ['The cube state must contain exactly 54 stickers.'] };
  }
  const counts = Object.fromEntries(FACES.map((f) => [f, 0]));
  for (const l of facelets) {
    if (!(l in counts)) return { errors: [`Unknown sticker value "${l}".`] };
    counts[l]++;
  }

  const errors = [];
  for (const f of FACES) {
    if (counts[f] !== 9) {
      errors.push(`The ${colourLabel(f)} colour appears ${counts[f]} times; it must appear exactly 9 times.`);
    }
  }
  for (const f of FACES) {
    if (facelets[FACES.indexOf(f) * 9 + 4] !== f) {
      errors.push(`The centre of the ${FACE_NAMES[f]} face is not the ${colourLabel(f)} colour.`);
    }
  }
  if (errors.length) return { errors };

  const cornerPieces = [];
  const cornerOrientation = [];
  const seenCorners = new Set();
  for (let slot = 0; slot < 8; slot++) {
    const letters = CORNER_INDICES[slot].map((i) => facelets[i]);
    const h = CORNER_KEYS.indexOf(sortedKey(letters));
    if (h < 0) {
      errors.push(`The corner at ${CORNER_NAMES[slot]} shows ${letters.join(', ')}, which is not a valid corner colour combination.`);
      continue;
    }
    if (seenCorners.has(h)) {
      errors.push(`The corner ${CORNER_NAMES[h]} appears more than once.`);
      continue;
    }
    seenCorners.add(h);
    const o = findOrientation(letters, CORNER_FACES[h]);
    if (o < 0) {
      errors.push(`The corner at ${CORNER_NAMES[slot]} has its colours in a mirrored, impossible order.`);
      continue;
    }
    cornerPieces.push(h);
    cornerOrientation.push(o);
  }

  const edgePieces = [];
  const edgeOrientation = [];
  const seenEdges = new Set();
  for (let slot = 0; slot < 12; slot++) {
    const letters = EDGE_INDICES[slot].map((i) => facelets[i]);
    const h = EDGE_KEYS.indexOf(sortedKey(letters));
    if (h < 0) {
      errors.push(`The edge at ${EDGE_NAMES[slot]} shows ${letters.join(', ')}, which is not a valid edge colour combination.`);
      continue;
    }
    if (seenEdges.has(h)) {
      errors.push(`The edge ${EDGE_NAMES[h]} appears more than once.`);
      continue;
    }
    seenEdges.add(h);
    const o = findOrientation(letters, EDGE_FACES[h]);
    if (o < 0) {
      errors.push(`The edge at ${EDGE_NAMES[slot]} has its colours in an impossible order.`);
      continue;
    }
    edgePieces.push(h);
    edgeOrientation.push(o);
  }
  if (errors.length) return { errors };

  if (cornerOrientation.reduce((a, b) => a + b, 0) % 3 !== 0) {
    errors.push('Corner orientation is impossible: at least one corner is twisted. Re-check the corner stickers.');
  }
  if (edgeOrientation.reduce((a, b) => a + b, 0) % 2 !== 0) {
    errors.push('Edge orientation is impossible: at least one edge is flipped. Re-check the edge stickers.');
  }
  if (permutationParity(cornerPieces) !== permutationParity(edgePieces)) {
    errors.push('Corner and edge arrangements have different parity, so this state is not reachable. Two stickers were probably misread or swapped.');
  }
  if (errors.length) return { errors };

  return {
    errors,
    patternData: {
      CORNERS: { pieces: cornerPieces, orientation: cornerOrientation },
      EDGES: { pieces: edgePieces, orientation: edgeOrientation },
    },
  };
}

/** Convert CORNERS/EDGES pattern data back into a 54-sticker facelet state. */
export function encodeCube({ CORNERS, EDGES }) {
  const out = new Array(54);
  for (const f of FACES) out[FACES.indexOf(f) * 9 + 4] = f;
  CORNERS.pieces.forEach((h, slot) => {
    const o = CORNERS.orientation[slot];
    CORNER_INDICES[slot].forEach((idx, k) => {
      out[idx] = CORNER_FACES[h][(k - o + 3) % 3];
    });
  });
  EDGES.pieces.forEach((h, slot) => {
    const o = EDGES.orientation[slot];
    EDGE_INDICES[slot].forEach((idx, k) => {
      out[idx] = EDGE_FACES[h][(k - o + 2) % 2];
    });
  });
  return out;
}
