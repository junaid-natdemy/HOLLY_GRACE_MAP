import React from 'react';
import { Maximize2, Minus, Plus } from 'lucide-react';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  isAtMinZoom?: boolean;
  className?: string;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onResetView,
  isAtMinZoom = false,
  className = 'top-28 right-3 sm:top-4 sm:right-4',
}) => {
  return (
    <div className={`absolute z-20 flex flex-col items-end gap-2 pointer-events-auto transition-all ${className}`}>
      {/* Zoom and Fit Campus Controls */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 p-1 flex flex-col gap-1 text-slate-700">
        <button
          onClick={onZoomIn}
          title="Zoom In"
          aria-label="Zoom In"
          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
        </button>

        <div className="h-px bg-slate-100 mx-2" />

        <button
          onClick={onZoomOut}
          disabled={isAtMinZoom}
          title={isAtMinZoom ? 'Original Frame Size (Minimum Zoom)' : 'Zoom Out'}
          aria-label="Zoom Out"
          className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl transition-all ${
            isAtMinZoom
              ? 'opacity-30 cursor-not-allowed text-slate-400'
              : 'hover:bg-slate-100 active:bg-slate-200 text-slate-700'
          }`}
        >
          <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <div className="h-px bg-slate-100 mx-2" />

        <button
          onClick={onResetView}
          title="Fit Campus to Screen"
          aria-label="Fit Campus to Screen"
          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700" />
        </button>
      </div>
    </div>
  );
};
