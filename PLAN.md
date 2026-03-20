# PocketBricks — 3D Model to LEGO Converter

## Project Overview

A client-side web application that converts uploaded 3D models (GLB/GLTF) into LEGO brick representations. The app voxelizes the 3D model, maps voxel colors to the official LEGO color palette, merges adjacent same-color voxels into larger standard LEGO bricks, renders the result in an interactive 3D viewer, and produces a shopping list of required bricks.

**Tech stack:** Vite + React + TypeScript + Three.js (via react-three-fiber)
**Hosting:** GitHub Pages (fully static, no backend)

---

## Phase 1: Project Scaffolding & Infrastructure

### Step 1.1 — Initialize the Vite + React + TypeScript project

Create the project using Vite with the React + TypeScript template. Install all core dependencies.

```bash
npm create vite@latest . -- --template react-ts
npm install three @react-three/fiber @react-three/drei three-mesh-bvh
npm install -D @types/three
```

**Expected file structure after this step:**
```
src/
  App.tsx
  main.tsx
  index.css
public/
  (empty, for static assets)
index.html
package.json
tsconfig.json
vite.config.ts
```

**Acceptance criteria:**
- `npm run dev` starts the dev server and shows the default Vite React page
- TypeScript compiles without errors
- All dependencies are listed in `package.json`

### Step 1.2 — Configure GitHub Pages deployment

Update `vite.config.ts` to set the `base` path for GitHub Pages. Add a deploy script.

```bash
npm install -D gh-pages
```

In `vite.config.ts`:
```ts
export default defineConfig({
  plugins: [react()],
  base: '/pocketbricks/',
})
```

In `package.json`, add:
```json
"scripts": {
  "deploy": "npm run build && gh-pages -d dist"
}
```

**Acceptance criteria:**
- `npm run build` produces a `dist/` folder
- The `base` path is set correctly for GitHub Pages

### Step 1.3 — Set up the basic app layout and routing

Create the main application layout with two panels:
1. **Left panel (sidebar):** Upload button, settings/controls, shopping list
2. **Right panel (main area):** 3D viewport

Use simple CSS (flexbox) for the layout. No routing library needed — this is a single-page app.

Create these files:
- `src/components/Layout.tsx` — Main two-panel layout
- `src/components/Sidebar.tsx` — Left sidebar container
- `src/components/Viewport.tsx` — 3D viewport container (wraps R3F `<Canvas>`)
- `src/App.tsx` — Updated to use Layout

**Acceptance criteria:**
- The app renders with a sidebar on the left (~300px wide) and a 3D viewport filling the rest
- The 3D viewport shows an empty Three.js scene with a gray background and orbit controls
- The sidebar has placeholder text

---

## Phase 2: 3D Model Loading

### Step 2.1 — Implement file upload for GLB/GLTF models

Create a file upload component that accepts `.glb` and `.gltf` files via:
1. A button that opens a file picker
2. Drag-and-drop onto the viewport

Create these files:
- `src/components/FileUpload.tsx` — Upload button + drag-and-drop zone
- `src/hooks/useModelStore.ts` — A simple React context or zustand store (use zustand — `npm install zustand`) to hold the currently loaded model URL (as an object URL via `URL.createObjectURL`)

**Acceptance criteria:**
- User can click "Upload Model" in the sidebar and select a `.glb` file
- User can drag-and-drop a `.glb` file onto the viewport
- The file is stored as an object URL in the model store
- Invalid file types are rejected with an error message

### Step 2.2 — Load and render the uploaded 3D model in the viewport

When a model URL is set in the store, load and display it in the Three.js scene.

Create/update these files:
- `src/components/ModelViewer.tsx` — Uses `useGLTF` from `@react-three/drei` to load the model from the object URL and render it in the scene
- `src/components/Viewport.tsx` — Updated to include `ModelViewer` inside the Canvas, plus lighting (ambient + directional), orbit controls, and a grid helper

Important implementation details:
- Use `useGLTF` hook with the object URL
- Center the model using `<Center>` from drei
- Auto-fit the camera to the model bounds using `<Bounds>` from drei
- Add `<OrbitControls>` for user interaction
- Add `<ambientLight intensity={0.5} />` and `<directionalLight position={[10, 10, 5]} />`

**Acceptance criteria:**
- After uploading a GLB file, the 3D model appears in the viewport
- User can orbit, zoom, and pan around the model
- The model is centered and fits within the viewport
- Lighting makes the model clearly visible

