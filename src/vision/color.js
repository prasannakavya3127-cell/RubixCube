// Colour utilities for sticker classification. Lab (CIE L*a*b*) is used
// because Euclidean distance there tracks perceived colour difference far
// better than RGB distance does under varying light.

const srgbToLinear = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

/** [r, g, b] (0-255) -> [L, a, b] */
export function rgbToLab([r, g, b]) {
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  // sRGB D65 -> XYZ, normalised to the D65 white point.
  let x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  let y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  let z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  x = f(x);
  y = f(y);
  z = f(z);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

/** CIE76 colour difference between two Lab triples. */
export function deltaE([l1, a1, b1], [l2, a2, b2]) {
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

/** Typical sRGB values for the standard cube colours (used before calibration). */
export const DEFAULT_PALETTE_RGB = {
  white: [240, 240, 232],
  yellow: [250, 210, 40],
  orange: [245, 110, 30],
  red: [185, 30, 45],
  green: [20, 150, 80],
  blue: [30, 80, 190],
};

export const DEFAULT_PALETTE_LAB = Object.fromEntries(
  Object.entries(DEFAULT_PALETTE_RGB).map(([name, rgb]) => [name, rgbToLab(rgb)]),
);

/** Name of the nearest default colour, used only for human-readable labels. */
export function nearestDefaultColour(rgb) {
  const lab = rgbToLab(rgb);
  let best = null;
  let bestD = Infinity;
  for (const [name, ref] of Object.entries(DEFAULT_PALETTE_LAB)) {
    const d = deltaE(lab, ref);
    if (d < bestD) {
      bestD = d;
      best = name;
    }
  }
  return best;
}
