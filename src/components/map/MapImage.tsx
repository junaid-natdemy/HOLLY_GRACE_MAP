import React, { useState } from 'react';
import { MAP_CONFIG } from '../../config/mapConfig';

interface MapImageProps {
  onLoad?: () => void;
}

export const MapImage: React.FC<MapImageProps> = ({ onLoad }) => {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative w-full h-full select-none pointer-events-none">
      <img
        ref={(node) => {
          if (node?.complete && node.naturalWidth > 0) onLoad?.();
        }}
        src={MAP_CONFIG.imageUrl}
        alt="Holly Grace Campus Map"
        width={MAP_CONFIG.nativeWidth}
        height={MAP_CONFIG.nativeHeight}
        className="w-full h-full block select-none pointer-events-none"
        draggable={false}
        decoding="async"
        fetchPriority="high"
        onLoad={onLoad}
        onError={() => {
          setHasError(true);
          onLoad?.();
        }}
      />
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-700 p-6 text-center">
          <p className="font-semibold text-lg mb-2">Campus Map Image Not Found</p>
          <p className="text-sm max-w-md">
            Please ensure the campus photograph is available at{' '}
            <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs">{MAP_CONFIG.imageUrl}</code>
          </p>
        </div>
      )}
    </div>
  );
};

