export interface BrickType {
  id: string;
  name: string;
  partNumber: string;
  widthStuds: number;
  depthStuds: number;
  heightPlates: number;
  category: 'brick' | 'plate';
  estimatedPrice: number; // average USD price per piece (new condition)
}

export const BRICK_CATALOG: BrickType[] = [
  // Bricks (3 plates tall each)
  { id: 'brick_1x1', name: 'Brick 1\u00d71', partNumber: '3005', widthStuds: 1, depthStuds: 1, heightPlates: 3, category: 'brick', estimatedPrice: 0.05 },
  { id: 'brick_1x2', name: 'Brick 1\u00d72', partNumber: '3004', widthStuds: 1, depthStuds: 2, heightPlates: 3, category: 'brick', estimatedPrice: 0.07 },
  { id: 'brick_1x3', name: 'Brick 1\u00d73', partNumber: '3622', widthStuds: 1, depthStuds: 3, heightPlates: 3, category: 'brick', estimatedPrice: 0.08 },
  { id: 'brick_1x4', name: 'Brick 1\u00d74', partNumber: '3010', widthStuds: 1, depthStuds: 4, heightPlates: 3, category: 'brick', estimatedPrice: 0.10 },
  { id: 'brick_1x6', name: 'Brick 1\u00d76', partNumber: '3009', widthStuds: 1, depthStuds: 6, heightPlates: 3, category: 'brick', estimatedPrice: 0.13 },
  { id: 'brick_2x2', name: 'Brick 2\u00d72', partNumber: '3003', widthStuds: 2, depthStuds: 2, heightPlates: 3, category: 'brick', estimatedPrice: 0.10 },
  { id: 'brick_2x3', name: 'Brick 2\u00d73', partNumber: '3002', widthStuds: 2, depthStuds: 3, heightPlates: 3, category: 'brick', estimatedPrice: 0.12 },
  { id: 'brick_2x4', name: 'Brick 2\u00d74', partNumber: '3001', widthStuds: 2, depthStuds: 4, heightPlates: 3, category: 'brick', estimatedPrice: 0.14 },

  // Plates (1 plate tall each)
  { id: 'plate_1x1', name: 'Plate 1\u00d71', partNumber: '3024', widthStuds: 1, depthStuds: 1, heightPlates: 1, category: 'plate', estimatedPrice: 0.03 },
  { id: 'plate_1x2', name: 'Plate 1\u00d72', partNumber: '3023', widthStuds: 1, depthStuds: 2, heightPlates: 1, category: 'plate', estimatedPrice: 0.04 },
  { id: 'plate_1x3', name: 'Plate 1\u00d73', partNumber: '3623', widthStuds: 1, depthStuds: 3, heightPlates: 1, category: 'plate', estimatedPrice: 0.05 },
  { id: 'plate_1x4', name: 'Plate 1\u00d74', partNumber: '3710', widthStuds: 1, depthStuds: 4, heightPlates: 1, category: 'plate', estimatedPrice: 0.06 },
  { id: 'plate_1x6', name: 'Plate 1\u00d76', partNumber: '3666', widthStuds: 1, depthStuds: 6, heightPlates: 1, category: 'plate', estimatedPrice: 0.07 },
  { id: 'plate_2x2', name: 'Plate 2\u00d72', partNumber: '3022', widthStuds: 2, depthStuds: 2, heightPlates: 1, category: 'plate', estimatedPrice: 0.06 },
  { id: 'plate_2x3', name: 'Plate 2\u00d73', partNumber: '3021', widthStuds: 2, depthStuds: 3, heightPlates: 1, category: 'plate', estimatedPrice: 0.07 },
  { id: 'plate_2x4', name: 'Plate 2\u00d74', partNumber: '3020', widthStuds: 2, depthStuds: 4, heightPlates: 1, category: 'plate', estimatedPrice: 0.09 },
];

export const LEGO_DIMENSIONS = {
  STUD_PITCH: 8.0,      // mm — horizontal distance between stud centers
  PLATE_HEIGHT: 3.2,     // mm — height of one plate
  BRICK_HEIGHT: 9.6,     // mm — height of one brick (= 3 plates)
  STUD_DIAMETER: 4.8,    // mm
  STUD_HEIGHT: 1.6,      // mm
};
