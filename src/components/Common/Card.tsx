interface CardProps {
  children: React.ReactNode;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}

export function Card({ children, onClick, selected = false, className = '' }: CardProps) {
  const baseStyles = 'bg-white rounded-lg shadow-sm p-4 border border-gray-200';
  const selectedStyles = selected ? 'ring-2 ring-blue-500' : '';
  const clickableStyles = onClick
    ? 'cursor-pointer hover:shadow-md active:shadow-sm transition-shadow'
    : '';

  return (
    <div
      onClick={onClick}
      className={`${baseStyles} ${selectedStyles} ${clickableStyles} ${className}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