### Step 2.3 — Include sample models for testing

Since we'll want to test without always uploading files, add 2-3 simple sample GLB models to `public/models/`. These can be simple geometric shapes created programmatically or downloaded from free sources.

Create a script `scripts/generate-sample-models.ts` that uses Three.js (Node.js) to generate simple test models:
1. A simple cube with different colored faces
2. A sphere with a gradient color
3. A low-poly character shape (pyramid + box)

Export them as `.glb` files to `public/models/`.

Also add a "Load Sample" dropdown in the sidebar that lists these sample models.

**Note:** Install `@gltf-transform/core` and `@gltf-transform/extensions` as dev dependencies for generating GLB files in Node.

**Acceptance criteria:**
- `public/models/` contains at least 2 sample GLB files
- User can select a sample model from a dropdown in the sidebar
- Sample models load and display correctly in the viewport

---

## Phase 3: LEGO Brick Data

### Step 3.1 — Define the LEGO color palette

Create a data file containing the official LEGO color palette with RGB values. Use the Rebrickable color database as the source of truth.

Create this file:
- `src/data/legoColors.ts`

This file should export:
```ts
export interface LegoColor {
  id: number;          // Rebrickable color ID
  name: string;        // e.g., "Bright Red"
  rgb: [number, number, number]; // [R, G, B] 0-255
  hex: string;         // e.g., "#C91A09"
  isTransparent: boolean;
}

export const LEGO_COLORS: LegoColor[] = [
  // Include ~40-50 of the most common solid (non-transparent) colors
  // Source: https://rebrickable.com/colors/
];
```

Include at minimum these essential colors: White, Black, Light Bluish Gray, Dark Bluish Gray, Red, Dark Red, Blue, Dark Blue, Yellow, Green, Dark Green, Orange, Tan, Dark Tan, Bright Light Orange, Medium Azure, Dark Azure, Lime, Reddish Brown, Dark Brown, Sand Green, Olive Green, Medium Lavender, Dark Purple, Bright Pink, Coral, Light Nougat, Nougat, Medium Nougat.

Also export a helper function:
```ts
export function findClosestLegoColor(r: number, g: number, b: number): LegoColor
```
This function computes the Euclidean distance in RGB space between the input color and each LEGO color, returning the closest match. For better perceptual matching, use the weighted distance formula:
```
d = sqrt(2*dR² + 4*dG² + 3*dB²)
```
(This weights green most heavily, matching human perception.)

**Acceptance criteria:**
- The file exports an array of at least 30 LEGO colors with correct RGB values
- `findClosestLegoColor(255, 0, 0)` returns the red LEGO color
- `findClosestLegoColor(0, 0, 0)` returns black
- `findClosestLegoColor(255, 255, 255)` returns white

### Step 3.2 — Define the LEGO brick catalog

Create a data file defining the set of LEGO bricks the app can use. For the initial version, we only need basic bricks (rectangular) and plates.

Create this file:
- `src/data/legoBricks.ts`

```ts
export interface BrickType {
  id: string;           // e.g., "brick_2x4"
  name: string;         // e.g., "Brick 2×4"
  partNumber: string;   // BrickLink part number, e.g., "3001"
  widthStuds: number;   // Width in studs (X)
  depthStuds: number;   // Depth in studs (Z)
  heightPlates: number; // Height in plates (Y) — a brick is 3 plates tall, a plate is 1
  category: 'brick' | 'plate';
}

export const BRICK_CATALOG: BrickType[] = [
  // Bricks (3 plates tall each):
  { id: 'brick_1x1', name: 'Brick 1×1', partNumber: '3005', widthStuds: 1, depthStuds: 1, heightPlates: 3, category: 'brick' },
  { id: 'brick_1x2', name: 'Brick 1×2', partNumber: '3004', widthStuds: 1, depthStuds: 2, heightPlates: 3, category: 'brick' },
  { id: 'brick_1x3', name: 'Brick 1×3', partNumber: '3622', widthStuds: 1, depthStuds: 3, heightPlates: 3, category: 'brick' },
  { id: 'brick_1x4', name: 'Brick 1×4', partNumber: '3010', widthStuds: 1, depthStuds: 4, heightPlates: 3, category: 'brick' },
  { id: 'brick_1x6', name: 'Brick 1×6', partNumber: '3009', widthStuds: 1, depthStuds: 6, heightPlates: 3, category: 'brick' },
  { id: 'brick_2x2', name: 'Brick 2×2', partNumber: '3003', widthStuds: 2, depthStuds: 2, heightPlates: 3, category: 'brick' },
  { id: 'brick_2x3', name: 'Brick 2×3', partNumber: '3002', widthStuds: 2, depthStuds: 3, heightPlates: 3, category: 'brick' },
  { id: 'brick_2x4', name: 'Brick 2×4', partNumber: '3001', widthStuds: 2, depthStuds: 4, heightPlates: 3, category: 'brick' },

  // Plates (1 plate tall each):
  { id: 'plate_1x1', name: 'Plate 1×1', partNumber: '3024', widthStuds: 1, depthStuds: 1, heightPlates: 1, category: 'plate' },
  { id: 'plate_1x2', name: 'Plate 1×2', partNumber: '3023', widthStuds: 1, depthStuds: 2, heightPlates: 1, category: 'plate' },
  { id: 'plate_2x2', name: 'Plate 2×2', partNumber: '3022', widthStuds: 2, depthStuds: 2, heightPlates: 1, category: 'plate' },
  { id: 'plate_2x4', name: 'Plate 2×4', partNumber: '3020', widthStuds: 2, depthStuds: 4, heightPlates: 1, category: 'plate' },
];
```

