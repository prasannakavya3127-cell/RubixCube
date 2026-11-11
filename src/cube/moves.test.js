import { describe, it, expect } from 'vitest';
import { parseMove, describeMove, affectedStickers } from './moves.js';

describe('move notation', () => {
  it('parses quarter and half turns', () => {
    expect(parseMove('R')).toEqual({ face: 'R', turns: 1 });
    expect(parseMove("R'")).toEqual({ face: 'R', turns: 3 });
    expect(parseMove('U2')).toEqual({ face: 'U', turns: 2 });
    expect(parseMove("U2'")).toEqual({ face: 'U', turns: 2 });
  });

  it('rejects unsupported notation', () => {
    expect(parseMove('x')).toBeNull();
    expect(parseMove('M')).toBeNull();
    expect(parseMove('RR')).toBeNull();
  });

  it('describes the move in plain language', () => {
    expect(describeMove("F'").detail).toMatch(/Front face counter-clockwise/);
    expect(describeMove('D2').detail).toMatch(/half turn/);
  });

  it('highlights the face plus the twelve adjacent layer stickers', () => {
    for (const face of ['U', 'D', 'L', 'R', 'F', 'B']) {
      const keys = affectedStickers(face);
      expect(keys.size).toBe(21);
      expect(keys.has(`${face}:4`)).toBe(true);
    }
  });
});
