import {
  BoxGeometry,
  CylinderGeometry,
  BufferGeometry,
  Matrix4,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { LEGO_DIMENSIONS } from '../data/legoBricks';

const { STUD_PITCH, PLATE_HEIGHT, STUD_DIAMETER, STUD_HEIGHT } = LEGO_DIMENSIONS;

// Cache generated geometries
const geometryCache = new Map<string, BufferGeometry>();

// Shared stud geometry (reused across all bricks)
let studGeo: CylinderGeometry | null = null;

function getStudGeometry(): CylinderGeometry {
  if (!studGeo) {
    studGeo = new CylinderGeometry(
      STUD_DIAMETER / 2,
      STUD_DIAMETER / 2,
      STUD_HEIGHT,
      12, // segments — enough for a smooth cylinder
    );
  }
  return studGeo;
}

/**
 * Creates a LEGO brick geometry with studs on top.
 * Uses real LEGO proportions.
 */
export function createBrickGeometry(
  widthStuds: number,
  depthStuds: number,
  heightPlates: number,
): BufferGeometry {
  const key = `${widthStuds}_${depthStuds}_${heightPlates}`;
  const cached = geometryCache.get(key);
  if (cached) return cached;

  const bodyW = widthStuds * STUD_PITCH;
  const bodyH = heightPlates * PLATE_HEIGHT;
  const bodyD = depthStuds * STUD_PITCH;

  // Create the brick body
  const body = new BoxGeometry(bodyW, bodyH, bodyD);
  // Move so the origin is at the bottom-left-front corner
  body.translate(bodyW / 2, bodyH / 2, bodyD / 2);

  const parts: BufferGeometry[] = [body];

  // Add studs on top
  const stud = getStudGeometry();
  for (let sx = 0; sx < widthStuds; sx++) {
    for (let sz = 0; sz < depthStuds; sz++) {
      const studInstance = stud.clone();
      const mat = new Matrix4().makeTranslation(
        sx * STUD_PITCH + STUD_PITCH / 2,
        bodyH + STUD_HEIGHT / 2,
        sz * STUD_PITCH + STUD_PITCH / 2,
      );
      studInstance.applyMatrix4(mat);
      parts.push(studInstance);
    }
  }

  const merged = mergeGeometries(parts, false);
  if (!merged) {
    // Fallback to just the body if merge fails
    geometryCache.set(key, body);
    return body;
  }

  geometryCache.set(key, merged);

  // Dispose temporary geometries
  body.dispose();

  return merged;
}
