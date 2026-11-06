import React, { useState } from 'react';
import { CAMPUS_POSITIONS } from '../../config/campusPositions';
import {
  CalibrationPoint,
  GpsCoordinate,
  PixelPoint,
  ScaleCalibration,
} from '../../types/campus';
import {
  CheckCircle2,
  Compass,
  Crosshair,
  HelpCircle,
  Plus,
  RotateCcw,
  Ruler,
  Trash2,
  X,
} from 'lucide-react';

interface CalibrationModeProps {
  isOpen: boolean;
  onClose: () => void;
  calibrationPoints: CalibrationPoint[];
  onSaveCalibrationPoints: (points: CalibrationPoint[]) => void;
  scaleCalibration: ScaleCalibration;
  onSaveScaleCalibration: (scale: ScaleCalibration) => void;
  currentGps: GpsCoordinate | null;
  onStartPickOnMap: (callback: (pt: PixelPoint) => void) => void;
  isTestModeActive: boolean;
  onToggleTestMode: () => void;
}

export const CalibrationMode: React.FC<CalibrationModeProps> = ({
  isOpen,
  onClose,
  calibrationPoints,
  onSaveCalibrationPoints,
  scaleCalibration,
  onSaveScaleCalibration,
  currentGps,
  onStartPickOnMap,
  isTestModeActive,
  onToggleTestMode,
}) => {
  const [activeTab, setActiveTab] = useState<'gps' | 'scale' | 'dev'>('gps');
  const [newPointName, setNewPointName] = useState('');
  const [tempPixelCoord, setTempPixelCoord] = useState<PixelPoint | null>(null);
  const [tempLat, setTempLat] = useState('');
  const [tempLng, setTempLng] = useState('');
  const [manualScaleMeters, setManualScaleMeters] = useState(
    scaleCalibration.isCalibrated && scaleCalibration.metersPerPixel > 0
      ? String(scaleCalibration.metersPerPixel)
      : ''
  );

  if (!isOpen) return null;

  const validGpsPoints = calibrationPoints.filter((p) => p.gpsCoord !== undefined);
  const isGpsCalibrated = validGpsPoints.length >= 3;

  const handlePickPointOnMap = () => {
    onStartPickOnMap((pickedPt) => {
      setTempPixelCoord(pickedPt);
    });
  };

  const handleUseCurrentGps = () => {
    if (currentGps) {
      setTempLat(currentGps.latitude.toFixed(6));
      setTempLng(currentGps.longitude.toFixed(6));
    }
  };

  const handleSelectPredefinedPosition = (posId: number) => {
    const pos = CAMPUS_POSITIONS.find((p) => p.id === posId);
    if (!pos) return;
    setNewPointName(`Position ${pos.id} (${pos.name})`);
    setTempPixelCoord(pos.pixelCoord);
  };

  const handleAddPoint = () => {
    if (!tempPixelCoord) return;
    const name = newPointName.trim() || `Point ${calibrationPoints.length + 1}`;

    let gpsCoord: GpsCoordinate | undefined;
    const lat = parseFloat(tempLat);
    const lng = parseFloat(tempLng);
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      gpsCoord = { latitude: lat, longitude: lng };
    }

    if (!gpsCoord) {
      alert('Please enter valid GPS coordinates (Latitude and Longitude) for this point.');
      return;
    }

    const newPoint: CalibrationPoint = {
      id: `calib-${Date.now()}`,
      name,
      pixelCoord: tempPixelCoord,
      normalizedCoord: {
        x: tempPixelCoord.x / 1280,
        y: tempPixelCoord.y / 774,
      },
      gpsCoord,
    };

    const updated = [...calibrationPoints, newPoint];
    onSaveCalibrationPoints(updated);

    // Reset inputs
    setNewPointName('');
    setTempPixelCoord(null);
    setTempLat('');
    setTempLng('');
  };

  const handleDeletePoint = (id: string) => {
    const updated = calibrationPoints.filter((p) => p.id !== id);
    onSaveCalibrationPoints(updated);
  };

  const handleResetGps = () => {
    if (window.confirm('Reset all GPS calibration reference points?')) {
      onSaveCalibrationPoints([]);
    }
  };

  const handleSaveScale = () => {
    const mpp = parseFloat(manualScaleMeters);
    if (!isNaN(mpp) && mpp > 0) {
      onSaveScaleCalibration({
        isCalibrated: true,
        metersPerPixel: mpp,
      });
    } else {
      onSaveScaleCalibration({
        isCalibrated: false,
        metersPerPixel: 0,
      });
    }
  };

  const handleResetScale = () => {
    setManualScaleMeters('');
    onSaveScaleCalibration({
      isCalibrated: false,
      metersPerPixel: 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden text-slate-800">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-base text-slate-900 leading-tight">
              Map Settings & Calibration
            </h2>
            <p className="text-[11px] text-slate-500">
              Configure real-world GPS alignment and metric distance
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 px-4 bg-slate-50/50 text-xs">
          <button
            onClick={() => setActiveTab('gps')}
            className={`py-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'gps'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>GPS Alignment ({validGpsPoints.length}/3)</span>
          </button>

          <button
            onClick={() => setActiveTab('scale')}
            className={`py-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'scale'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Metric Scale ({scaleCalibration.isCalibrated ? 'Active' : 'Uncalibrated'})</span>
          </button>

          <button
            onClick={() => setActiveTab('dev')}
            className={`py-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'dev'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Test Mode</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 text-xs">
          {activeTab === 'gps' && (
            <div className="flex flex-col gap-4">
              {/* Status Notice */}
              <div
                className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                  isGpsCalibrated
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                {isGpsCalibrated ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <HelpCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">
                    {isGpsCalibrated
                      ? `GPS Calibrated (${validGpsPoints.length} Points)`
                      : `GPS Uncalibrated (${validGpsPoints.length} of 3 points saved)`}
                  </p>
                  <p className="text-[11px] mt-0.5 text-slate-600 leading-relaxed">
                    {isGpsCalibrated
                      ? 'Live GPS updates will be transformed and projected accurately onto the campus photograph.'
                      : 'To convert GPS (lat/lng) coordinates onto this 2D aerial drone photograph, save at least 3 reference points matching physical campus spots with their measured GPS coordinates.'}
                  </p>
                </div>
              </div>

              {/* Add Reference Point Card */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col gap-2.5">
                <p className="font-bold text-slate-900">Add New Reference Ground Point</p>

                {/* Predefined Position Presets */}
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Select Known Landmark:</span>
                  <div className="flex flex-wrap gap-1">
                    {CAMPUS_POSITIONS.map((pos) => (
                      <button
                        key={`preset-${pos.id}`}
                        type="button"
                        onClick={() => handleSelectPredefinedPosition(pos.id)}
                        className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-medium text-slate-700"
                      >
                        Pos {pos.id}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <input
                  type="text"
                  value={newPointName}
                  onChange={(e) => setNewPointName(e.target.value)}
                  placeholder="Point name (e.g. South Gate, Pos 2 Portico)"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />

                {/* Pick on map */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePickPointOnMap}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shrink-0 flex items-center gap-1"
                  >
                    <Crosshair className="w-3 h-3" />
                    <span>Pick on Map</span>
                  </button>
                  <div className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 font-mono text-[11px] truncate">
                    {tempPixelCoord
                      ? `X: ${tempPixelCoord.x}, Y: ${tempPixelCoord.y}`
                      : 'No point chosen'}
                  </div>
                </div>

                {/* GPS Lat / Lng */}
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Measured GPS Coordinates:</span>
                  {currentGps && (
                    <button
                      type="button"
                      onClick={handleUseCurrentGps}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Use Device GPS
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.000001"
                    value={tempLat}
                    onChange={(e) => setTempLat(e.target.value)}
                    placeholder="Latitude (e.g. 11.234567)"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-[11px] focus:outline-none"
                  />
                  <input
                    type="number"
                    step="0.000001"
                    value={tempLng}
                    onChange={(e) => setTempLng(e.target.value)}
                    placeholder="Longitude (e.g. 75.890123)"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-[11px] focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddPoint}
                  disabled={!tempPixelCoord || !tempLat || !tempLng}
                  className="w-full py-2 bg-slate-900 hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg font-bold flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save Reference Point</span>
                </button>
              </div>

              {/* Saved Points */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Saved Ground Points ({calibrationPoints.length})</span>
                  {calibrationPoints.length > 0 && (
                    <button
                      onClick={handleResetGps}
                      className="text-red-600 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Clear All</span>
                    </button>
                  )}
                </div>

                {calibrationPoints.length === 0 ? (
                  <p className="text-slate-400 py-3 text-center border border-dashed rounded-lg">
                    No calibration points saved yet.
                  </p>
                ) : (
                  <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                    {calibrationPoints.map((pt) => (
                      <div
                        key={pt.id}
                        className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{pt.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            Img: ({pt.pixelCoord.x}, {pt.pixelCoord.y}) • GPS: {pt.gpsCoord?.latitude.toFixed(5)}, {pt.gpsCoord?.longitude.toFixed(5)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeletePoint(pt.id)}
                          className="w-6 h-6 text-slate-400 hover:text-red-600 flex items-center justify-center shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'scale' && (
            <div className="flex flex-col gap-3.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                <p className="font-bold text-slate-900 mb-0.5">Scale Calibration</p>
                <p className="text-[11px]">
                  Walking distance in meters and walking ETA are only calculated after a verified metric scale (meters per pixel) is entered. Uncalibrated maps will never display fake distances.
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col gap-2.5">
                <label className="font-semibold text-slate-700">
                  Meters per Image Pixel (Ratio)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={manualScaleMeters}
                    onChange={(e) => setManualScaleMeters(e.target.value)}
                    placeholder="Enter surveyed scale (e.g. 0.38)"
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveScale}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                  >
                    Save Scale
                  </button>
                  {scaleCalibration.isCalibrated && (
                    <button
                      type="button"
                      onClick={handleResetScale}
                      className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="mt-1 text-[11px]">
                  {scaleCalibration.isCalibrated ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Active Scale: {scaleCalibration.metersPerPixel} meters/pixel</span>
                    </span>
                  ) : (
                    <span className="text-slate-500">
                      Scale is uncalibrated. Distances and walking times are currently hidden.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dev' && (
            <div className="flex flex-col gap-3.5">
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-amber-950">
                <p className="font-bold mb-0.5">Development Simulation Mode</p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Allows manual clicking on the campus photograph to test route calculation from simulated user locations. Keeps simulated testing separate from real device GPS.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Enable Simulated Location</p>
                  <p className="text-[11px] text-slate-500">
                    {isTestModeActive
                      ? 'Active: Click anywhere on campus to move simulated pin'
                      : 'Disabled: Standard navigation mode'}
                  </p>
                </div>

                <button
                  onClick={onToggleTestMode}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors ${
                    isTestModeActive
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {isTestModeActive ? 'Enabled (Active)' : 'Enable'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {isGpsCalibrated ? '✓ GPS Transform Active' : '• GPS Uncalibrated'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
