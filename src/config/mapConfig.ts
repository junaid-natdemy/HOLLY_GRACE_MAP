import { NormalizedPoint, PixelPoint } from '../types/campus';

export interface MapConfig {
  imageUrl: string;
  nativeWidth: number;
  nativeHeight: number;
  aspectRatio: number;
  minZoom: number;
  maxZoom: number;
  defaultZoom: number;
  initialCenter: NormalizedPoint;
}

export const MAP_CONFIG: MapConfig = {
  // Configurable campus image path.
  // Updated with new campus photograph (1127x1396)
  imageUrl: '/campus-map-new.png',
  nativeWidth: 1127,
  nativeHeight: 1396,
  aspectRatio: 1127 / 1396, // ~0.8073
  minZoom: 1.0,
  maxZoom: 3.5,
  defaultZoom: 1.0,
  initialCenter: { x: 0.5, y: 0.5 },
};

/**
 * Convert normalized coordinates (0..1) to native image pixel coordinates (0..1280, 0..774)
 */
export function normalizedToPixel(norm: NormalizedPoint): PixelPoint {
  return {
    x: Math.round(norm.x * MAP_CONFIG.nativeWidth * 10) / 10,
    y: Math.round(norm.y * MAP_CONFIG.nativeHeight * 10) / 10,
  };
}

/**
 * Convert native image pixel coordinates to normalized coordinates (0..1)
 */
export function pixelToNormalized(pix: PixelPoint): NormalizedPoint {
  return {
    x: pix.x / MAP_CONFIG.nativeWidth,
    y: pix.y / MAP_CONFIG.nativeHeight,
  };
}

