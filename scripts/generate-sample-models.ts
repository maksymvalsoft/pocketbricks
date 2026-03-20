/**
 * Generates sample GLB models for testing.
 * Run with: npx tsx scripts/generate-sample-models.ts
 */

import { Document, NodeIO } from '@gltf-transform/core';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.resolve(__dirname, '../public/models');

function createBoxGeometry(sx: number, sy: number, sz: number) {
  // Create a simple box with 8 vertices, 12 triangles (6 faces × 2 triangles)
  const hx = sx / 2, hy = sy / 2, hz = sz / 2;

  // 24 vertices (4 per face, for distinct normals)
  const positions = new Float32Array([
    // Front face (z+)
    -hx, -hy, hz, hx, -hy, hz, hx, hy, hz, -hx, hy, hz,
    // Back face (z-)
    hx, -hy, -hz, -hx, -hy, -hz, -hx, hy, -hz, hx, hy, -hz,
    // Top face (y+)
    -hx, hy, hz, hx, hy, hz, hx, hy, -hz, -hx, hy, -hz,
    // Bottom face (y-)
    -hx, -hy, -hz, hx, -hy, -hz, hx, -hy, hz, -hx, -hy, hz,
    // Right face (x+)
    hx, -hy, hz, hx, -hy, -hz, hx, hy, -hz, hx, hy, hz,
    // Left face (x-)
    -hx, -hy, -hz, -hx, -hy, hz, -hx, hy, hz, -hx, hy, -hz,
  ]);

  const normals = new Float32Array([
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
    0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
    0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
    -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
  ]);

  const indices = new Uint16Array([
    0, 1, 2, 0, 2, 3,     // front
    4, 5, 6, 4, 6, 7,     // back
    8, 9, 10, 8, 10, 11,  // top
    12, 13, 14, 12, 14, 15, // bottom
    16, 17, 18, 16, 18, 19, // right
    20, 21, 22, 20, 22, 23, // left
  ]);

  // Vertex colors: one color per face (4 vertices per face share same color)
  const colors = new Float32Array([
    // Front - red
    1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1,
    // Back - green
    0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
    // Top - blue
    0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1,
    // Bottom - yellow
    1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1,
    // Right - cyan
    0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1,
    // Left - magenta
    1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1,
  ]);

  return { positions, normals, indices, colors };
}

function createSphereGeometry(radius: number, segments: number) {
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  for (let lat = 0; lat <= segments; lat++) {
    const theta = (lat * Math.PI) / segments;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let lon = 0; lon <= segments; lon++) {
      const phi = (lon * 2 * Math.PI) / segments;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      const nx = cosPhi * sinTheta;
      const ny = cosTheta;
      const nz = sinPhi * sinTheta;

      positions.push(radius * nx, radius * ny, radius * nz);
      normals.push(nx, ny, nz);

      // Gradient color based on position
      const r = (ny + 1) / 2;
      const g = (nx + 1) / 2;
      const b = (nz + 1) / 2;
      colors.push(r, g, b, 1);
    }
  }

  for (let lat = 0; lat < segments; lat++) {
    for (let lon = 0; lon < segments; lon++) {
      const a = lat * (segments + 1) + lon;
      const b = a + segments + 1;
      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
    colors: new Float32Array(colors),
  };
}

async function generateColoredCube() {
  const doc = new Document();
  const buffer = doc.createBuffer();
  const { positions, normals, indices, colors } = createBoxGeometry(1, 1, 1);

  const posAccessor = doc.createAccessor().setType('VEC3').setArray(positions).setBuffer(buffer);
  const normAccessor = doc.createAccessor().setType('VEC3').setArray(normals).setBuffer(buffer);
  const idxAccessor = doc.createAccessor().setType('SCALAR').setArray(indices).setBuffer(buffer);
  const colorAccessor = doc.createAccessor().setType('VEC4').setArray(colors).setBuffer(buffer);

  const prim = doc.createPrimitive()
    .setAttribute('POSITION', posAccessor)
    .setAttribute('NORMAL', normAccessor)
    .setAttribute('COLOR_0', colorAccessor)
    .setIndices(idxAccessor);

  const material = doc.createMaterial().setBaseColorFactor([1, 1, 1, 1]);
  prim.setMaterial(material);

  const mesh = doc.createMesh('ColoredCube').addPrimitive(prim);
  const node = doc.createNode('Cube').setMesh(mesh);
  const scene = doc.createScene().addChild(node);
  doc.getRoot().setDefaultScene(scene);

  const io = new NodeIO();
  await io.write(path.join(OUTPUT_DIR, 'colored-cube.glb'), doc);
  console.log('Generated: colored-cube.glb');
}