Also define the physical dimensions constants:
```ts
export const LEGO_DIMENSIONS = {
  STUD_PITCH: 8.0,      // mm — horizontal distance between stud centers
  PLATE_HEIGHT: 3.2,     // mm — height of one plate
  BRICK_HEIGHT: 9.6,     // mm — height of one brick (= 3 plates)
  STUD_DIAMETER: 4.8,    // mm
  STUD_HEIGHT: 1.6,      // mm
};
```

**Acceptance criteria:**
- The file exports at least 8 brick types and 4 plate types
- Each brick has correct BrickLink part numbers
- Dimension constants are accurate to LEGO specifications

---

## Phase 4: Voxelization Engine

This is the core algorithm phase. The voxelization engine converts a 3D mesh into a grid of colored voxels.

### Step 4.1 — Set up the voxelization data structures

Create the core data types and grid structure for voxelization.

Create this file:
- `src/engine/VoxelGrid.ts`

```ts
export interface Voxel {
  x: number;      // grid position
  y: number;
  z: number;
  r: number;      // color (0-255)
  g: number;
  b: number;
  filled: boolean;
}

export class VoxelGrid {
  width: number;   // grid dimensions in voxels
  height: number;
  depth: number;

  // Store voxel data as flat typed arrays for performance
  private filled: Uint8Array;    // 0 or 1
  private colors: Uint8Array;    // R, G, B interleaved (length = width*height*depth*3)

  constructor(width: number, height: number, depth: number) { ... }

  // Core accessors
  index(x: number, y: number, z: number): number { ... }
  isFilled(x: number, y: number, z: number): boolean { ... }
  setFilled(x: number, y: number, z: number, filled: boolean): void { ... }
  getColor(x: number, y: number, z: number): [number, number, number] { ... }
  setColor(x: number, y: number, z: number, r: number, g: number, b: number): void { ... }

  // Iteration
  forEach(callback: (x: number, y: number, z: number, filled: boolean) => void): void { ... }
  getFilledVoxels(): Array<{x: number, y: number, z: number, r: number, g: number, b: number}> { ... }

  // Stats
  filledCount(): number { ... }
}
```

**Acceptance criteria:**
- The VoxelGrid class can be instantiated with dimensions
- Getting/setting voxel data works correctly
- `getFilledVoxels()` returns only filled voxels
- Simple unit tests (create a file `src/engine/__tests__/VoxelGrid.test.ts`) pass — install `vitest` as dev dependency

### Step 4.2 — Implement the voxelization algorithm

This is the most critical and complex step. The algorithm converts a Three.js mesh into a VoxelGrid.

Create this file:
- `src/engine/voxelizer.ts`

**Algorithm overview:**

1. **Compute the bounding box** of the mesh
2. **Determine grid resolution** — the user picks a resolution (e.g., 32, 48, 64 studs along the longest axis). Calculate the voxel size so the longest axis of the bounding box maps to that many voxels.
3. **Build a BVH** on the mesh geometry using `three-mesh-bvh` for fast raycasting
4. **Surface voxelization** — For each voxel in the grid, cast a ray from outside the bounding box through the voxel center. Mark voxels where the ray intersects the mesh surface.
5. **Solid fill (flood fill)** — Use a flood fill from the outside to mark exterior voxels. Everything not exterior and not surface is interior. Mark interior voxels as filled.
6. **Color sampling** — For each filled voxel, find the nearest point on the mesh surface. Sample the color from the mesh material/texture at that point. If the mesh has vertex colors, use those. If it has a texture, sample via UV coordinates. If it has only a flat material color, use that.

