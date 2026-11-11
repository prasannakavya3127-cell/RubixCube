# Rubik's Cube Solver (camera scanning)

A browser app that scans a 3×3 Rubik's Cube with your camera, reads all six faces,
checks the cube is valid, computes a solution, and walks you through it in 3D.

Everything runs in the browser. There is no backend, database, login, or upload of images.

## Setup

Requirements: Node.js 22.12 or newer (Vitest 5 requires it) and npm.

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (http://127.0.0.1:5173). Allow camera access when asked.

Production build and preview:

```bash
npm run build
npm run preview
```

Preview runs at http://127.0.0.1:4173.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright, Chromium) |

First time only, install the Playwright browser:

```bash
npx playwright install chromium
```

To run the end-to-end tests against a server you already started (for example `npm run dev`):

```bash
E2E_BASE_URL=http://127.0.0.1:5173 npm run test:e2e
```

On Windows PowerShell, set the variable with `$env:E2E_BASE_URL="http://127.0.0.1:5173"` first.

## Using the app

1. **Scan.** Use **Camera** (press *Enable camera*) or **Upload photo**. Hold the cube so
   the face fills the guide square, then capture. The app walks through the faces in the order
   Up, Right, Front, Down, Left, Back. Each step shows how to orient the grid. Tap a face chip to retake it.
2. **Review.** The six faces appear as a cube net, showing the colour the camera saw and the face
   it was matched to. Amber outlines mark uncertain stickers. Tap a sticker and choose the correct
   colour to fix it. Use *Rotate* if a face was captured turned by 90°. Validation messages explain
   any problems.
3. **Solve.** *Generate solution* produces a verified solution. Step through it with
   *Next*, *Previous*, *Reset*, or *Auto-play*. The affected layer is highlighted in the net, and
   the 3D cube animates each move. The app confirms when the final state is solved.

## Architecture

```
src/
  cube/
    cubies.js        Facelet layout, corner/edge tables, default colour scheme
    cubeState.js     Facelet state <-> cubing pattern; validation with plain-language errors
    solver.js        cubing's 3x3 solver wrapper; solutions are verified before display
    moves.js         Move notation, plain-language descriptions, layer highlighting
  vision/
    color.js         sRGB -> CIE Lab conversion and colour distance
    sampling.js      Samples the nine stickers of a face (median of each cell's centre)
    scan.js          Classifies all six faces using their centre stickers as references
  state/ScanContext.jsx  Scan state (captures, rotations, corrections), kept in sessionStorage
  lib/               Hash router, camera and photo capture helpers, colours
  components/        Camera capture, cube net, validation panel, 3D viewer, layout
  pages/             Home, Scan, Review, Solve
```

### Face and colour convention

- A cube state is 54 face letters in the order **U R F D L B**, nine per face, row-major as seen
  from outside the cube. This is the standard Kociemba facelet order.
- Each face's **centre sticker** is that face's colour reference. A scanned sticker takes the face
  letter of the nearest centre in Lab colour space. This adapts to lighting and to cubes that do not use the
  standard scheme.
- The default labels use the Western scheme: U white, R red, F green, D yellow, L orange, B blue.
- Validation checks: each colour appears nine times, centres are correct, every corner and edge
  is a valid, unique cubie, corner and edge twists are possible, and the permutation parity matches.
  Only states that pass are sent to the solver.
- The corner and edge tables use the same slot and sticker order as the `cubing` library's 3×3 definition.
  Tests check the mapping against a known reference (an R turn) and against random scrambles.

### Solver and 3D view

- Solving uses `cubing`'s `experimentalSolve3x3x3IgnoringCenters`, which runs in a Web Worker.
  Its output uses only U, D, L, R, F, B turns (including primes and half turns).
- The 3D view uses `cubing`'s `TwistyPlayer`. It starts from the scrambled state (the inverse of the solution)
  and appends moves as you step through them.

## Camera permissions and troubleshooting

- Camera access requires a **secure context**: `localhost`/`127.0.0.1` or HTTPS. If you open the dev server
  from another device over the local network, the browser will block the camera. Use the upload option, or serve over HTTPS.
- If the camera is blocked, the app shows a message. Re-allow camera access in the browser's site settings,
  then press *Try again*.
- Poor scans usually come from glare, shadows, or motion blur. Use even light and hold the cube still.
- If the solver reports an invalid state, check the flagged stickers on the Review screen. Correct the
  colours or retake the affected face.
- Clearing site data, or closing the tab, discards the scan.

## Limitations

- **Colour recognition is approximate.** It samples each sticker's colour and matches it against the centres,
  using CIE76 colour distance. It does not use OpenCV.js or a machine-learning model. Accuracy depends on lighting,
  camera white balance, and colour similarity. Uncertain stickers are flagged for review. Accuracy is not guaranteed.
- **Photo upload** assumes the photo is cropped to one face. The app samples the central 90% of the image.
- **Orientation** depends on holding the cube as the scan step describes. Incorrect rotation is caught by
  validation in most cases. Rotating a face by 90° on the Review screen fixes it.
- The solver produces face-turn solutions and may be longer than optimal. Solutions typically take about one second to compute.
- Scan data persists only for the current browser tab (sessionStorage).
- The 3D view always shows the standard Western colours, even if your cube uses another scheme.
- Not yet tested on real hardware or on iOS Safari. Automated tests use a fake camera feed and uploaded images.