async function generateColoredSphere() {
  const doc = new Document();
  const buffer = doc.createBuffer();
  const { positions, normals, indices, colors } = createSphereGeometry(0.8, 24);

  const posAccessor = doc.createAccessor().setType('VEC3').setArray(positions).setBuffer(buffer);
  const normAccessor = doc.createAccessor().setType('VEC3').setArray(normals).setBuffer(buffer);
  const idxAccessor = doc.createAccessor().setType('SCALAR').setArray(indices).setBuffer(buffer);
  const colorAccessor = doc.createAccessor().setType('VEC4').setArray(colors).setBuffer(buffer);

  const prim = doc.createPrimitive()
    .setAttribute('POSITION', posAccessor)
    .setAttribute('NORMAL', normAccessor)
    .setAttribute('COLOR_0', colorAccessor)
    .setIndices(idxAccessor);

  const material = doc.createMaterial().setBaseColorFactor([1, 1, 1, 1]);
  prim.setMaterial(material);

  const mesh = doc.createMesh('ColoredSphere').addPrimitive(prim);
  const node = doc.createNode('Sphere').setMesh(mesh);
  const scene = doc.createScene().addChild(node);
  doc.getRoot().setDefaultScene(scene);

  const io = new NodeIO();
  await io.write(path.join(OUTPUT_DIR, 'colored-sphere.glb'), doc);
  console.log('Generated: colored-sphere.glb');
}

async function generateCharacter() {
  const doc = new Document();
  const buffer = doc.createBuffer();

  // Body — orange box
  const body = createBoxGeometry(0.6, 0.8, 0.4);
  const bodyPos = doc.createAccessor().setType('VEC3').setArray(body.positions).setBuffer(buffer);
  const bodyNorm = doc.createAccessor().setType('VEC3').setArray(body.normals).setBuffer(buffer);
  const bodyIdx = doc.createAccessor().setType('SCALAR').setArray(body.indices).setBuffer(buffer);
  const bodyMat = doc.createMaterial('BodyMat').setBaseColorFactor([1.0, 0.5, 0.1, 1]);
  const bodyPrim = doc.createPrimitive()
    .setAttribute('POSITION', bodyPos)
    .setAttribute('NORMAL', bodyNorm)
    .setIndices(bodyIdx)
    .setMaterial(bodyMat);
  const bodyMesh = doc.createMesh('Body').addPrimitive(bodyPrim);
  const bodyNode = doc.createNode('Body').setMesh(bodyMesh).setTranslation([0, 0.4, 0]);

  // Head — blue smaller box
  const head = createBoxGeometry(0.4, 0.4, 0.4);
  const headPos = doc.createAccessor().setType('VEC3').setArray(head.positions).setBuffer(buffer);
  const headNorm = doc.createAccessor().setType('VEC3').setArray(head.normals).setBuffer(buffer);
  const headIdx = doc.createAccessor().setType('SCALAR').setArray(head.indices).setBuffer(buffer);
  const headMat = doc.createMaterial('HeadMat').setBaseColorFactor([0.2, 0.4, 1.0, 1]);
  const headPrim = doc.createPrimitive()
    .setAttribute('POSITION', headPos)
    .setAttribute('NORMAL', headNorm)
    .setIndices(headIdx)
    .setMaterial(headMat);
  const headMesh = doc.createMesh('Head').addPrimitive(headPrim);
  const headNode = doc.createNode('Head').setMesh(headMesh).setTranslation([0, 1.0, 0]);

  // Legs — two green boxes
  const leg = createBoxGeometry(0.25, 0.5, 0.35);
  const legPos = doc.createAccessor().setType('VEC3').setArray(leg.positions).setBuffer(buffer);
  const legNorm = doc.createAccessor().setType('VEC3').setArray(leg.normals).setBuffer(buffer);
  const legIdx = doc.createAccessor().setType('SCALAR').setArray(leg.indices).setBuffer(buffer);
  const legMat = doc.createMaterial('LegMat').setBaseColorFactor([0.1, 0.7, 0.2, 1]);

  const legPrim1 = doc.createPrimitive()
    .setAttribute('POSITION', legPos)
    .setAttribute('NORMAL', legNorm)
    .setIndices(legIdx)
    .setMaterial(legMat);
  const legMesh1 = doc.createMesh('LeftLeg').addPrimitive(legPrim1);
  const leftLeg = doc.createNode('LeftLeg').setMesh(legMesh1).setTranslation([-0.17, -0.25, 0]);

  // For right leg, need separate accessors since they can't be shared across primitives
  const leg2 = createBoxGeometry(0.25, 0.5, 0.35);
  const legPos2 = doc.createAccessor().setType('VEC3').setArray(leg2.positions).setBuffer(buffer);
  const legNorm2 = doc.createAccessor().setType('VEC3').setArray(leg2.normals).setBuffer(buffer);
  const legIdx2 = doc.createAccessor().setType('SCALAR').setArray(leg2.indices).setBuffer(buffer);
  const legPrim2 = doc.createPrimitive()
    .setAttribute('POSITION', legPos2)
    .setAttribute('NORMAL', legNorm2)
    .setIndices(legIdx2)
    .setMaterial(legMat);
  const legMesh2 = doc.createMesh('RightLeg').addPrimitive(legPrim2);
  const rightLeg = doc.createNode('RightLeg').setMesh(legMesh2).setTranslation([0.17, -0.25, 0]);

  const scene = doc.createScene()
    .addChild(bodyNode)
    .addChild(headNode)
    .addChild(leftLeg)
    .addChild(rightLeg);
  doc.getRoot().setDefaultScene(scene);

  const io = new NodeIO();
  await io.write(path.join(OUTPUT_DIR, 'character.glb'), doc);
  console.log('Generated: character.glb');
}

