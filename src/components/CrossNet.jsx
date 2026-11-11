import { FACES, FACE_NAMES, DEFAULT_SCHEME } from '../cube/cubies.js';
import { COLOUR_HEX, DARK_TEXT_ON, rgbToCss } from '../lib/colors.js';

// Position of each face in the standard cross layout (column, row).
const NET_POSITION = {
  U: [1, 0],
  L: [0, 1],
  F: [1, 1],
  R: [2, 1],
  B: [3, 1],
  D: [1, 2],
};

/**
 * Cube net (cross layout) showing the 54 stickers.
 *
 * stickersByFace: { [face]: [{ face, rgb?, overridden?, uncertain? } x9] }
 *   `face` is the stored letter; `rgb` (optional) is the colour the camera saw.
 * highlight: Set of "F:cell" keys to outline (e.g. the layer of the next move).
 * selected: { face, cell } currently selected for correction.
 * onSelect(face, cell): when given, stickers become clickable (centres are not).
 */
export default function CrossNet({ stickersByFace, highlight, selected, onSelect, label = 'Cube net' }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="grid w-full max-w-md grid-cols-4 gap-x-3 gap-y-3 mx-auto"
    >
      {FACES.map((face) => {
        const [col, row] = NET_POSITION[face];
        const stickers = stickersByFace?.[face];
        return (
          <div
            key={face}
            style={{ gridColumnStart: col + 1, gridRowStart: row + 1 }}
            className="rounded-lg bg-slate-900/90 p-1.5 shadow-sm"
          >
            <div className="grid grid-cols-3 gap-[3px]">
              {Array.from({ length: 9 }, (_, cell) => {
                const sticker = stickers?.[cell] ?? { face };
                const key = `${face}:${cell}`;
                const isCentre = cell === 4;
                const isSelected = selected?.face === face && selected?.cell === cell;
                const isHighlighted = highlight?.has(key);
                const colourName = DEFAULT_SCHEME[sticker.face];
                const background = sticker.rgb ? rgbToCss(sticker.rgb) : COLOUR_HEX[colourName];
                const textDark = !sticker.rgb && DARK_TEXT_ON.has(colourName);
                const clickable = onSelect && !isCentre;
                const classes = [
                  'flex aspect-square items-center justify-center rounded-[4px] text-[10px] font-bold leading-none sm:text-xs',
                  clickable ? 'cursor-pointer hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white' : '',
                  isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900' : '',
                  isHighlighted ? 'outline outline-2 outline-offset-[-2px] outline-amber-300' : '',
                  sticker.uncertain ? 'ring-2 ring-amber-400' : '',
                ].join(' ');
                const title = `${FACE_NAMES[face]} face, ${isCentre ? 'centre' : `sticker ${cell + 1}`}: ${colourName}${sticker.uncertain ? ' (uncertain)' : ''}${sticker.overridden ? ' (corrected)' : ''}`;
                const content = (
                  <span
                    className={textDark ? 'text-slate-900' : 'text-white drop-shadow'}
                    aria-hidden="true"
                  >
                    {sticker.face}
                  </span>
                );
                if (clickable) {
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-label={title}
                      onClick={() => onSelect(face, cell)}
                      style={{ background }}
                      className={classes}
                    >
                      {content}
                    </button>
                  );
                }
                return (
                  <div key={key} title={title} aria-label={title} style={{ background }} className={classes}>
                    {content}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
