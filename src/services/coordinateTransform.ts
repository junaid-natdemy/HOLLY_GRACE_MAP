import { CalibrationPoint, GpsCoordinate, PixelPoint, ScaleCalibration } from '../types/campus';

export interface AffineTransformMatrix {
  a: number; // lng to x
  b: number; // lat to x
  c: number; // x offset
  d: number; // lng to y
  e: number; // lat to y
  f: number; // y offset
}

/**
 * Calculate Haversine distance in meters between two GPS coordinates
 */
export function haversineDistanceMeters(coord1: GpsCoordinate, coord2: GpsCoordinate): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;
  const lat1 = (coord1.latitude * Math.PI) / 180;
  const lat2 = (coord2.latitude * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Solve 3x3 linear system for affine transformation using Least Squares
 * Maps (longitude, latitude) -> (x, y)
 */
export function computeGpsToImageTransform(
  points: CalibrationPoint[]
): AffineTransformMatrix | null {
  const validPoints = points.filter((p) => p.gpsCoord !== undefined);
  if (validPoints.length < 3) {
    return null; // Minimum 3 non-collinear points required for robust 2D affine mapping
  }

  // Normal equations for [lng, lat, 1] * [a, b, c]^T = x
  let sumLng2 = 0;
  let sumLat2 = 0;
  let sumLngLat = 0;
  let sumLng = 0;
  let sumLat = 0;
  let n = validPoints.length;

  let sumXLng = 0;
  let sumXLat = 0;
  let sumX = 0;

  let sumYLng = 0;
  let sumYLat = 0;
  let sumY = 0;

  for (const pt of validPoints) {
    const lng = pt.gpsCoord!.longitude;
    const lat = pt.gpsCoord!.latitude;
    const x = pt.pixelCoord.x;
    const y = pt.pixelCoord.y;

    sumLng2 += lng * lng;
    sumLat2 += lat * lat;
    sumLngLat += lng * lat;
    sumLng += lng;
    sumLat += lat;

    sumXLng += x * lng;
    sumXLat += x * lat;
    sumX += x;

    sumYLng += y * lng;
    sumYLat += y * lat;
    sumY += y;
  }

  // Matrix M =
  // [ sumLng2,   sumLngLat, sumLng ]
  // [ sumLngLat, sumLat2,   sumLat ]
  // [ sumLng,    sumLat,    n      ]
  const m00 = sumLng2, m01 = sumLngLat, m02 = sumLng;
  const m10 = sumLngLat, m11 = sumLat2, m12 = sumLat;
  const m20 = sumLng, m21 = sumLat, m22 = n;

  const det =
    m00 * (m11 * m22 - m12 * m21) -
    m01 * (m10 * m22 - m12 * m20) +
    m02 * (m10 * m21 - m11 * m20);

  if (Math.abs(det) < 1e-18) {
    console.warn('Calibration points are degenerate or collinear.');
    return null;
  }

  // Invert 3x3 matrix
  const invDet = 1 / det;
  const inv00 = (m11 * m22 - m12 * m21) * invDet;
  const inv01 = (m02 * m21 - m01 * m22) * invDet;
  const inv02 = (m01 * m12 - m02 * m11) * invDet;

  const inv10 = (m12 * m20 - m10 * m22) * invDet;
  const inv11 = (m00 * m22 - m02 * m20) * invDet;
  const inv12 = (m02 * m10 - m00 * m12) * invDet;

  const inv20 = (m10 * m21 - m11 * m20) * invDet;
  const inv21 = (m01 * m20 - m00 * m21) * invDet;
  const inv22 = (m00 * m11 - m01 * m10) * invDet;

  // Solve for X coefficients: a, b, c
  const a = inv00 * sumXLng + inv01 * sumXLat + inv02 * sumX;
  const b = inv10 * sumXLng + inv11 * sumXLat + inv12 * sumX;
  const c = inv20 * sumXLng + inv21 * sumXLat + inv22 * sumX;

  // Solve for Y coefficients: d, e, f
  const d = inv00 * sumYLng + inv01 * sumYLat + inv02 * sumY;
  const e = inv10 * sumYLng + inv11 * sumYLat + inv12 * sumY;
  const f = inv20 * sumYLng + inv21 * sumYLat + inv22 * sumY;

  return { a, b, c, d, e, f };
}

/**
 * Transform GPS coordinate to Image Pixel coordinate using the calibrated matrix
 */
export function gpsToPixel(
  gps: GpsCoordinate,
  matrix: AffineTransformMatrix | null
): PixelPoint | null {
  if (!matrix) return null;

  const x = matrix.a * gps.longitude + matrix.b * gps.latitude + matrix.c;
  const y = matrix.d * gps.longitude + matrix.e * gps.latitude + matrix.f;

  return {
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10,
  };
}

/**
 * Derive scale calibration from GPS calibration points
 */
export function deriveScaleFromGpsPoints(points: CalibrationPoint[]): ScaleCalibration {
  const valid = points.filter((p) => p.gpsCoord !== undefined);
  if (valid.length < 2) {
    return { isCalibrated: false, metersPerPixel: 0 };
  }

  // Average meters per pixel across point pairs
  let totalMetersPerPixel = 0;
  let pairCount = 0;

  for (let i = 0; i < valid.length; i++) {
    for (let j = i + 1; j < valid.length; j++) {
      const p1 = valid[i];
      const p2 = valid[j];
      const pixDist = Math.hypot(p2.pixelCoord.x - p1.pixelCoord.x, p2.pixelCoord.y - p1.pixelCoord.y);
      if (pixDist > 50) {
        const meters = haversineDistanceMeters(p1.gpsCoord!, p2.gpsCoord!);
        if (meters > 5) {
          totalMetersPerPixel += meters / pixDist;
          pairCount++;
        }
      }
    }
  }

  if (pairCount > 0) {
    return {
      isCalibrated: true,
      metersPerPixel: Math.round((totalMetersPerPixel / pairCount) * 1000) / 1000,
      referenceDistanceMeters: Math.round(totalMetersPerPixel / pairCount * 100),
    };
  }

  return { isCalibrated: false, metersPerPixel: 0 };
}

