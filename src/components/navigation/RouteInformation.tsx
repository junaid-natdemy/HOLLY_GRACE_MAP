import React from 'react';
import { getPositionById } from '../../config/campusPositions';
import { RouteResult, ScaleCalibration, Stage, UserLocation } from '../../types/campus';
import {
  Clock,
  Footprints,
  MapPin,
  Navigation,
  RotateCcw,
} from 'lucide-react';

interface RouteInformationProps {
  selectedStage: Stage | null;
  route: RouteResult | null;
  userLocation: UserLocation | null;
  scaleCalibration: ScaleCalibration;
  onChangeDestination: () => void;
  onClearDestination: () => void;
}

export const RouteInformation: React.FC<RouteInformationProps> = ({
  selectedStage,
  route,
  userLocation,
  scaleCalibration,
  onChangeDestination,
  onClearDestination,
}) => {
  if (!selectedStage || !route) return null;

  const position = getPositionById(selectedStage.positionId);
  const isScaleCalibrated =
    scaleCalibration.isCalibrated &&
    scaleCalibration.metersPerPixel > 0 &&
    (route.calibratedDistanceMeters ?? 0) > 0;

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 p-3.5 w-full text-slate-800 transition-all">
      {/* Stage Number, Stage Name, and Position */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex flex-col items-center justify-center font-extrabold shrink-0 shadow-sm">
            <span className="text-[9px] uppercase tracking-wider opacity-80 leading-none">Stage</span>
            <span className="text-base leading-tight">{selectedStage.stageNumber}</span>
          </div>

          <div className="min-w-0">
            <h3 className="font-bold text-sm text-slate-900 truncate">
              {selectedStage.name}
            </h3>
            <p className="text-xs text-slate-600 flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
              <span>{position?.name}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onChangeDestination}
          className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
        >
          Change
        </button>
      </div>

      {/* Current Location Status and Destination Status */}
      <div className="bg-slate-50 rounded-xl p-2.5 mb-2.5 text-xs border border-slate-100 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-slate-700 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="font-semibold text-slate-600 shrink-0">Current Location:</span>
          <span className="text-slate-900 truncate">
            {userLocation
              ? userLocation.type === 'gps'
                ? 'Live GPS Location'
                : 'Simulated Location (Test Mode)'
              : 'Campus South Entrance Gate'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-700 truncate">
          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          <span className="font-semibold text-slate-600 shrink-0">Destination:</span>
          <span className="text-slate-900 truncate">
            Stage {selectedStage.stageNumber} • {position?.name}
          </span>
        </div>
      </div>

      {/* Walking distance and ETA: ONLY displayed after valid scale calibration */}
      {isScaleCalibrated && (
        <div className="grid grid-cols-2 gap-2 mb-2.5">
          <div className="bg-emerald-50/60 rounded-xl p-2 border border-emerald-100 flex items-center gap-2">
            <Footprints className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <p className="text-[10px] text-emerald-800 font-medium">Walking Distance</p>
              <p className="text-xs font-bold text-slate-900">
                {route.calibratedDistanceMeters} meters
              </p>
            </div>
          </div>

          <div className="bg-blue-50/60 rounded-xl p-2 border border-blue-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <p className="text-[10px] text-blue-800 font-medium">Est. Walk Time</p>
              <p className="text-xs font-bold text-slate-900">
                ~{route.estimatedWalkingMinutes} min
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Footer: Clear Route & Change Destination */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
        <button
          onClick={onClearDestination}
          className="flex-1 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear Route</span>
        </button>

        <button
          onClick={onChangeDestination}
          className="flex-1 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-black rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Change Destination</span>
        </button>
      </div>
    </div>
  );
};