**Detailed implementation:**

```ts
import { Mesh, Raycaster, Vector3, Box3 } from 'three';
import { MeshBVH, acceleratedRaycast } from 'three-mesh-bvh';
import { VoxelGrid } from './VoxelGrid';

// Patch Three.js raycaster to use BVH
Mesh.prototype.raycast = acceleratedRaycast;

export interface VoxelizeOptions {
  resolution: number;  // voxels along longest axis (e.g., 32, 48, 64)
}

export function voxelizeMesh(mesh: Mesh, options: VoxelizeOptions): VoxelGrid {
  // Step 1: Compute bounding box
  const bbox = new Box3().setFromObject(mesh);
  const size = bbox.getSize(new Vector3());

  // Step 2: Calculate grid dimensions
  const longestAxis = Math.max(size.x, size.y, size.z);
  const voxelSize = longestAxis / options.resolution;
  const gridW = Math.ceil(size.x / voxelSize);
  const gridH = Math.ceil(size.y / voxelSize);
  const gridD = Math.ceil(size.z / voxelSize);

  const grid = new VoxelGrid(gridW, gridH, gridD);

  // Step 3: Build BVH
  const geometry = mesh.geometry;
  geometry.boundsTree = new MeshBVH(geometry);

  // Step 4: Surface voxelization via raycasting
  // Cast rays along all 3 axes for robust detection
  // For each axis, cast rays through each row of voxels
  // Mark voxels at intersection points as "surface"

  // Step 5: Flood fill exterior
  // BFS from corner voxel (which is guaranteed exterior)
  // Mark all reachable empty voxels as "exterior"
  // Everything not exterior = filled

  // Step 6: Color sampling
  // For each filled voxel, cast ray to find nearest mesh surface
  // Extract color from intersection point

  return grid;
}
```

**Key implementation details for raycasting:**
- Cast rays along ALL THREE axes (X, Y, Z) to catch thin features
- For each ray, iterate through all intersection points
- Mark the voxel containing each intersection point as a surface voxel
- Use `DoubleSide` material for proper intersection detection

**Key implementation details for flood fill:**
- Start BFS from voxel (0, 0, 0) — guaranteed to be outside if bounding box is tight
- 6-connected flood fill (up, down, left, right, front, back)
- Use a visited array (Uint8Array) for speed
- After flood fill: any voxel not visited and not already surface = interior = filled

**Key implementation details for color sampling:**
- Use `raycaster.intersectObject()` from the voxel center toward the mesh
- Get the `face` and `uv` from the intersection
- If mesh has vertex colors: interpolate from face vertices using barycentric coords
- If mesh has a texture: sample the texture at the UV coordinate
  - Get the texture image data: render to a canvas, use `getImageData()`
  - Look up pixel at (uv.x * width, uv.y * height)
- If mesh has only a solid material color: use `material.color`

**Acceptance criteria:**
- Voxelizing a simple cube mesh produces a filled grid matching the cube shape
- Voxelizing a sphere produces an approximately spherical filled region
- Colors are sampled correctly (a red sphere produces red voxels)
- Performance: voxelizing a ~10K triangle mesh at resolution 32 takes < 2 seconds

### Step 4.3 — Add a progress callback and resolution controls

The voxelization can take a few seconds. Add progress reporting and a resolution slider.

Update `src/engine/voxelizer.ts`:
- Add an optional `onProgress: (percent: number) => void` callback to `VoxelizeOptions`
- Call it at key stages (after surface voxelization, after flood fill, after color sampling)

Create/update:
- `src/components/VoxelizeControls.tsx` — A panel in the sidebar with:
  - Resolution slider (16 to 64, default 32, step 8)
  - "Convert to LEGO" button
  - Progress bar (shown during voxelization)

- `src/hooks/useModelStore.ts` — Add state for:
  - `resolution: number`
  - `voxelGrid: VoxelGrid | null`
  - `isVoxelizing: boolean`
  - `voxelizeProgress: number`

**Acceptance criteria:**
- User can adjust resolution via a slider
- Clicking "Convert to LEGO" triggers voxelization with a visible progress indicator
- The voxel grid is stored in the global state after completion

---

