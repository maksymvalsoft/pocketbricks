import { describe, it, expect } from 'vitest';
import { LEGO_COLORS, findClosestLegoColor } from '../legoColors';

describe('LEGO Colors', () => {
  it('should have at least 30 colors', () => {
    expect(LEGO_COLORS.length).toBeGreaterThanOrEqual(30);
  });

  it('should have valid RGB values for all colors', () => {
    for (const color of LEGO_COLORS) {
      expect(color.rgb[0]).toBeGreaterThanOrEqual(0);
      expect(color.rgb[0]).toBeLessThanOrEqual(255);
      expect(color.rgb[1]).toBeGreaterThanOrEqual(0);
      expect(color.rgb[1]).toBeLessThanOrEqual(255);
      expect(color.rgb[2]).toBeGreaterThanOrEqual(0);
      expect(color.rgb[2]).toBeLessThanOrEqual(255);
    }
  });

  it('should find red for (255, 0, 0)', () => {
    const result = findClosestLegoColor(255, 0, 0);
    expect(result.name).toBe('Red');
  });

  it('should find black for (0, 0, 0)', () => {
    const result = findClosestLegoColor(0, 0, 0);
    expect(result.name).toBe('Black');
  });

  it('should find white for (255, 255, 255)', () => {
    const result = findClosestLegoColor(255, 255, 255);
    expect(result.name).toBe('White');
  });

  it('should find a blue color for pure blue input', () => {
    const result = findClosestLegoColor(0, 0, 255);
    expect(result.name.toLowerCase()).toContain('blue');
  });

  it('should find yellow for (240, 200, 50)', () => {
    const result = findClosestLegoColor(240, 200, 50);
    expect(result.name).toBe('Yellow');
  });
});
