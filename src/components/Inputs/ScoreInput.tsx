import { useState } from 'react';
import { Plus, Minus, Delete } from 'lucide-react';
import { Modal } from '@/components/Common/Modal';
import { scoreToBackgroundColor, scoreToTextColor } from '@/utils/scoring';

export interface ScoreInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  showColorCoding?: boolean;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  enableModal?: boolean;
  className?: string;
  'aria-label'?: string;
}

const sizeStyles = {
  sm: {
    button: 'w-8 h-8 text-lg',
    display: 'w-10 h-8 text-base',
    icon: 'w-4 h-4',
  },
  md: {
    button: 'w-11 h-11 min-h-[44px] text-xl',
    display: 'w-14 h-11 min-h-[44px] text-lg',
    icon: 'w-5 h-5',
  },
  lg: {
    button: 'w-14 h-14 text-2xl',
    display: 'w-20 h-14 text-2xl font-bold',
    icon: 'w-6 h-6',
  },
};

export function ScoreInput({
  value,
  onChange,
  min = 0,
  max = 20,
  showColorCoding = false,
  size = 'md',
  disabled = false,
  enableModal = false,
  className = '',
  'aria-label': ariaLabel,
}: ScoreInputProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const styles = sizeStyles[size];

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleDisplayClick = () => {
    if (enableModal && !disabled) {
      setIsModalOpen(true);
    }
  };

  const bgColor = showColorCoding ? scoreToBackgroundColor(value) : 'bg-gray-100';
  const textColor = showColorCoding ? scoreToTextColor(value) : 'text-gray-900';

  return (
    <>
      <div
        className={`inline-flex items-center gap-1 ${className}`}
        role="group"
        aria-label={ariaLabel}
      >
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          aria-label="Decrease score"
          className={`
            ${styles.button}
            flex items-center justify-center
            bg-gray-200 rounded-lg
            text-gray-700
            hover:bg-gray-300 active:bg-gray-400
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          `}
        >
          <Minus className={styles.icon} />
        </button>

        <button
          type="button"
          onClick={handleDisplayClick}
          disabled={disabled || !enableModal}
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          className={`
            ${styles.display}
            ${bgColor} ${textColor}
            flex items-center justify-center
            rounded-lg font-medium
            ${enableModal && !disabled ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : 'cursor-default'}
            transition-all
          `}
        >
          {value}
        </button>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          aria-label="Increase score"
          className={`
            ${styles.button}
            flex items-center justify-center
            bg-gray-200 rounded-lg
            text-gray-700
            hover:bg-gray-300 active:bg-gray-400
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          `}
        >
          <Plus className={styles.icon} />
        </button>
      </div>

      {enableModal && (
        <NumberPadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
        />
      )}
    </>
  );
}

interface NumberPadModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}

function NumberPadModal({
  isOpen,
  onClose,
  value,
  onChange,
  min,
  max,
}: NumberPadModalProps) {
  const [tempValue, setTempValue] = useState(value.toString());

  const handleNumberClick = (num: number) => {
    const newValue = tempValue === '0' ? num.toString() : tempValue + num.toString();
    const parsed = parseInt(newValue, 10);
    if (parsed <= max) {
      setTempValue(newValue);
    }
  };

  const handleBackspace = () => {
    if (tempValue.length > 1) {
      setTempValue(tempValue.slice(0, -1));
    } else {
      setTempValue('0');
    }
  };

  const handleClear = () => {
    setTempValue('0');
  };

  const handleQuickValue = (quickValue: number) => {
    setTempValue(quickValue.toString());
  };

  const handleConfirm = () => {
    const parsed = parseInt(tempValue, 10);
    const clamped = Math.max(min, Math.min(max, parsed));
    onChange(clamped);
    onClose();
  };

  // Reset temp value when modal opens
  const handleOpen = () => {
    setTempValue(value.toString());
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enter Score"
    >
      <div className="space-y-4" onAnimationStart={handleOpen}>
        {/* Current value display */}
        <div
          className={`
            w-full py-4 text-center text-4xl font-bold rounded-lg
            ${scoreToBackgroundColor(parseInt(tempValue, 10) || 0)}
            ${scoreToTextColor(parseInt(tempValue, 10) || 0)}
          `}
        >
          {tempValue}
        </div>

        {/* Quick select buttons */}
        <div className="flex gap-2 justify-center">
          {[5, 10, 15].map((quickValue) => (
            <button
              key={quickValue}
              type="button"
              onClick={() => handleQuickValue(quickValue)}
              className="px-4 py-2 min-h-[44px] bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 active:bg-blue-300 transition-colors"
            >
              {quickValue}
            </button>
          ))}
        </div>

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleNumberClick(num)}
              className="min-h-[56px] text-xl font-medium bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="min-h-[56px] text-sm font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleNumberClick(0)}
            className="min-h-[56px] text-xl font-medium bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            aria-label="Backspace"
            className="min-h-[56px] flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors"
          >
            <Delete className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Confirm button */}
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full min-h-[48px] bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors"
        >
          Confirm
        </button>
      </div>
    </Modal>
  );
}
