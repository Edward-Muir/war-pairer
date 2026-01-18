import { ArrowLeft } from 'lucide-react';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function Header({ title, showBack = false, onBack, rightAction }: HeaderProps) {
  return (
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
      <h1 className="flex-1 text-lg font-semibold text-gray-900 text-center truncate">
        {title}
      </h1>

      {/* Right section - Action */}
      <div className="w-12 flex justify-end">{rightAction}</div>
    </header>
  );
}
