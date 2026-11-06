import React, { useEffect, useState } from 'react';

interface WelcomeScreenProps {
  imageReady: boolean;
}

const DURATION_MS = 2000;

/**
 * Classic white splash. The count runs 1 → 100 in two seconds,
 * then the screen leaves once the campus photograph is ready.
 */
export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ imageReady }) => {
  const [percent, setPercent] = useState(1);
  const [mounted, setMounted] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const finished = percent >= 100 && imageReady;

  useEffect(() => {
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION_MS);
      setPercent(Math.max(1, Math.round(t * 100)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!finished) return;
    setLeaving(true);
    const timer = window.setTimeout(() => setMounted(false), 380);
    return () => window.clearTimeout(timer);
  }, [finished]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[80] flex items-center justify-center bg-white text-black transition-opacity duration-300 ${
        leaving ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      role="status"
      aria-live="polite"
      aria-label={`Loading campus map, ${percent} percent`}
    >
      <div className="flex w-[min(88vw,280px)] flex-col items-center">
        <img
          src="/holly-grace-logo.png"
          alt="Holy Grace"
          className="h-auto w-[132px] select-none"
          draggable={false}
        />

        <p
          className="mt-6 text-[22px] leading-none tracking-tight text-black"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          Holly Grace
        </p>
        <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.28em] text-black/70">
          Campus Map
        </p>

        <div className="mt-10 w-full">
          <div className="h-px w-full bg-black/15">
            <div className="h-px bg-black" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-3 text-center text-[13px] tabular-nums tracking-wide text-black">
            {percent}%
          </p>
        </div>
      </div>
    </div>
  );
};