## Phase 5: LEGO Brick Fitting Algorithm

### Step 5.1 — Implement color quantization (map voxels to LEGO colors)

Before fitting bricks, map each voxel's sampled color to the nearest LEGO color.

Create this file:
- `src/engine/colorQuantizer.ts`

```ts
import { VoxelGrid } from './VoxelGrid';
import { findClosestLegoColor, LegoColor } from '../data/legoColors';

export interface QuantizedVoxelGrid {
  grid: VoxelGrid;
  // Maps each filled voxel to a LEGO color ID
  colorMap: Map<string, LegoColor>; // key = "x,y,z"
}

export function quantizeColors(grid: VoxelGrid): QuantizedVoxelGrid {
  // For each filled voxel:
  // 1. Get its RGB color
  // 2. Find the closest LEGO color using findClosestLegoColor()
  // 3. Update the voxel's color in the grid to the LEGO color's RGB
  // 4. Store the mapping
}
```

**Acceptance criteria:**
- After quantization, all filled voxels have colors that exactly match a LEGO palette color
- A voxel with color (200, 10, 10) is mapped to LEGO Red
- The number of unique colors in the grid is ≤ the number of LEGO colors in the palette

### Step 5.2 — Implement the greedy brick merging algorithm

This is the second most critical algorithm. It takes a grid of colored voxels (each 1×1×1) and merges adjacent same-color voxels into larger LEGO bricks.

Create this file:
- `src/engine/brickPlacer.ts`

```ts
import { VoxelGrid } from './VoxelGrid';
import { BrickType, BRICK_CATALOG } from '../data/legoBricks';
import { LegoColor } from '../data/legoColors';

export interface PlacedBrick {
  x: number;           // grid position (bottom-left-front corner)
  y: number;
  z: number;
  brick: BrickType;    // which brick type
  color: LegoColor;    // LEGO color
  rotated: boolean;    // if true, width and depth are swapped
}

export function placeBricks(grid: VoxelGrid, colorMap: Map<string, LegoColor>): PlacedBrick[] {
  // Algorithm: Greedy layer-by-layer brick merging
  //
  // Process the grid one horizontal layer (Y level) at a time, from bottom to top.
  // Within each layer, use a 2D greedy rectangle packing algorithm.
  //
  // For now, we treat each layer as 1 plate tall. This means we use plate-type bricks.
  // (Optimization: later we can merge vertically across 3 consecutive same-color layers
  //  into full bricks instead of plates.)
  //
  // For each layer:
  //   1. Create a 2D grid of this layer's filled voxels + their LEGO colors
  //   2. Create a "used" boolean grid (same size), initialized to false
  //   3. Iterate through each cell (x, z) in order:
  //      a. If used[x][z] is true, skip
  //      b. Get the color at (x, z)
  //      c. Try to fit the largest available brick starting at (x, z):
  //         - Sort brick catalog by area (largest first): 2x4, 2x3, 2x2, 1x6, 1x4, 1x3, 1x2, 1x1
  //         - For each brick (and its 90° rotation):
  //           - Check if all cells it would cover are: filled, same color, not yet used
  //           - If yes: place this brick, mark all covered cells as used, break
  //      d. Record the PlacedBrick
  //   4. Return all placed bricks

  const placedBricks: PlacedBrick[] = [];

  for (let y = 0; y < grid.height; y++) {
    // Process layer y
    const used = new Uint8Array(grid.width * grid.depth); // 0 = unused

    for (let z = 0; z < grid.depth; z++) {
      for (let x = 0; x < grid.width; x++) {
        if (!grid.isFilled(x, y, z)) continue;
        if (used[z * grid.width + x]) continue;

        const color = colorMap.get(`${x},${y},${z}`);
        if (!color) continue;

        // Try bricks from largest to smallest
        let placed = false;
        for (const brickType of getSortedPlates()) { // plates only for now
          for (const rotated of [false, true]) {
            const w = rotated ? brickType.depthStuds : brickType.widthStuds;
            const d = rotated ? brickType.widthStuds : brickType.depthStuds;

            if (canPlace(grid, used, colorMap, x, y, z, w, d, color)) {
              // Mark cells as used
              markUsed(used, grid.width, x, z, w, d);
              placedBricks.push({ x, y, z, brick: brickType, color, rotated });
              placed = true;
              break;
            }
          }
          if (placed) break;
        }

        // Fallback: 1x1 plate
        if (!placed) {
          // This shouldn't happen if 1x1 plate is in catalog, but handle it
        }
      }
    }
  }

  return placedBricks;
}
```

