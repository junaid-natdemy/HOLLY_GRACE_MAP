import React, { useEffect, useMemo, useRef } from 'react';
import { CampusPosition, PixelPoint, Stage } from '../../types/campus';
import { formatBuildingDisplayName } from '../../config/campusPositions';
import { Search, X, RotateCcw } from 'lucide-react';

interface MobileNavHeaderProps {
  startPoint: PixelPoint;
  isCustomStart: boolean;
  positions: CampusPosition[];
  selectedStage: Stage | null;
  onOpenSearch: () => void;
  onClearDestination: () => void;
  onResetNavigation: () => void;
}

/** Nearest named campus landmark to a tapped map point (no geocoding involved). */
function getStartLabel(startPoint: PixelPoint, isCustomStart: boolean, positions: CampusPosition[]) {
  if (!isCustomStart) return 'Campus South Entrance';

  let nearest: CampusPosition | null = null;
  let nearestDistance = 200;
  for (const pos of positions) {
    const distance = Math.hypot(pos.pixelCoord.x - startPoint.x, pos.pixelCoord.y - startPoint.y);
    if (distance < nearestDistance) {
      nearest = pos;
      nearestDistance = distance;
    }
  }

  if (nearest) return `Near ${formatBuildingDisplayName(nearest.name)}`;
  return 'Custom pin';
}

export const MobileNavHeader: React.FC<MobileNavHeaderProps> = ({
  startPoint,
  isCustomStart,
  positions,
  selectedStage,
  onOpenSearch,
  onClearDestination,
  onResetNavigation,
}) => {
  const headerRef = useRef<HTMLDivElement | null>(null);

  // Publish the card height so the mobile map starts right below it.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const sync = () => {
      document.documentElement.style.setProperty(
        '--mobile-header-h',
        `${Math.round(el.getBoundingClientRect().height)}px`
      );
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const fromLabel = useMemo(
    () => getStartLabel(startPoint, isCustomStart, positions),
    [startPoint, isCustomStart, positions]
  );

  const canReset = Boolean(selectedStage) || isCustomStart;

  return (
    <div
      ref={headerRef}
      className="md:hidden fixed top-2.5 left-2.5 right-2.5 z-50 pointer-events-auto animate-slide-down"
    >
      {/* One compact horizontal FROM | TO card */}
      <div className="flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-[0_10px_30px_-8px_rgba(15,23,42,0.45)] backdrop-blur-xl">
        {/* FROM (set by tapping the map) */}
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-xl px-1 py-1">
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
          <div className="min-w-0 flex-1">
            <div className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400">From</div>
            <div className="truncate text-[11px] font-semibold leading-tight text-slate-900">
              {fromLabel}
            </div>
          </div>
        </div>

        <span className="h-6 w-px shrink-0 bg-slate-200" />

        {/* TO (opens the destination search) */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Search destination"
          onClick={onOpenSearch}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenSearch();
            }
          }}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 rounded-xl px-1 py-1 text-left"
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-red-500 ring-2 ring-red-100" />
          <div className="min-w-0 flex-1">
            <div className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400">To</div>
            <div
              className={`truncate text-[11px] leading-tight ${
                selectedStage ? 'font-bold text-slate-900' : 'font-medium text-slate-400'
              }`}
            >
              {selectedStage ? selectedStage.name.trim() : 'Search destination'}
            </div>
          </div>

          {selectedStage ? (
            <button
              type="button"
              aria-label="Clear destination"
              onClick={(e) => {
                e.stopPropagation();
                onClearDestination();
              }}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-3 w-3" />
            </button>
          ) : (
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          )}
        </div>

        {canReset && (
          <button
            type="button"
            aria-label="Reset navigation"
            title="Reset navigation"
            onClick={onResetNavigation}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 active:bg-slate-200"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