/**
 * Helper: adds a colored box part to a glTF document and returns the node.
 */
function addBoxPart(
  doc: Document,
  buffer: ReturnType<Document['createBuffer']>,
  name: string,
  size: [number, number, number],
  translation: [number, number, number],
  color: [number, number, number, number],
): ReturnType<Document['createNode']> {
  const geo = createBoxGeometry(size[0], size[1], size[2]);
  const posAcc = doc.createAccessor().setType('VEC3').setArray(geo.positions).setBuffer(buffer);
  const normAcc = doc.createAccessor().setType('VEC3').setArray(geo.normals).setBuffer(buffer);
  const idxAcc = doc.createAccessor().setType('SCALAR').setArray(geo.indices).setBuffer(buffer);
  const mat = doc.createMaterial(name + 'Mat').setBaseColorFactor(color);
  const prim = doc.createPrimitive()
    .setAttribute('POSITION', posAcc)
    .setAttribute('NORMAL', normAcc)
    .setIndices(idxAcc)
    .setMaterial(mat);
  const mesh = doc.createMesh(name).addPrimitive(prim);
  return doc.createNode(name).setMesh(mesh).setTranslation(translation);
}

async function generatePikachu() {
  const doc = new Document();
  const buffer = doc.createBuffer();

  const yellow: [number, number, number, number] = [0.98, 0.85, 0.15, 1];
  const darkYellow: [number, number, number, number] = [0.85, 0.65, 0.05, 1];
  const brown: [number, number, number, number] = [0.45, 0.25, 0.07, 1];
  const red: [number, number, number, number] = [0.9, 0.15, 0.1, 1];
  const black: [number, number, number, number] = [0.05, 0.05, 0.05, 1];

  const scene = doc.createScene();

  // Body — chubby yellow torso
  scene.addChild(addBoxPart(doc, buffer, 'Body', [0.7, 0.65, 0.5], [0, 0.325, 0], yellow));

  // Head — large round-ish yellow head
  scene.addChild(addBoxPart(doc, buffer, 'Head', [0.75, 0.6, 0.6], [0, 0.95, 0], yellow));

  // Left ear — tall pointed yellow
  scene.addChild(addBoxPart(doc, buffer, 'LeftEar', [0.12, 0.45, 0.08], [-0.22, 1.5, 0], yellow));
  // Left ear tip — black
  scene.addChild(addBoxPart(doc, buffer, 'LeftEarTip', [0.12, 0.15, 0.08], [-0.22, 1.8, 0], black));

  // Right ear
  scene.addChild(addBoxPart(doc, buffer, 'RightEar', [0.12, 0.45, 0.08], [0.22, 1.5, 0], yellow));
  scene.addChild(addBoxPart(doc, buffer, 'RightEarTip', [0.12, 0.15, 0.08], [0.22, 1.8, 0], black));

  // Eyes — two small black dots
  scene.addChild(addBoxPart(doc, buffer, 'LeftEye', [0.1, 0.1, 0.05], [-0.16, 1.0, 0.3], black));
  scene.addChild(addBoxPart(doc, buffer, 'RightEye', [0.1, 0.1, 0.05], [0.16, 1.0, 0.3], black));

  // Cheeks — two red circles (red boxes)
  scene.addChild(addBoxPart(doc, buffer, 'LeftCheek', [0.14, 0.12, 0.05], [-0.28, 0.85, 0.28], red));
  scene.addChild(addBoxPart(doc, buffer, 'RightCheek', [0.14, 0.12, 0.05], [0.28, 0.85, 0.28], red));

  // Arms — two small yellow boxes on the sides
  scene.addChild(addBoxPart(doc, buffer, 'LeftArm', [0.15, 0.35, 0.18], [-0.42, 0.35, 0], yellow));
  scene.addChild(addBoxPart(doc, buffer, 'RightArm', [0.15, 0.35, 0.18], [0.42, 0.35, 0], yellow));

  // Feet — two small boxes at bottom
  scene.addChild(addBoxPart(doc, buffer, 'LeftFoot', [0.22, 0.15, 0.3], [-0.18, -0.075, 0.05], darkYellow));
  scene.addChild(addBoxPart(doc, buffer, 'RightFoot', [0.22, 0.15, 0.3], [0.18, -0.075, 0.05], darkYellow));

  // Tail — lightning bolt shape (3 brown segments angled up)
  scene.addChild(addBoxPart(doc, buffer, 'TailBase', [0.12, 0.3, 0.08], [0, 0.25, -0.32], brown));
  scene.addChild(addBoxPart(doc, buffer, 'TailMid', [0.2, 0.12, 0.08], [0.08, 0.48, -0.32], darkYellow));
  scene.addChild(addBoxPart(doc, buffer, 'TailTop', [0.12, 0.35, 0.08], [0.18, 0.72, -0.32], darkYellow));

  // Belly stripe — two brown stripes on the back
  scene.addChild(addBoxPart(doc, buffer, 'BackStripe1', [0.5, 0.06, 0.05], [0, 0.22, -0.27], brown));
  scene.addChild(addBoxPart(doc, buffer, 'BackStripe2', [0.45, 0.06, 0.05], [0, 0.14, -0.27], brown));

  doc.getRoot().setDefaultScene(scene);

  const io = new NodeIO();
  await io.write(path.join(OUTPUT_DIR, 'pikachu.glb'), doc);
  console.log('Generated: pikachu.glb');
}