**Helper functions to implement:**
- `getSortedPlates()` — Returns plate-type bricks sorted by area (largest first)
- `canPlace(grid, used, colorMap, x, y, z, w, d, color)` — Checks if a rectangle of size w×d starting at (x, z) in layer y is all filled, same color, and unused
- `markUsed(used, gridWidth, x, z, w, d)` — Marks a rectangle in the used array

**Acceptance criteria:**
- A 4×4 single-color filled layer produces bricks like: one 2×4 + one 2×4, or similar optimal coverage
- A checkerboard pattern (alternating colors) produces only 1×1 bricks
- All voxels are covered — no gaps
- The total stud-area of placed bricks equals the number of filled voxels in each layer
- Unit tests verify correct placement for known patterns

### Step 5.3 — Implement vertical brick merging (optional optimization)

After the initial layer-by-layer placement with plates, try to merge vertically. If three consecutive layers have the same brick footprint and color at the same position, merge three plates into one full brick.

Create this function in `src/engine/brickPlacer.ts`:
```ts
export function mergeVertically(placedBricks: PlacedBrick[]): PlacedBrick[] {
  // Group bricks by (x, z, width, depth, color, rotated)
  // For each group, sort by y
  // Find runs of 3 consecutive plates → replace with 1 brick
  // Return optimized list
}
```

**Acceptance criteria:**
- A solid 1×1 column of 6 layers in the same color produces 2 full bricks (each 3 plates tall) instead of 6 plates
- Brick count is reduced compared to plate-only placement
- Visual output remains identical

---

## Phase 6: LEGO Model Rendering

### Step 6.1 — Create LEGO brick 3D geometry

Create a reusable LEGO brick mesh with the characteristic stud on top.

Create this file:
- `src/components/LegoBrickGeometry.ts`

Generate the geometry for a 1×1 LEGO brick with studs:
1. Base: a box of size (STUD_PITCH × BRICK_HEIGHT × STUD_PITCH) = (8mm × 9.6mm × 8mm)
2. Stud on top: a cylinder of diameter 4.8mm, height 1.6mm, centered on top face
3. Combine into a single BufferGeometry using `mergeGeometries` from Three.js

For larger bricks (1×2, 2×4, etc.), generate geometry dynamically:
- Scale the box to (width × STUD_PITCH, height × PLATE_HEIGHT, depth × STUD_PITCH)
- Add studs at each stud position on top

Export a function:
```ts
export function createBrickGeometry(widthStuds: number, depthStuds: number, heightPlates: number): BufferGeometry
```

Cache generated geometries to avoid recreating them.

**Acceptance criteria:**
- `createBrickGeometry(1, 1, 3)` produces a 1×1 brick with 1 stud
- `createBrickGeometry(2, 4, 3)` produces a 2×4 brick with 8 studs
- The studs are visible cylinder bumps on top
- Geometry dimensions match real LEGO proportions

### Step 6.2 — Render the LEGO model using InstancedMesh

Render all placed bricks efficiently using Three.js InstancedMesh (one per brick type + color combination).

Create this file:
- `src/components/LegoModelRenderer.tsx`

**Implementation approach:**
1. Group placed bricks by (brickType.id + color.id) — each group gets one InstancedMesh
2. For each group:
   - Create the brick geometry using `createBrickGeometry()`
   - Create a material with the LEGO color
   - Create an InstancedMesh with count = number of bricks in this group
   - Set each instance's transform matrix (position based on grid coords × stud pitch)
3. Render all InstancedMesh objects in the scene

**Position mapping:**
```ts
// Convert grid position to world position
worldX = placedBrick.x * LEGO_DIMENSIONS.STUD_PITCH;
worldY = placedBrick.y * LEGO_DIMENSIONS.PLATE_HEIGHT;
worldZ = placedBrick.z * LEGO_DIMENSIONS.STUD_PITCH;
```

**Acceptance criteria:**
- After voxelization and brick placement, the LEGO model appears in the viewport
- Studs are visible on each brick
- Colors match the LEGO palette
- The model is recognizable as a blocky version of the original
- Performance: renders 5000+ bricks at ≥30fps

### Step 6.3 — Add toggle between original model and LEGO view

Allow the user to switch between viewing the original 3D model and the LEGO representation.

Update `src/components/Viewport.tsx` and sidebar:
- Add a toggle/tabs in the sidebar: "Original" / "LEGO" / "Side-by-Side"
- In side-by-side mode, show both models next to each other (offset along X)
- Store view mode in the model store

