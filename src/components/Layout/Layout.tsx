import { Header } from './Header';
import { PhaseIndicator } from './PhaseIndicator';
import type { Phase } from '@/store/types';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  currentPhase?: Phase;
  hideMenu?: boolean;
}

export function Layout({
  children,
  title,
  showBack = false,
  onBack,
  rightAction,
  currentPhase,
  hideMenu,
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        title={title}
        showBack={showBack}
        onBack={onBack}
        rightAction={rightAction}
        hideMenu={hideMenu}
      />

      {currentPhase && <PhaseIndicator currentPhase={currentPhase} />}

      <main className="flex-1 overflow-auto pb-4">{children}</main>
    </div>
  );
}
