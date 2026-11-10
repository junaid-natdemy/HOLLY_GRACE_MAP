import React from 'react';

interface Tour360ButtonProps {
  onOpen360?: () => void;
  className?: string;
  variant?: 'floating' | 'navbar';
}

export const Tour360Button: React.FC<Tour360ButtonProps> = ({
  onOpen360,
  className = '',
  variant = 'floating',
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onOpen360) {
      onOpen360();
    } else {
      try {
        sessionStorage.setItem('campus_last_active_map_url', window.location.href);
      } catch {}
      const returnUrl = encodeURIComponent(window.location.href);
      window.location.href = `https://360-degree-holy-grace.vercel.app/?returnUrl=${returnUrl}`;
    }
  };

  if (variant === 'navbar') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label="360 Degree Map Virtual Tour"
        title="Open 360° Campus Virtual Tour"
        className={`group flex items-center gap-1.5 h-7 px-2 rounded-md bg-emerald-50/90 hover:bg-emerald-100/90 active:scale-[0.98] text-emerald-700 font-bold text-[9.5px] border border-emerald-200/80 shadow-2xs transition-all cursor-pointer ${className}`}
      >
        <svg
          className="w-3 h-3 text-emerald-600 transition-transform duration-500 group-hover:rotate-180"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21.5 12a9.5 9.5 0 1 1-2.5-6.3L21.5 8" />
          <polyline points="21.5 3 21.5 8 16.5 8" />
        </svg>
        <span>360° Map</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="360 Degree Map Virtual Tour"
      title="Open 360° Campus Virtual Tour"
      className={`group flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_8px_25px_-6px_rgba(15,23,42,0.22)] hover:shadow-xl hover:border-emerald-300 hover:bg-white active:scale-95 transition-all select-none cursor-pointer pointer-events-auto ${className}`}
    >
      {/* 360 Icon with subtle animated orbit aura */}
      <div className="relative flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 border border-emerald-200/60 shadow-2xs group-hover:scale-105 transition-transform shrink-0">
        <svg
          className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-500 group-hover:rotate-180"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21.5 12a9.5 9.5 0 1 1-2.5-6.3L21.5 8" />
          <polyline points="21.5 3 21.5 8 16.5 8" />
          <ellipse cx="12" cy="12" rx="3" ry="7" strokeWidth="1.2" strokeDasharray="2.5 2" opacity="0.6" />
        </svg>
        {/* Live beacon dot */}
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      </div>

      {/* Button Typography */}
      <div className="flex flex-col text-left leading-none pr-0.5">
        <span className="text-[11px] sm:text-[12px] font-extrabold tracking-tight text-slate-800 group-hover:text-emerald-700 transition-colors">
          360° Map
        </span>
        <span className="text-[7px] sm:text-[7.5px] font-bold uppercase tracking-wider text-emerald-600 mt-0.5">
          Virtual Tour
        </span>
      </div>
    </button>
  );
};
