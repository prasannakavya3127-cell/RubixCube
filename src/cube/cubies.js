// Facelet layout and cubie tables for a standard 3x3x3 cube.
//
// Facelets are a 54-entry array in Kociemba order: U, R, F, D, L, B (9 each).
// Within a face, cells are numbered row-major as seen from outside the cube
// (0 = top-left, 4 = centre, 8 = bottom-right). The top row of each face is:
// U -> back edge, D -> front edge, R/F/L/B -> the U face edge.
//
// Corner and edge slot order and sticker order match the solved state used by
// the `cubing` library (cubing/puzzles, 3x3x3 definition), so a decoded state
// can be handed to cubing's KPattern without any reindexing.

export const FACES = ['U', 'R', 'F', 'D', 'L', 'B'];

export const FACE_NAMES = {
  U: 'Up',
  R: 'Right',
  F: 'Front',
  D: 'Down',
  L: 'Left',
  B: 'Back',
};

// Standard Western colour scheme used for the default colour labels.
export const DEFAULT_SCHEME = {
  U: 'white',
  R: 'red',
  F: 'green',
  D: 'yellow',
  L: 'orange',
  B: 'blue',
};

// Each entry: the three [face, cell] stickers of a corner slot, listed in the
// cubing sticker order (orientation 0 = the sticker on the U/D face first).
export const CORNER_STICKERS = [
  [['U', 8], ['R', 0], ['F', 2]], // UFR
  [['U', 2], ['B', 0], ['R', 2]], // URB
  [['U', 0], ['L', 0], ['B', 2]], // UBL
  [['U', 6], ['F', 0], ['L', 2]], // ULF
  [['D', 2], ['F', 8], ['R', 6]], // DFR
  [['D', 0], ['L', 8], ['F', 6]], // DLF
  [['D', 6], ['B', 8], ['L', 6]], // DBL
  [['D', 8], ['R', 8], ['B', 6]], // DRB
];

// Each entry: the two [face, cell] stickers of an edge slot, cubing order.
export const EDGE_STICKERS = [
  [['U', 7], ['F', 1]], // UF
  [['U', 5], ['R', 1]], // UR
  [['U', 1], ['B', 1]], // UB
  [['U', 3], ['L', 1]], // UL
  [['D', 1], ['F', 7]], // DF
  [['D', 5], ['R', 7]], // DR
  [['D', 7], ['B', 7]], // DB
  [['D', 3], ['L', 7]], // DL
  [['F', 5], ['R', 3]], // FR
  [['F', 3], ['L', 5]], // FL
  [['B', 3], ['R', 5]], // BR
  [['B', 5], ['L', 3]], // BL
];

// Faces each cubie belongs to, in the same sticker order as above.
export const CORNER_FACES = CORNER_STICKERS.map((s) => s.map(([f]) => f));
export const EDGE_FACES = EDGE_STICKERS.map((s) => s.map(([f]) => f));
export const CORNER_NAMES = CORNER_FACES.map((f) => f.join(''));
export const EDGE_NAMES = EDGE_FACES.map((f) => f.join(''));

const faceletIndex = ([face, cell]) => FACES.indexOf(face) * 9 + cell;
export const CORNER_INDICES = CORNER_STICKERS.map((s) => s.map(faceletIndex));
export const EDGE_INDICES = EDGE_STICKERS.map((s) => s.map(faceletIndex));

// For a face turn of face X: the cells on each neighbouring face that move with
// it. Together with the 9 cells of X itself these form the turned outer layer.
export const ADJACENT_LAYER_CELLS = {
  U: { F: [0, 1, 2], R: [0, 1, 2], B: [0, 1, 2], L: [0, 1, 2] },
  D: { F: [6, 7, 8], R: [6, 7, 8], B: [6, 7, 8], L: [6, 7, 8] },
  R: { U: [2, 5, 8], F: [2, 5, 8], D: [2, 5, 8], B: [0, 3, 6] },
  L: { U: [0, 3, 6], F: [0, 3, 6], D: [0, 3, 6], B: [2, 5, 8] },
  F: { U: [6, 7, 8], R: [0, 3, 6], D: [0, 1, 2], L: [2, 5, 8] },
  B: { U: [0, 1, 2], L: [0, 3, 6], D: [6, 7, 8], R: [2, 5, 8] },
};
