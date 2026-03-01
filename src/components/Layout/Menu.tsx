import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Info, Settings2, X } from 'lucide-react';
import { APP_VERSION } from '@/version';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItemClass =
  'flex items-center gap-3 w-full px-4 py-3 text-left text-gray-900 hover:bg-gray-100 transition-colors min-h-[48px]';

const iconClass = 'w-5 h-5 text-gray-600 flex-shrink-0';

export function Menu({ isOpen, onClose }: MenuProps) {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="menu-backdrop"
            className="fixed inset-0 bg-black/25 z-[55]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            key="menu-drawer"
            className="fixed top-0 right-0 bottom-0 w-64 bg-white border-l border-gray-200 shadow-sm z-[56] flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0, right: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 100) onClose();
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <span className="font-semibold text-lg text-gray-900">Menu</span>
              <button
                onClick={onClose}
                className="p-2 -mr-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="py-2 flex-1">
              <button onClick={() => handleNavigate('/matchup-defaults')} className={menuItemClass}>
                <Settings2 className={iconClass} />
                <span>Matchup Defaults</span>
              </button>
              <button
                onClick={() => handleNavigate('/pairings-explained')}
                className={menuItemClass}
              >
                <Info className={iconClass} />
                <span>UKTC Pairings Explained</span>
              </button>
              <button onClick={() => handleNavigate('/methodology')} className={menuItemClass}>
                <BookOpen className={iconClass} />
                <span>Methodology</span>
              </button>
            </div>

            {/* Version */}
            <div className="border-t border-gray-200 px-4 py-2">
              <p className="text-center text-sm text-gray-400">v{APP_VERSION}</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
