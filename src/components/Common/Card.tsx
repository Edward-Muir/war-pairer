import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface CardProps {
  children: React.ReactNode;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}

export function Card({ children, onClick, selected = false, className = '' }: CardProps) {
  const reducedMotion = useReducedMotion();

  const baseStyles = 'bg-white rounded-lg shadow-sm p-4 border border-gray-200 transition-all duration-150';
  const selectedStyles = selected ? 'ring-2 ring-blue-500 border-blue-300' : '';
  const clickableStyles = onClick
    ? 'cursor-pointer hover:shadow-md active:shadow-sm'
    : '';

  if (onClick) {
    return (
      <motion.div
        whileTap={reducedMotion ? undefined : { scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        onClick={onClick}
        className={`${baseStyles} ${selectedStyles} ${clickableStyles} ${className}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`${baseStyles} ${selectedStyles} ${className}`}>
      {children}
    </div>
  );
}
