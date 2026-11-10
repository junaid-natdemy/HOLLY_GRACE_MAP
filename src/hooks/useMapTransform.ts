import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  const stageRef = useRef<HTMLDivElement | null>(null);
  const panRef = useRef(pan);
  const zoomRef = useRef(zoom);
  const gestureRef = useRef(false);
  const draggingRef = useRef(false);
  const wheelIdleRef = useRef<number | null>(null);

  const paintTransform = (nextPan: { x: number; y: number }, nextZoom: number) => {
    panRef.current = nextPan;
    zoomRef.current = nextZoom;
    const el = stageRef.current;
    if (!el) return;
    el.style.transition = gestureRef.current ? 'none' : 'transform 0.12s ease-out';
    el.style.transform = `translate(calc(-50% + ${nextPan.x}px), calc(-50% + ${nextPan.y}px)) scale(${nextZoom})`;
  };

  // Keep the on-screen layer in sync, including if a parent render happens mid-gesture.
  useLayoutEffect(() => {
    if (gestureRef.current) {
      paintTransform(panRef.current, zoomRef.current);
      return;
    }
    panRef.current = pan;
    zoomRef.current = zoom;
    paintTransform(pan, zoom);
  }, [pan, zoom]);

  // Measure container dimensions
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>(() => {
    if (typeof window !== 'undefined') {
      return { width: window.innerWidth, height: window.innerHeight };
    }
    return { width: MAP_CONFIG.nativeWidth, height: MAP_CONFIG.nativeHeight };
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

  // Fill the screen edge to edge, including the full width. The shorter
  // axis is cropped; panning stays inside the photo so no empty band opens.
  // Multiply by 1.002 to eliminate subpixel rounding gaps on Retina/fractional displays.
  const baseScale =
    Math.max(
      containerSize.width / MAP_CONFIG.nativeWidth,
      containerSize.height / MAP_CONFIG.nativeHeight
    ) * 1.002;

  const stageWidth = MAP_CONFIG.nativeWidth * baseScale;
  const stageHeight = MAP_CONFIG.nativeHeight * baseScale;

  const isAtMinZoom = zoom <= 1.001;

  /**
   * Strictly keep the photo covering the screen edge-to-edge.
   * Clamps pan so that neither left, right, top, nor bottom gaps ever reveal
   * the green background underneath.
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
   * Reset / Fit view to center (locked edge-to-edge coverage)
   */
  const resetView = useCallback(() => {
    setZoom(1.0);
    setPan(clampPan({ x: 0, y: 0 }, 1.0));
  }, [clampPan]);

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
   * Center the view on an image pixel. Zoom stays as the user left it unless
   * the caller passes an explicit target zoom (double-click to zoom in).
   * On mobile, shifts the target slightly upward so it sits above the bottom drawer.
   */
  const focusOnCoordinate = useCallback(
    (target: PixelPoint, targetZoom?: number) => {
      const isMobileScreen = containerSize.width < 768;
      const activeZoom = targetZoom !== undefined ? targetZoom : zoom;
      if (targetZoom !== undefined) setZoom(activeZoom);

      const imgCenterX = MAP_CONFIG.nativeWidth / 2;
      const imgCenterY = MAP_CONFIG.nativeHeight / 2;

      // On mobile, the bottom sheet covers the lower portion of the screen.
      // Offset target upward by ~80px so it is perfectly framed in the visible map area.
      // On desktop, offset downward by 35px for top-navbar clearance.
      const verticalOffset = isMobileScreen ? -80 : 35;

      const rawDx = (imgCenterX - target.x) * baseScale * activeZoom;
      const rawDy = (imgCenterY - target.y) * baseScale * activeZoom + verticalOffset;

      setPan(clampPan({ x: rawDx, y: rawDy }, activeZoom));
    },
    [baseScale, clampPan, containerSize.width, zoom]
  );

  /**
   * Convert client viewport coordinates (clientX, clientY) to native image pixel coordinates (0..1280, 0..774)
   */
  const clientToNativePixel = useCallback(
    (clientX: number, clientY: number): PixelPoint | null => {
      if (!containerRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();

      // Relative to container center
      const relX = clientX - rect.left - rect.width / 2 - panRef.current.x;
      const relY = clientY - rect.top - rect.height / 2 - panRef.current.y;

      const totalScale = baseScale * zoomRef.current;
      if (totalScale <= 0) return null;

      // In native image coordinates (relative to image center)
      const nativeX = MAP_CONFIG.nativeWidth / 2 + relX / totalScale;
      const nativeY = MAP_CONFIG.nativeHeight / 2 + relY / totalScale;

      return {
        x: Math.max(0, Math.min(MAP_CONFIG.nativeWidth, Math.round(nativeX * 10) / 10)),
        y: Math.max(0, Math.min(MAP_CONFIG.nativeHeight, Math.round(nativeY * 10) / 10)),
      };
    },
    [baseScale]
  );

  // Wheel zoom handler centered at mouse cursor. The layer moves immediately;
  // React state catches up once the wheel pauses so the rest of the map does not re-render per tick.
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      if (!containerRef.current) return;

      const prevZoom = zoomRef.current;
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      const nextZoom = Math.min(
        MAP_CONFIG.maxZoom,
        Math.max(MAP_CONFIG.minZoom, prevZoom * zoomFactor)
      );
      if (nextZoom === prevZoom) return;

      gestureRef.current = true;
      const rect = containerRef.current.getBoundingClientRect();
      const cursorX = e.clientX - rect.left - rect.width / 2;
      const cursorY = e.clientY - rect.top - rect.height / 2;
      const scaleRatio = nextZoom / prevZoom;
      const currentPan = panRef.current;
      const nextPan = clampPan(
        {
          x: cursorX - (cursorX - currentPan.x) * scaleRatio,
          y: cursorY - (cursorY - currentPan.y) * scaleRatio,
        },
        nextZoom
      );
      paintTransform(nextPan, nextZoom);

      if (wheelIdleRef.current !== null) window.clearTimeout(wheelIdleRef.current);
      wheelIdleRef.current = window.setTimeout(() => {
        gestureRef.current = false;
        wheelIdleRef.current = null;
        setPan(panRef.current);
        setZoom(zoomRef.current);
      }, 120);
    },
    [clampPan]
  );

  const finishGesture = useCallback(() => {
    const wasGesturing = gestureRef.current || draggingRef.current;
    gestureRef.current = false;
    draggingRef.current = false;
    setIsDragging(false);
    if (!wasGesturing) return;
    setPan(panRef.current);
    setZoom(zoomRef.current);
  }, []);

  // Mouse drag: ONLY moves when left mouse button is pressed down (e.buttons === 1).
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;

    // Do NOT pan the map if clicking on an interactive marker, building, road node, boundary node, or control
    const target = e.target as HTMLElement | SVGElement | null;
    if (target) {
      if (
        target.closest(
          'button, input, select, textarea, a, [data-no-pan], .campus-markers-layer, .road-editor-overlay-layer, .boundary-nodes, .boundary-edges, [data-interactive-node]'
        )
      ) {
        return;
      }
    }

    gestureRef.current = true;
    draggingRef.current = true;
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    paintTransform(panRef.current, zoomRef.current);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      // strictly require dragging flag AND primary mouse button to be currently held down
      if (!draggingRef.current || e.buttons !== 1) {
        if (draggingRef.current) {
          finishGesture();
        }
        return;
      }
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      paintTransform(
        clampPan(
          { x: panRef.current.x + dx, y: panRef.current.y + dy },
          zoomRef.current
        ),
        zoomRef.current
      );
    },
    [clampPan, finishGesture]
  );

  const handleMouseUp = useCallback(() => {
    finishGesture();
  }, [finishGesture]);

  // Window-level mouseup so releasing the mouse outside the canvas always stops dragging
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (draggingRef.current) {
        finishGesture();
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [finishGesture]);

  // Double tap returns to the full campus. It does not zoom further in.
  const handleDoubleClick = useCallback(() => {
    resetView();
  }, [resetView]);

  // Touch drag and pinch. Same as the mouse path: move the layer directly, commit when the fingers lift.
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    gestureRef.current = true;
    if (e.touches.length === 1) {
      draggingRef.current = true;
      setIsDragging(true);
      lastMousePos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      lastTouchDistance.current = null;
    } else if (e.touches.length === 2) {
      draggingRef.current = false;
      setIsDragging(true);
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      lastTouchDistance.current = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      lastTouchCenter.current = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };
    }
    paintTransform(panRef.current, zoomRef.current);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1 && draggingRef.current) {
        const dx = e.touches[0].clientX - lastMousePos.current.x;
        const dy = e.touches[0].clientY - lastMousePos.current.y;
        lastMousePos.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        paintTransform(
          clampPan(
            { x: panRef.current.x + dx, y: panRef.current.y + dy },
            zoomRef.current
          ),
          zoomRef.current
        );
      } else if (e.touches.length === 2 && lastTouchDistance.current !== null) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const newDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const ratio = Math.min(1.2, Math.max(0.8, newDist / lastTouchDistance.current));
        const prevZoom = zoomRef.current;
        const nextZoom = Math.min(
          MAP_CONFIG.maxZoom,
          Math.max(MAP_CONFIG.minZoom, prevZoom * ratio)
        );

        if (nextZoom <= 1.001) {
          paintTransform({ x: 0, y: 0 }, 1);
        } else {
          let nextPan = panRef.current;
          if (lastTouchCenter.current) {
            const newCenterX = (t1.clientX + t2.clientX) / 2;
            const newCenterY = (t1.clientY + t2.clientY) / 2;
            nextPan = clampPan(
              {
                x: nextPan.x + (newCenterX - lastTouchCenter.current.x),
                y: nextPan.y + (newCenterY - lastTouchCenter.current.y),
              },
              nextZoom
            );
            lastTouchCenter.current = { x: newCenterX, y: newCenterY };
          }
          paintTransform(nextPan, nextZoom);
        }

        lastTouchDistance.current = newDist;
      }
    },
    [clampPan]
  );

  const handleTouchEnd = useCallback(() => {
    lastTouchDistance.current = null;
    lastTouchCenter.current = null;
    finishGesture();
  }, [finishGesture]);

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
    stageRef,
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