async function generateCharmander() {
  const doc = new Document();
  const buffer = doc.createBuffer();

  const orange: [number, number, number, number] = [0.95, 0.45, 0.1, 1];
  const lightOrange: [number, number, number, number] = [1.0, 0.7, 0.3, 1];
  const cream: [number, number, number, number] = [1.0, 0.85, 0.55, 1];
  const red: [number, number, number, number] = [0.9, 0.12, 0.05, 1];
  const brightYellow: [number, number, number, number] = [1.0, 0.9, 0.1, 1];
  const black: [number, number, number, number] = [0.05, 0.05, 0.05, 1];
  const white: [number, number, number, number] = [0.95, 0.95, 0.95, 1];

  const scene = doc.createScene();

  // Body — orange torso
  scene.addChild(addBoxPart(doc, buffer, 'Body', [0.55, 0.6, 0.4], [0, 0.45, 0], orange));

  // Belly — cream-colored front patch
  scene.addChild(addBoxPart(doc, buffer, 'Belly', [0.38, 0.45, 0.05], [0, 0.42, 0.22], cream));

  // Head — large orange head, slightly wider
  scene.addChild(addBoxPart(doc, buffer, 'Head', [0.6, 0.5, 0.5], [0, 1.0, 0.02], orange));

  // Snout — small protruding cream box
  scene.addChild(addBoxPart(doc, buffer, 'Snout', [0.3, 0.2, 0.12], [0, 0.88, 0.3], cream));

  // Eyes — two white ovals with black pupils
  scene.addChild(addBoxPart(doc, buffer, 'LeftEyeWhite', [0.13, 0.14, 0.05], [-0.16, 1.06, 0.25], white));
  scene.addChild(addBoxPart(doc, buffer, 'LeftEyePupil', [0.07, 0.09, 0.02], [-0.16, 1.06, 0.28], black));
  scene.addChild(addBoxPart(doc, buffer, 'RightEyeWhite', [0.13, 0.14, 0.05], [0.16, 1.06, 0.25], white));
  scene.addChild(addBoxPart(doc, buffer, 'RightEyePupil', [0.07, 0.09, 0.02], [0.16, 1.06, 0.28], black));

  // Arms — two small orange boxes
  scene.addChild(addBoxPart(doc, buffer, 'LeftArm', [0.14, 0.35, 0.16], [-0.35, 0.42, 0.02], orange));
  scene.addChild(addBoxPart(doc, buffer, 'RightArm', [0.14, 0.35, 0.16], [0.35, 0.42, 0.02], orange));

  // Claws on arms — small white tips
  scene.addChild(addBoxPart(doc, buffer, 'LeftClaw', [0.14, 0.06, 0.16], [-0.35, 0.22, 0.02], white));
  scene.addChild(addBoxPart(doc, buffer, 'RightClaw', [0.14, 0.06, 0.16], [0.35, 0.22, 0.02], white));

  // Legs — two thicker orange boxes
  scene.addChild(addBoxPart(doc, buffer, 'LeftLeg', [0.2, 0.25, 0.25], [-0.16, 0.0, 0.02], orange));
  scene.addChild(addBoxPart(doc, buffer, 'RightLeg', [0.2, 0.25, 0.25], [0.16, 0.0, 0.02], orange));

  // Feet claws
  scene.addChild(addBoxPart(doc, buffer, 'LeftFootClaw', [0.2, 0.06, 0.08], [-0.16, -0.1, 0.16], white));
  scene.addChild(addBoxPart(doc, buffer, 'RightFootClaw', [0.2, 0.06, 0.08], [0.16, -0.1, 0.16], white));

  // Tail — orange tail curving up with flame at the tip
  scene.addChild(addBoxPart(doc, buffer, 'TailBase', [0.14, 0.14, 0.3], [0, 0.35, -0.35], orange));
  scene.addChild(addBoxPart(doc, buffer, 'TailMid', [0.12, 0.3, 0.12], [0, 0.55, -0.48], lightOrange));
  scene.addChild(addBoxPart(doc, buffer, 'TailTip', [0.1, 0.2, 0.1], [0, 0.78, -0.48], lightOrange));

  // Flame on tail tip — red and yellow
  scene.addChild(addBoxPart(doc, buffer, 'FlameCore', [0.14, 0.2, 0.14], [0, 0.95, -0.48], red));
  scene.addChild(addBoxPart(doc, buffer, 'FlameOuter', [0.2, 0.14, 0.2], [0, 1.0, -0.48], brightYellow));
  scene.addChild(addBoxPart(doc, buffer, 'FlameTip', [0.1, 0.12, 0.1], [0, 1.1, -0.48], brightYellow));

  doc.getRoot().setDefaultScene(scene);

  const io = new NodeIO();
  await io.write(path.join(OUTPUT_DIR, 'charmander.glb'), doc);
  console.log('Generated: charmander.glb');
}

async function main() {
  await generateColoredCube();
  await generateColoredSphere();
  await generateCharacter();
  await generatePikachu();
  await generateCharmander();
  console.log('All sample models generated!');
}

main().catch(console.error);
