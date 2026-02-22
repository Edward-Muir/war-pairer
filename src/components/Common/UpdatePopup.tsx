import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface UpdatePopupProps {
  isVisible: boolean;
}

export function UpdatePopup({ isVisible }: UpdatePopupProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

          {/* Modal */}
          <motion.div
            className="relative bg-white rounded-lg shadow-xl max-w-sm w-full mx-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="update-title"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 id="update-title" className="text-lg font-semibold text-gray-900">
                Update Available
              </h2>
            </div>

            {/* Content */}
            <div className="px-4 py-6">
              <div className="flex justify-center mb-4">
                <RefreshCw className="w-10 h-10 text-blue-600" />
              </div>
              <p className="text-center text-gray-600 text-sm">
                A new version is available. Please reload to get the latest features and fixes.
              </p>
            </div>

            {/* Action */}
            <div className="px-4 py-3 border-t border-gray-200">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 active:scale-[0.98] transition-all min-h-[44px]"
              >
                Reload
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
