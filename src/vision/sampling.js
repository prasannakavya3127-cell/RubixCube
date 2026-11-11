// Sticker sampling from pixel data. Works on any object shaped like ImageData
// ({ data: Uint8ClampedArray, width, height }), so it is testable in Node.

/** Square guide region in pixel coordinates: 70% of the shorter side, centred. */
export function guideRect(width, height) {
  const size = Math.round(Math.min(width, height) * 0.7);
  return { x: Math.round((width - size) / 2), y: Math.round((height - size) / 2), size };
}

/** Square region for a whole uploaded photo: 90% of the shorter side, centred. */
export function photoRect(width, height) {
  const size = Math.round(Math.min(width, height) * 0.9);
  return { x: Math.round((width - size) / 2), y: Math.round((height - size) / 2), size };
}

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/**
 * Sample the nine stickers of a 3x3 face inside `rect`. Each sticker is read
 * from the central 50% of its cell, using the per-channel median so glare
 * and dark shadow edges have little effect. Returns nine [r, g, b] triples
 * in row-major order (top-left first) as seen in the image.
 */
export function sampleFace(imageData, rect) {
  const { data, width } = imageData;
  const cell = rect.size / 3;
  const out = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const x0 = Math.round(rect.x + col * cell + cell * 0.25);
      const y0 = Math.round(rect.y + row * cell + cell * 0.25);
      const span = Math.max(1, Math.round(cell * 0.5));
      const rs = [];
      const gs = [];
      const bs = [];
      for (let y = y0; y < y0 + span; y++) {
        for (let x = x0; x < x0 + span; x++) {
          const i = (y * width + x) * 4;
          rs.push(data[i]);
          gs.push(data[i + 1]);
          bs.push(data[i + 2]);
        }
      }
      out.push([median(rs), median(gs), median(bs)]);
    }
  }
  return out;
}
