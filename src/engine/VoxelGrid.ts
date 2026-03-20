export interface Voxel {
  x: number;
  y: number;
  z: number;
  r: number;
  g: number;
  b: number;
  filled: boolean;
}

export class VoxelGrid {
  width: number;
  height: number;
  depth: number;

  private filled: Uint8Array;
  private colors: Uint8Array;

  constructor(width: number, height: number, depth: number) {
    this.width = width;
    this.height = height;
    this.depth = depth;
    const size = width * height * depth;
    this.filled = new Uint8Array(size);
    this.colors = new Uint8Array(size * 3);
  }

  index(x: number, y: number, z: number): number {
    return x + y * this.width + z * this.width * this.height;
  }

  inBounds(x: number, y: number, z: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height && z >= 0 && z < this.depth;
  }

  isFilled(x: number, y: number, z: number): boolean {
    if (!this.inBounds(x, y, z)) return false;
    return this.filled[this.index(x, y, z)] === 1;
  }

  setFilled(x: number, y: number, z: number, value: boolean): void {
    if (!this.inBounds(x, y, z)) return;
    this.filled[this.index(x, y, z)] = value ? 1 : 0;
  }

  getColor(x: number, y: number, z: number): [number, number, number] {
    const i = this.index(x, y, z) * 3;
    return [this.colors[i], this.colors[i + 1], this.colors[i + 2]];
  }

  setColor(x: number, y: number, z: number, r: number, g: number, b: number): void {
    if (!this.inBounds(x, y, z)) return;
    const i = this.index(x, y, z) * 3;
    this.colors[i] = r;
    this.colors[i + 1] = g;
    this.colors[i + 2] = b;
  }

  forEach(callback: (x: number, y: number, z: number, filled: boolean) => void): void {
    for (let z = 0; z < this.depth; z++) {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          callback(x, y, z, this.isFilled(x, y, z));
        }
      }
    }
  }

  getFilledVoxels(): Array<{ x: number; y: number; z: number; r: number; g: number; b: number }> {
    const result: Array<{ x: number; y: number; z: number; r: number; g: number; b: number }> = [];
    this.forEach((x, y, z, filled) => {
      if (filled) {
        const [r, g, b] = this.getColor(x, y, z);
        result.push({ x, y, z, r, g, b });
      }
    });
    return result;
  }

  filledCount(): number {
    let count = 0;
    for (let i = 0; i < this.filled.length; i++) {
      count += this.filled[i];
    }
    return count;
  }
}
