import React, { useState } from 'react';
import { MAP_CONFIG } from '../../config/mapConfig';

interface MapImageProps {
  onLoad?: () => void;
}

export const MapImage: React.FC<MapImageProps> = ({ onLoad }) => {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative w-full h-full select-none pointer-events-none">
      <picture className="w-full h-full block">
        {MAP_CONFIG.webpUrl && (
          <source type="image/webp" srcSet={MAP_CONFIG.webpUrl} />
        )}
        <img
          ref={(node) => {
            if (node?.complete && node.naturalWidth > 0) {
              if (node.decode) {
                node.decode().catch(() => {}).finally(() => onLoad?.());
              } else {
                onLoad?.();
              }
            }
          }}
          src={MAP_CONFIG.imageUrl}
          alt="Holly Grace Campus Map"
          width={MAP_CONFIG.nativeWidth}
          height={MAP_CONFIG.nativeHeight}
          className="w-full h-full block select-none pointer-events-none"
          style={{
            imageRendering: '-webkit-optimize-contrast',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
          draggable={false}
          decoding="async"
          fetchPriority="high"
          onLoad={(e) => {
            const target = e.currentTarget;
            if (target.decode) {
              target.decode().catch(() => {}).finally(() => onLoad?.());
            } else {
              onLoad?.();
            }
          }}
          onError={() => {
            setHasError(true);
            onLoad?.();
          }}
        />
      </picture>
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

