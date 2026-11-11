// Display colours for the standard Western scheme. Text colour is chosen for
// contrast on each swatch so labels stay readable.
export const COLOUR_HEX = {
  white: '#f5f5f0',
  yellow: '#ffd500',
  orange: '#ff6a13',
  red: '#c8102e',
  green: '#00a651',
  blue: '#1f5fd6',
};

export const DARK_TEXT_ON = new Set(['white', 'yellow', 'orange']);

export const rgbToCss = ([r, g, b]) => `rgb(${r}, ${g}, ${b})`;
