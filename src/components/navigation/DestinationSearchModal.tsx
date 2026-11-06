import React, { useEffect, useState } from 'react';
import { CampusPosition, Stage } from '../../types/campus';
import { DestinationSelectorPanel } from './DestinationSelectorPanel';

interface DestinationSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStage: (stage: Stage) => void;
  stages: Stage[];
  positions: CampusPosition[];
  selectedStage: Stage | null;
}

/**
 * Mobile presentation of the destination selector.
 *
 * Desktop no longer uses a centered modal: the destination selector is an
 * anchored dropdown rendered by DesktopNavPanel, directly beneath the
 * Destination field. This component only renders a bottom sheet on small
 * screens and stays inert everywhere else.
 */
export const DestinationSearchModal: React.FC<DestinationSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectStage,
  stages,
  positions,
  selectedStage,
}) => {
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 767px)').matches
      : false
  );

  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const handleChange = () => setIsMobileViewport(query.matches);
    handleChange();
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  if (!isOpen || !isMobileViewport) return null;

  return (
    <div className="fixed inset-0 z-40 md:hidden animate-fade-in">
      {/* Transparent click-catcher: the campus map stays fully visible (no blur or dimming) */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Compact mobile bottom sheet */}
      <div className="absolute inset-x-0 bottom-0 flex h-[min(78vh,600px)] flex-col overflow-hidden rounded-t-[22px] border-t border-slate-200 bg-white shadow-[0_-16px_40px_-12px_rgba(15,23,42,0.25)]">
        <div className="flex shrink-0 justify-center pb-1 pt-2">
          <span className="h-1 w-10 rounded-full bg-slate-200" />
        </div>
        <div className="min-h-0 flex-1">
          <DestinationSelectorPanel
            stages={stages}
            positions={positions}
            selectedStage={selectedStage}
            onSelectStage={onSelectStage}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
};
