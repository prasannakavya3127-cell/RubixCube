import { test, expect } from '@playwright/test';
import { cube3x3x3 } from 'cubing/puzzles';
import { encodeCube } from '../src/cube/cubeState.js';
import { FACES } from '../src/cube/cubies.js';

// Colours painted onto the synthetic photos. Deliberately not the default
// palette, so the test exercises centre-based calibration.
const PAINT = {
  U: '#f2f2ee',
  R: '#d62828',
  F: '#2a9d8f',
  D: '#f4e285',
  L: '#f77f00',
  B: '#1d3557',
};

const SCRAMBLE = "R U R' F2 D B' L2 U2 R D' F";

async function scrambledFacelets() {
  const kp = await cube3x3x3.kpuzzle();
  const pattern = kp.defaultPattern().applyAlg(SCRAMBLE);
  return encodeCube(pattern.patternData);
}

/** Render a 3x3 face as a PNG (data URL bytes) using the browser's canvas. */
async function renderFacePhoto(page, cells) {
  const dataUrl = await page.evaluate(
    ({ cells, paint }) => {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, 300, 300);
      cells.forEach((letter, i) => {
        const r = Math.floor(i / 3);
        const c = i % 3;
        ctx.fillStyle = paint[letter];
        ctx.fillRect(15 + c * 90 + 4, 15 + r * 90 + 4, 82, 82);
      });
      return canvas.toDataURL('image/png');
    },
    { cells, paint: PAINT },
  );
  return Buffer.from(dataUrl.split(',')[1], 'base64');
}

test('home page loads and navigates to scanning', async ({ page }) => {
  await page.goto('/#/home');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Scan your cube');
  await page.getByRole('button', { name: 'Start scanning' }).click();
  await expect(page.getByRole('heading', { name: 'Scan the Up face' })).toBeVisible();
});

test('live camera preview starts with permission and captures a face', async ({ page }) => {
  await page.goto('/#/scan');
  await page.getByRole('button', { name: 'Enable camera' }).click();
  await expect(page.getByRole('button', { name: 'Capture this face' })).toBeVisible();
  await page.getByRole('button', { name: 'Capture this face' }).click();
  // Capturing advances to the next face.
  await expect(page.getByRole('heading', { name: 'Scan the Right face' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Up/ }).first()).toContainText('✓');
});

test('full workflow: upload six faces, validate, solve, step through, verify', async ({ page }) => {
  const facelets = await scrambledFacelets();
  await page.goto('/#/scan');
  await page.getByRole('tab', { name: 'Upload photo' }).click();

  for (const [fi, face] of FACES.entries()) {
    const label = { U: 'Up', R: 'Right', F: 'Front', D: 'Down', L: 'Left', B: 'Back' }[face];
    await expect(page.getByRole('heading', { name: `Scan the ${label} face` })).toBeVisible();
    const cells = facelets.slice(fi * 9, fi * 9 + 9);
    const buffer = await renderFacePhoto(page, cells);
    await page.getByLabel(`Upload photo of the ${label} face`).setInputFiles({
      name: `${face}.png`,
      mimeType: 'image/png',
      buffer,
    });
  }

  await page.getByRole('button', { name: 'Review colours' }).click();
  await expect(page.getByRole('heading', { name: 'Check the colours' })).toBeVisible();
  await expect(page.getByText('Cube state is valid')).toBeVisible();

  await page.getByRole('button', { name: 'Generate solution' }).click();
  await expect(page.getByRole('heading', { name: 'Solve' })).toBeVisible();
  const moveText = await page.getByText(/^Move 0 of \d+/).textContent();
  const total = Number(/of (\d+)/.exec(moveText)[1]);
  expect(total).toBeGreaterThan(0);

  // Step through every move with Next.
  const next = page.getByRole('button', { name: 'Next move' });
  for (let i = 0; i < total; i++) await next.click();
  await expect(page.getByText('All moves complete. The cube is solved.')).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Verified solved' })).toBeVisible();
  await expect(page.locator('twisty-player')).toHaveCount(1);
});

test('invalid scan can be corrected manually before solving', async ({ page }) => {
  const facelets = await scrambledFacelets();
  // Corrupt one sticker of the Up face in the photo: a red sticker on a white face.
  const corrupted = [...facelets.slice(0, 9)];
  const original = facelets[0];
  corrupted[0] = original === 'R' ? 'U' : 'R';
  const originalName = { U: 'white', R: 'red', F: 'green', D: 'yellow', L: 'orange', B: 'blue' }[original];
  await page.goto('/#/scan');
  await page.getByRole('tab', { name: 'Upload photo' }).click();

  for (const [fi, face] of FACES.entries()) {
    const label = { U: 'Up', R: 'Right', F: 'Front', D: 'Down', L: 'Left', B: 'Back' }[face];
    const cells = fi === 0 ? corrupted : facelets.slice(fi * 9, fi * 9 + 9);
    await page.getByLabel(`Upload photo of the ${label} face`).setInputFiles({
      name: `${face}.png`,
      mimeType: 'image/png',
      buffer: await renderFacePhoto(page, cells),
    });
  }

  await page.getByRole('button', { name: 'Review colours' }).click();
  await expect(page.getByRole('heading', { name: 'Check the colours' })).toBeVisible();
  await expect(page.getByText(/problems? found/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Generate solution' })).toBeDisabled();

  // Tap the bad sticker (Up face, sticker 1) and set it back to its true colour.
  await page.getByRole('button', { name: /^Up face, sticker 1:/ }).click();
  await page
    .getByRole('group', { name: 'Correct sticker colour' })
    .getByRole('button', { name: `${originalName} (${original})` })
    .click();
  await expect(page.getByText('Cube state is valid')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Generate solution' })).toBeEnabled();
});

test('retake link opens the scan page on the chosen face', async ({ page }) => {
  const facelets = await scrambledFacelets();
  await page.goto('/#/scan');
  await page.getByRole('tab', { name: 'Upload photo' }).click();
  for (const [fi, face] of FACES.entries()) {
    const label = { U: 'Up', R: 'Right', F: 'Front', D: 'Down', L: 'Left', B: 'Back' }[face];
    await page.getByLabel(`Upload photo of the ${label} face`).setInputFiles({
      name: `${face}.png`,
      mimeType: 'image/png',
      buffer: await renderFacePhoto(page, facelets.slice(fi * 9, fi * 9 + 9)),
    });
  }
  await page.getByRole('button', { name: 'Review colours' }).click();
  await expect(page.getByRole('heading', { name: 'Check the colours' })).toBeVisible();
  await page.getByRole('button', { name: 'Retake Front face' }).click();
  await expect(page.getByRole('heading', { name: 'Scan the Front face' })).toBeVisible();
});
