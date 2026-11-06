import { useCallback, useEffect, useRef, useState } from 'react';
import { MAP_CONFIG } from '../config/mapConfig';
import { PixelPoint } from '../types/campus';

export interface MapTransformState {
  zoom: number;
  pan: { x: number; y: number };
  containerSize: { width: number; height: number };
  isAtMinZoom: boolean;
}

export function useMapTransform() {
  const [zoom, setZoom] = useState<number>(MAP_CONFIG.defaultZoom);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastTouchDistance = useRef<number | null>(null);
  const lastTouchCenter = useRef<{ x: number; y: number } | null>(null);

  // Measure container dimensions
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>(() => {
    if (typeof window !== 'undefined') {
      return { width: window.innerWidth, height: window.innerHeight };
    }
    return { width: 1280, height: 774 };
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const syncSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    syncSize();

    const observer = new ResizeObserver(syncSize);
    observer.observe(el);
    // Fallback for environments where the observer does not fire on viewport resize.
    window.addEventListener('resize', syncSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncSize);
    };
  }, []);

  // Cover-fit the map so it always fills the viewport edge-to-edge; on tall
  // (mobile) screens this crops the sides instead of leaving empty bands above
  // and below. Whichever axis overflows stays pannable via clampPan.
  const baseScale = Math.max(
    containerSize.width / MAP_CONFIG.nativeWidth,
    containerSize.height / MAP_CONFIG.nativeHeight
  );

  const stageWidth = MAP_CONFIG.nativeWidth * baseScale;
  const stageHeight = MAP_CONFIG.nativeHeight * baseScale;

  const isAtMinZoom = zoom <= 1.001;

  /**
   * Helper: Clamp pan coordinates so the image never leaves the screen boundary.
   * The axis that overflows (height with a width-fitted map) stays pannable
   * even at the minimum zoom.
   */
  const clampPan = useCallback(
    (targetPan: { x: number; y: number }, targetZoom: number): { x: number; y: number } => {
      const currentWidth = stageWidth * targetZoom;
      const currentHeight = stageHeight * targetZoom;

      const maxPanX = Math.max(0, (currentWidth - containerSize.width) / 2);
      const maxPanY = Math.max(0, (currentHeight - containerSize.height) / 2);

      return {
        x: Math.max(-maxPanX, Math.min(maxPanX, targetPan.x)),
        y: Math.max(-maxPanY, Math.min(maxPanY, targetPan.y)),
      };
    },
    [containerSize.width, containerSize.height, stageHeight, stageWidth]
  );

  /**
   * Keep pan inside the new bounds whenever the frame or image size changes
   * (for example after a window resize).
   */
  useEffect(() => {
    setPan((prev) => clampPan(prev, zoom));
  }, [clampPan, zoom]);

  /**
   * Reset / Fit view to center (locked original size)
   */
  const resetView = useCallback(() => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  }, []);

  /**
   * Zoom in with smooth step
   */
  const zoomIn = useCallback(() => {
    setZoom((prevZoom) => {
      const nextZoom = Math.min(MAP_CONFIG.maxZoom, prevZoom * 1.3);
      setPan((prevPan) => clampPan(prevPan, nextZoom));
      return nextZoom;
    });
  }, [clampPan]);

  /**
   * Zoom out with smooth step. Never reduces smaller than original frame size (min 1.0).
   */
  const zoomOut = useCallback(() => {
    setZoom((prevZoom) => {
      const nextZoom = Math.max(MAP_CONFIG.minZoom, prevZoom / 1.3);
      if (nextZoom === prevZoom) return prevZoom;
      setPan((prevPan) => clampPan(prevPan, nextZoom));
      return nextZoom;
    });
  }, [clampPan]);

  /**
   * Focus/center view on a specific image pixel coordinate with boundary clamping
   */
  const focusOnCoordinate = useCallback(
    (target: PixelPoint, targetZoom?: number) => {
      const activeZoom = targetZoom !== undefined ? targetZoom : Math.max(zoom, 1.4);
      setZoom(activeZoom);

      const imgCenterX = MAP_CONFIG.nativeWidth / 2;
      const imgCenterY = MAP_CONFIG.nativeHeight / 2;

      const rawDx = (imgCenterX - target.x) * baseScale * activeZoom;
      const rawDy = (imgCenterY - target.y) * baseScale * activeZoom;

      setPan(clampPan({ x: rawDx, y: rawDy }, activeZoom));
    },
    [baseScale, clampPan, zoom]
  );

  /**
   * Convert client viewport coordinates (clientX, clientY) to native image pixel coordinates (0..1280, 0..774)
   */
  const clientToNativePixel = useCallback(
    (clientX: number, clientY: number): PixelPoint | null => {
      if (!containerRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();

      // Relative to container center
      const relX = clientX - rect.left - rect.width / 2 - pan.x;
      const relY = clientY - rect.top - rect.height / 2 - pan.y;

      const totalScale = baseScale * zoom;
      if (totalScale <= 0) return null;

      // In native image coordinates (relative to image center)
      const nativeX = MAP_CONFIG.nativeWidth / 2 + relX / totalScale;
      const nativeY = MAP_CONFIG.nativeHeight / 2 + relY / totalScale;

      return {
        x: Math.max(0, Math.min(MAP_CONFIG.nativeWidth, Math.round(nativeX * 10) / 10)),
        y: Math.max(0, Math.min(MAP_CONFIG.nativeHeight, Math.round(nativeY * 10) / 10)),
      };
    },
    [baseScale, pan, zoom]
  );

  // Wheel zoom handler centered at mouse cursor
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      if (!containerRef.current) return;

      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      setZoom((prevZoom) => {
        const nextZoom = Math.min(
          MAP_CONFIG.maxZoom,
          Math.max(MAP_CONFIG.minZoom, prevZoom * zoomFactor)
        );

        if (nextZoom === prevZoom) return prevZoom;

        // Adjust pan so mouse point remains stationary, then clamp strictly
        const rect = containerRef.current!.getBoundingClientRect();
        const cursorX = e.clientX - rect.left - rect.width / 2;
        const cursorY = e.clientY - rect.top - rect.height / 2;

        const scaleRatio = nextZoom / prevZoom;
        const unconstrainedPan = {
          x: cursorX - (cursorX - pan.x) * scaleRatio,
          y: cursorY - (cursorY - pan.y) * scaleRatio,
        };

        setPan(clampPan(unconstrainedPan, nextZoom));
        return nextZoom;
      });
    },
    [clampPan, pan.x, pan.y]
  );

  // Mouse drag handlers: DISABLED at original size (zoom <= 1.0)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;

      setIsDragging(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    },
    [zoom]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      lastMousePos.current = { x: e.clientX, y: e.clientY };

      setPan((prev) => clampPan({ x: prev.x + dx, y: prev.y + dy }, zoom));
    },
    [clampPan, isDragging, zoom]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Double click: toggle between zoom 1.0 (fit) and 1.8x zoom on clicked point
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (zoom > 1.001) {
        resetView();
      } else {
        const clickCoord = clientToNativePixel(e.clientX, e.clientY);
        if (clickCoord) {
          focusOnCoordinate(clickCoord, 1.8);
        } else {
          zoomIn();
        }
      }
    },
    [clientToNativePixel, focusOnCoordinate, resetView, zoom, zoomIn]
  );

  // Touch drag and pinch-to-zoom handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        setIsDragging(true);
        lastMousePos.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        lastTouchDistance.current = null;
      } else if (e.touches.length === 2) {
        setIsDragging(false);
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        lastTouchDistance.current = dist;
        lastTouchCenter.current = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2,
        };
      }
    },
    [zoom]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1 && isDragging) {
        const dx = e.touches[0].clientX - lastMousePos.current.x;
        const dy = e.touches[0].clientY - lastMousePos.current.y;
        lastMousePos.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        setPan((prev) => clampPan({ x: prev.x + dx, y: prev.y + dy }, zoom));
      } else if (e.touches.length === 2 && lastTouchDistance.current !== null) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const newDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const ratio = newDist / lastTouchDistance.current;

        setZoom((prev) => {
          const next = Math.min(MAP_CONFIG.maxZoom, Math.max(MAP_CONFIG.minZoom, prev * ratio));
          if (next <= 1.001) {
            setPan({ x: 0, y: 0 });
            return 1.0;
          }

          if (lastTouchCenter.current) {
            const newCenterX = (t1.clientX + t2.clientX) / 2;
            const newCenterY = (t1.clientY + t2.clientY) / 2;
            const dx = newCenterX - lastTouchCenter.current.x;
            const dy = newCenterY - lastTouchCenter.current.y;
            setPan((prevPan) => clampPan({ x: prevPan.x + dx, y: prevPan.y + dy }, next));
            lastTouchCenter.current = { x: newCenterX, y: newCenterY };
          }
          return next;
        });

        lastTouchDistance.current = newDist;
      }
    },
    [clampPan, isDragging, zoom]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    lastTouchDistance.current = null;
    lastTouchCenter.current = null;
  }, []);

  // Attach native wheel listener with non-passive option
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  return {
    containerRef,
    zoom,
    pan,
    baseScale,
    stageWidth,
    stageHeight,
    containerSize,
    isDragging,
    isAtMinZoom,
    zoomIn,
    zoomOut,
    resetView,
    focusOnCoordinate,
    clientToNativePixel,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
      onDoubleClick: handleDoubleClick,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}
