import { lazy, Suspense, useState } from 'react';
import { ArrowLeft, Menu as MenuIcon } from 'lucide-react';

const Menu = lazy(() => import('./Menu').then((m) => ({ default: m.Menu })));

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  hideMenu?: boolean;
}

export function Header({ title, showBack = false, onBack, rightAction, hideMenu }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 h-14 flex items-center px-4">
        {/* Left section - Back button */}
        <div className="w-12 flex justify-start">
          {showBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Center section - Title */}
        <h1 className="flex-1 text-lg font-semibold text-gray-900 text-center truncate">{title}</h1>

        {/* Right section - Action(s) + Menu button */}
        <div className="flex items-center justify-end gap-1">
          {rightAction}
          {!hideMenu && (
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Open menu"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {!hideMenu && (
        <Suspense>
          <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