**Acceptance criteria:**
- User can toggle between Original, LEGO, and Side-by-Side views
- In Side-by-Side, both models are visible and can be compared
- Camera orbit controls work in all modes

---

## Phase 7: Shopping List

### Step 7.1 — Generate the brick shopping list

Aggregate all placed bricks into a summary with quantities.

Create this file:
- `src/engine/shoppingList.ts`

```ts
import { PlacedBrick } from './brickPlacer';

export interface ShoppingListItem {
  brick: BrickType;
  color: LegoColor;
  quantity: number;
  // Optional: BrickLink buy link URL
  brickLinkUrl: string;
}

export interface ShoppingList {
  items: ShoppingListItem[];
  totalBricks: number;
  totalUniqueItems: number; // unique brick+color combos
  estimatedStudCount: number;
}

export function generateShoppingList(placedBricks: PlacedBrick[]): ShoppingList {
  // Group by (brick.id, color.id)
  // Count quantities
  // Generate BrickLink URLs: https://www.bricklink.com/v2/catalog/catalogitem.page?P={partNumber}&C={brickLinkColorId}
  // Sort by quantity descending
}
```

**Acceptance criteria:**
- The shopping list correctly counts all bricks
- Each item has a brick type, color, and quantity
- Items are sorted by quantity (most needed first)
- `totalBricks` equals the number of placed bricks
- `estimatedStudCount` equals total stud coverage area

### Step 7.2 — Display the shopping list in the sidebar

Create a scrollable, sortable shopping list UI in the sidebar.

Create this file:
- `src/components/ShoppingList.tsx`

Display:
- Summary stats at top: total brick count, unique items, estimated cost (optional)
- Table/list of items with columns: Color (swatch), Brick (name), Qty, BrickLink link
- Option to sort by: quantity, color, brick type
- "Export CSV" button

**Acceptance criteria:**
- After conversion, the shopping list appears in the sidebar
- Each item shows a color swatch, brick name, and quantity
- The list is scrollable if long
- A button exports the list as a downloadable CSV file

### Step 7.3 — Implement CSV export for the shopping list

Create an export function that generates a CSV file and triggers a browser download.

Create this file:
- `src/utils/exportCsv.ts`

CSV format:
```csv
Part Number,Brick Name,Color,Quantity,BrickLink URL
3001,Brick 2×4,Bright Red,24,https://www.bricklink.com/...
3003,Brick 2×2,White,18,https://www.bricklink.com/...
```

**Acceptance criteria:**
- Clicking "Export CSV" downloads a file named `pocketbricks-shopping-list.csv`
- The CSV opens correctly in Excel/Google Sheets
- All items from the shopping list are present

---

## Phase 8: Polish & UX

### Step 8.1 — Add an app header, branding, and welcome state

Create a minimal header with the app name ("PocketBricks") and a brief tagline. When no model is loaded, show an attractive empty state with instructions.

Update:
- `src/components/Layout.tsx` — Add a header bar
- `src/components/Viewport.tsx` — Show a welcome message/illustration when no model is loaded
- `src/index.css` — Style the header, ensure a clean color scheme

**Acceptance criteria:**
- The app has a header with "PocketBricks" branding
- When no model is loaded, the viewport shows helpful instructions
- The overall look is clean and professional (not unstyled)

### Step 8.2 — Add loading states and error handling

Ensure the app handles errors gracefully and shows loading states.

Add:
- Loading spinner/skeleton while a model is being loaded
- Loading spinner during voxelization with progress percentage
- Error messages for: invalid file format, model too large, voxelization failure
- Toast/notification component for status messages

Create:
- `src/components/Toast.tsx` — Simple toast notification system

**Acceptance criteria:**
- Loading a large model shows a spinner
- Voxelization shows a progress bar with percentage
- Uploading a `.txt` file shows an error message
- Errors don't crash the app

### Step 8.3 — Add responsive styling

Make the app work reasonably on different screen sizes.

- On wide screens (>1024px): sidebar + viewport side by side
- On narrow screens (<1024px): stack vertically — viewport on top, sidebar below (collapsible)
- Ensure the Canvas resizes correctly when the window changes

**Acceptance criteria:**
- The app looks good on 1920×1080 and 1366×768
- On a narrow window, the layout stacks vertically
- The 3D viewport doesn't break when resized

---

## Phase 9: Testing & Deployment

