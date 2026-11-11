import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { FACES } from '../cube/cubies.js';
import { classifyScan } from '../vision/scan.js';

// Scan data survives reloads within a tab via sessionStorage. Failures there
// (private mode, blocked storage) are ignored and the scan simply starts empty.
const STORAGE_KEY = 'rubix-scan-v1';

function loadCaptures() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveCaptures(captures) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(captures));
  } catch {
    // Storage unavailable; the in-memory state still works.
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'capture':
      // Retaking a face clears its rotation and manual corrections.
      return { ...state, [action.face]: { samples: action.samples, rotation: 0, overrides: {} } };
    case 'rotate': {
      const cur = state[action.face];
      if (!cur) return state;
      return { ...state, [action.face]: { ...cur, rotation: ((cur.rotation ?? 0) + 1) % 4, overrides: {} } };
    }
    case 'setSticker': {
      const cur = state[action.face];
      if (!cur) return state;
      return {
        ...state,
        [action.face]: { ...cur, overrides: { ...cur.overrides, [action.cell]: action.letter } },
      };
    }
    case 'clearFace': {
      const next = { ...state };
      delete next[action.face];
      return next;
    }
    case 'reset':
      return {};
    default:
      return state;
  }
}

const ScanContext = createContext(null);

export function ScanProvider({ children }) {
  const [captures, dispatch] = useReducer(reducer, undefined, loadCaptures);

  useEffect(() => {
    saveCaptures(captures);
  }, [captures]);

  const scan = useMemo(() => classifyScan(captures), [captures]);
  const capturedFaces = useMemo(() => FACES.filter((f) => captures[f]?.samples?.length === 9), [captures]);

  const value = useMemo(
    () => ({
      captures,
      capturedFaces,
      scan,
      isComplete: capturedFaces.length === FACES.length,
      capture: (face, samples) => dispatch({ type: 'capture', face, samples }),
      rotate: (face) => dispatch({ type: 'rotate', face }),
      setSticker: (face, cell, letter) => dispatch({ type: 'setSticker', face, cell, letter }),
      clearFace: (face) => dispatch({ type: 'clearFace', face }),
      reset: () => dispatch({ type: 'reset' }),
    }),
    [captures, capturedFaces, scan],
  );

  return <ScanContext.Provider value={value}>{children}</ScanContext.Provider>;
}

export function useScan() {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error('useScan must be used inside ScanProvider');
  return ctx;
}
