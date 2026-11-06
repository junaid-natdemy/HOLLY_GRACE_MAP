import { useCallback, useEffect, useRef, useState } from 'react';
import { GpsCoordinate } from '../types/campus';

export interface GeolocationState {
  isTracking: boolean;
  gpsCoord: GpsCoordinate | null;
  error: string | null;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unsupported';
  isLocating: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    isTracking: false,
    gpsCoord: null,
    error: null,
    permissionStatus: 'prompt',
    isLocating: false,
  });

  const watchIdRef = useRef<number | null>(null);

  // Check initial permission if available
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setState((prev) => ({
        ...prev,
        permissionStatus: 'unsupported',
        error: 'Geolocation is not supported by your browser.',
      }));
      return;
    }

    if ('permissions' in navigator && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((result) => {
          setState((prev) => ({
            ...prev,
            permissionStatus: result.state as 'prompt' | 'granted' | 'denied',
          }));

          result.onchange = () => {
            setState((prev) => ({
              ...prev,
              permissionStatus: result.state as 'prompt' | 'granted' | 'denied',
            }));
          };
        })
        .catch(() => {
          // Permissions API might not support geolocation in some browsers
        });
    }
  }, []);

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    const coords: GpsCoordinate = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      heading: position.coords.heading,
      timestamp: position.timestamp,
    };

    setState((prev) => ({
      ...prev,
      gpsCoord: coords,
      error: null,
      isLocating: false,
      permissionStatus: 'granted',
    }));
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    let message = 'Unable to determine your location.';
    let permStatus: 'prompt' | 'granted' | 'denied' = 'prompt';

    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'Location access was denied. Please allow location permissions in your browser.';
        permStatus = 'denied';
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Location information is currently unavailable from your device.';
        break;
      case error.TIMEOUT:
        message = 'Location request timed out. Retrying...';
        break;
    }

    setState((prev) => ({
      ...prev,
      error: message,
      isLocating: false,
      permissionStatus: permStatus,
    }));
  }, []);

  const startTracking = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by this browser.',
      }));
      return;
    }

    // Stop any existing watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isTracking: true,
      isLocating: true,
      error: null,
    }));

    const options: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 12000,
    };

    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        options
      );
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isTracking: false,
        isLocating: false,
        error: 'Failed to start GPS tracking: ' + String(err),
      }));
    }
  }, [handleSuccess, handleError]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isTracking: false,
      isLocating: false,
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startTracking,
    stopTracking,
  };
}