### Step 9.1 — Add unit tests for core algorithms

Install and configure Vitest. Write unit tests for the critical modules.

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Add `vitest.config.ts` (or extend `vite.config.ts`).

Write tests for:
- `src/engine/__tests__/VoxelGrid.test.ts` — Grid operations, bounds checking
- `src/engine/__tests__/colorQuantizer.test.ts` — Color matching accuracy
- `src/engine/__tests__/brickPlacer.test.ts` — Brick placement correctness (no gaps, no overlaps)
- `src/engine/__tests__/shoppingList.test.ts` — Aggregation accuracy
- `src/data/__tests__/legoColors.test.ts` — Color distance function

**Acceptance criteria:**
- All tests pass with `npx vitest run`
- Core algorithms have >80% code coverage
- Edge cases are covered (empty grid, single voxel, full grid)

### Step 9.2 — End-to-end smoke test

Create a simple end-to-end test that loads a sample model, voxelizes it, and verifies output.

Create:
- `src/__tests__/e2e.test.ts`

This test should:
1. Programmatically create a simple colored cube mesh
2. Run it through `voxelizeMesh()` at resolution 8
3. Run it through `quantizeColors()`
4. Run it through `placeBricks()`
5. Run it through `generateShoppingList()`
6. Verify: shopping list has >0 items, total bricks > 0, no errors thrown

**Acceptance criteria:**
- The E2E test passes
- It completes in < 10 seconds

### Step 9.3 — Build and deploy to GitHub Pages

Perform a production build and deploy.

```bash
npm run build
npm run deploy
```

Verify the deployed site works at `https://<username>.github.io/pocketbricks/`.

**Acceptance criteria:**
- The site loads without errors
- A sample model can be loaded and converted
- The shopping list generates correctly
- No console errors in production

---

## Appendix A: File Structure (Final)

```
pocketbricks/
├── public/
│   └── models/          # Sample GLB models
├── scripts/
│   └── generate-sample-models.ts
├── src/
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Viewport.tsx
│   │   ├── FileUpload.tsx
│   │   ├── ModelViewer.tsx
│   │   ├── VoxelizeControls.tsx
│   │   ├── LegoModelRenderer.tsx
│   │   ├── LegoBrickGeometry.ts
│   │   ├── ShoppingList.tsx
│   │   └── Toast.tsx
│   ├── data/
│   │   ├── legoColors.ts
│   │   └── legoBricks.ts
│   ├── engine/
│   │   ├── VoxelGrid.ts
│   │   ├── voxelizer.ts
│   │   ├── colorQuantizer.ts
│   │   ├── brickPlacer.ts
│   │   └── shoppingList.ts
│   ├── hooks/
│   │   └── useModelStore.ts
│   ├── utils/
│   │   └── exportCsv.ts
│   ├── __tests__/
│   │   └── e2e.test.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts (or merged into vite.config.ts)
└── PLAN.md
```

## Appendix B: Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | React + TypeScript | Industry standard, strong ecosystem |
| 3D Library | Three.js via react-three-fiber | Best web 3D lib, R3F makes it React-friendly |
| Model Format | GLB/GLTF | Web-native, compact, supports textures + colors |
| Raycasting | three-mesh-bvh | Orders of magnitude faster than naive raycasting |
| State Management | Zustand | Lightweight, no boilerplate, works great with R3F |
| Build Tool | Vite | Fastest dev server, optimized production builds |
| Testing | Vitest | Native Vite integration, Jest-compatible API |
| Hosting | GitHub Pages | Free, simple deployment for static sites |
| Voxelization | Ray casting + flood fill | Proven approach, works for both solid and hollow models |
| Brick Fitting | Greedy layer-by-layer | Simple, fast, good results for real-time use |
| Color Matching | Weighted RGB Euclidean | Good perceptual accuracy without complex color space conversion |

## Appendix C: Dependencies

**Runtime:**
- `react` / `react-dom` — UI framework
- `three` — 3D rendering
- `@react-three/fiber` — React renderer for Three.js
- `@react-three/drei` — Useful Three.js helpers
- `three-mesh-bvh` — Fast raycasting via BVH acceleration
- `zustand` — State management

**Development:**
- `typescript` — Type safety
- `vite` — Build tool
- `@vitejs/plugin-react` — React Vite plugin
- `@types/three` — Three.js type definitions
- `vitest` — Unit testing
- `@testing-library/react` — React component testing
- `gh-pages` — GitHub Pages deployment
