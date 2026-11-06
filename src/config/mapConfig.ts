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
  // When replacing with the clean production photograph (without numbered badges),
  // simply update this path or replace public/campus_map_dev.png.
  imageUrl: '/campus-map.webp',
  nativeWidth: 1280,
  nativeHeight: 774,
  aspectRatio: 1280 / 774, // ~1.6537
  minZoom: 1.0,
  maxZoom: 2.8,
  defaultZoom: 1.0,
  initialCenter: { x: 0.5, y: 0.45 },
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

