export interface LegoColor {
  id: number;
  brickLinkColorId: number; // BrickLink's color ID (-1 if unknown)
  name: string;
  rgb: [number, number, number];
  hex: string;
  isTransparent: boolean;
}

// Official LEGO colors sourced from Rebrickable color database
// brickLinkColorId mapping from https://rebrickable.com/colors/
export const LEGO_COLORS: LegoColor[] = [
  { id: 0, brickLinkColorId: 11, name: 'Black', rgb: [5, 19, 29], hex: '#05131D', isTransparent: false },
  { id: 1, brickLinkColorId: 7, name: 'Blue', rgb: [0, 85, 191], hex: '#0055BF', isTransparent: false },
  { id: 2, brickLinkColorId: 6, name: 'Green', rgb: [35, 120, 65], hex: '#237841', isTransparent: false },
  { id: 3, brickLinkColorId: 39, name: 'Dark Turquoise', rgb: [0, 143, 155], hex: '#008F9B', isTransparent: false },
  { id: 4, brickLinkColorId: 5, name: 'Red', rgb: [201, 26, 9], hex: '#C91A09', isTransparent: false },
  { id: 5, brickLinkColorId: 47, name: 'Dark Pink', rgb: [200, 112, 160], hex: '#C870A0', isTransparent: false },
  { id: 6, brickLinkColorId: 8, name: 'Brown', rgb: [88, 42, 18], hex: '#583A12', isTransparent: false },
  { id: 7, brickLinkColorId: 9, name: 'Light Gray', rgb: [155, 161, 157], hex: '#9BA19D', isTransparent: false },
  { id: 8, brickLinkColorId: 10, name: 'Dark Gray', rgb: [108, 110, 104], hex: '#6C6E68', isTransparent: false },
  { id: 9, brickLinkColorId: 62, name: 'Light Blue', rgb: [176, 210, 228], hex: '#B0D2E4', isTransparent: false },
  { id: 10, brickLinkColorId: 36, name: 'Bright Green', rgb: [75, 159, 74], hex: '#4B9F4A', isTransparent: false },
  { id: 11, brickLinkColorId: 40, name: 'Light Turquoise', rgb: [85, 165, 175], hex: '#55A5AF', isTransparent: false },
  { id: 13, brickLinkColorId: 220, name: 'Coral', rgb: [255, 99, 71], hex: '#FF6347', isTransparent: false },
  { id: 14, brickLinkColorId: 3, name: 'Yellow', rgb: [242, 205, 55], hex: '#F2CD37', isTransparent: false },
  { id: 15, brickLinkColorId: 1, name: 'White', rgb: [255, 255, 255], hex: '#FFFFFF', isTransparent: false },
  { id: 19, brickLinkColorId: 2, name: 'Tan', rgb: [228, 205, 158], hex: '#E4CD9E', isTransparent: false },
  { id: 22, brickLinkColorId: 157, name: 'Medium Lavender', rgb: [172, 120, 186], hex: '#AC78BA', isTransparent: false },
  { id: 25, brickLinkColorId: 4, name: 'Orange', rgb: [254, 138, 24], hex: '#FE8A18', isTransparent: false },
  { id: 26, brickLinkColorId: 71, name: 'Magenta', rgb: [146, 57, 120], hex: '#923978', isTransparent: false },
  { id: 27, brickLinkColorId: 34, name: 'Lime', rgb: [187, 233, 11], hex: '#BBE90B', isTransparent: false },
  { id: 28, brickLinkColorId: 69, name: 'Dark Tan', rgb: [149, 138, 115], hex: '#958A73', isTransparent: false },
  { id: 29, brickLinkColorId: 104, name: 'Bright Pink', rgb: [228, 173, 200], hex: '#E4ADC8', isTransparent: false },
  { id: 69, brickLinkColorId: 89, name: 'Dark Purple', rgb: [96, 0, 108], hex: '#60006C', isTransparent: false },
  { id: 70, brickLinkColorId: 88, name: 'Reddish Brown', rgb: [105, 64, 39], hex: '#694027', isTransparent: false },
  { id: 71, brickLinkColorId: 86, name: 'Light Bluish Gray', rgb: [163, 162, 164], hex: '#A3A2A4', isTransparent: false },
  { id: 72, brickLinkColorId: 85, name: 'Dark Bluish Gray', rgb: [99, 95, 97], hex: '#635F61', isTransparent: false },
  { id: 73, brickLinkColorId: 42, name: 'Medium Blue', rgb: [90, 147, 219], hex: '#5A93DB', isTransparent: false },
  { id: 74, brickLinkColorId: 37, name: 'Medium Green', rgb: [115, 194, 113], hex: '#73C271', isTransparent: false },
  { id: 77, brickLinkColorId: 90, name: 'Light Nougat', rgb: [253, 195, 151], hex: '#FDC397', isTransparent: false },
  { id: 78, brickLinkColorId: 28, name: 'Nougat', rgb: [204, 142, 104], hex: '#CC8E68', isTransparent: false },
  { id: 84, brickLinkColorId: 150, name: 'Medium Nougat', rgb: [170, 125, 85], hex: '#AA7D55', isTransparent: false },
  { id: 85, brickLinkColorId: 63, name: 'Dark Blue', rgb: [0, 51, 89], hex: '#003359', isTransparent: false },
  { id: 86, brickLinkColorId: 120, name: 'Dark Brown', rgb: [49, 15, 6], hex: '#310F06', isTransparent: false },
  { id: 88, brickLinkColorId: 59, name: 'Dark Red', rgb: [114, 14, 15], hex: '#720E0F', isTransparent: false },
  { id: 89, brickLinkColorId: 80, name: 'Dark Green', rgb: [24, 70, 50], hex: '#184632', isTransparent: false },
  { id: 90, brickLinkColorId: 91, name: 'Medium Dark Flesh', rgb: [204, 163, 115], hex: '#CCA373', isTransparent: false },
  { id: 91, brickLinkColorId: 68, name: 'Dark Orange', rgb: [168, 95, 28], hex: '#A85F1C', isTransparent: false },
  { id: 105, brickLinkColorId: 110, name: 'Bright Light Orange', rgb: [249, 186, 97], hex: '#F9BA61', isTransparent: false },
  { id: 110, brickLinkColorId: 43, name: 'Violet', rgb: [67, 84, 163], hex: '#4354A3', isTransparent: false },
  { id: 112, brickLinkColorId: 156, name: 'Medium Azure', rgb: [54, 174, 191], hex: '#36AEBF', isTransparent: false },
  { id: 113, brickLinkColorId: 153, name: 'Dark Azure', rgb: [7, 139, 201], hex: '#078BC9', isTransparent: false },
  { id: 115, brickLinkColorId: 158, name: 'Yellowish Green', rgb: [220, 228, 50], hex: '#DCE432', isTransparent: false },
  { id: 118, brickLinkColorId: 152, name: 'Light Aqua', rgb: [173, 221, 198], hex: '#ADDDC6', isTransparent: false },
  { id: 120, brickLinkColorId: 155, name: 'Olive Green', rgb: [100, 90, 76], hex: '#645A4C', isTransparent: false },
  { id: 150, brickLinkColorId: 48, name: 'Sand Green', rgb: [119, 150, 130], hex: '#779682', isTransparent: false },
  { id: 153, brickLinkColorId: 59, name: 'Dark Red (alt)', rgb: [118, 0, 18], hex: '#760012', isTransparent: false },
  { id: 191, brickLinkColorId: 103, name: 'Bright Light Yellow', rgb: [248, 241, 132], hex: '#F8F184', isTransparent: false },
  { id: 212, brickLinkColorId: 105, name: 'Bright Light Blue', rgb: [159, 195, 233], hex: '#9FC3E9', isTransparent: false },
  { id: 226, brickLinkColorId: 103, name: 'Cool Yellow', rgb: [253, 234, 140], hex: '#FDEA8C', isTransparent: false },
  { id: 232, brickLinkColorId: 87, name: 'Sky Blue', rgb: [119, 186, 236], hex: '#77BAEC', isTransparent: false },
];

/**
 * Find the closest LEGO color to the given RGB value using
 * a weighted Euclidean distance that accounts for human perception.
 */
export function findClosestLegoColor(r: number, g: number, b: number): LegoColor {
  let bestColor = LEGO_COLORS[0];
  let bestDist = Infinity;

  for (const color of LEGO_COLORS) {
    const dr = r - color.rgb[0];
    const dg = g - color.rgb[1];
    const db = b - color.rgb[2];
    // Weighted distance: green is most perceptually important
    const dist = 2 * dr * dr + 4 * dg * dg + 3 * db * db;
    if (dist < bestDist) {
      bestDist = dist;
      bestColor = color;
    }
  }

  return bestColor;
}
