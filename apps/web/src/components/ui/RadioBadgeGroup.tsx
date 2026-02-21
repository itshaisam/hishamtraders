import React from 'react';

export interface RadioBadgeOption {
  value: string;
  label: string;
  color?: 'green' | 'red' | 'blue' | 'gray' | 'yellow' | 'purple';
}

interface RadioBadgeGroupProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioBadgeOption[];
  disabled?: boolean;
  className?: string;
}

const colorClasses = {
  green: {
    selected: 'border-green-500 bg-green-50 text-green-700',
    unselected: 'border-gray-300 bg-white text-gray-700 hover:border-green-300',
    dot: 'bg-green-500',
  },
  red: {
    selected: 'border-red-500 bg-red-50 text-red-700',
    unselected: 'border-gray-300 bg-white text-gray-700 hover:border-red-300',
    dot: 'bg-red-500',
  },
  blue: {
    selected: 'border-blue-500 bg-blue-50 text-blue-700',
    unselected: 'border-gray-300 bg-white text-gray-700 hover:border-blue-300',
    dot: 'bg-blue-500',
  },
  yellow: {
    selected: 'border-yellow-500 bg-yellow-50 text-yellow-700',
    unselected: 'border-gray-300 bg-white text-gray-700 hover:border-yellow-300',
    dot: 'bg-yellow-500',
  },
  gray: {
    selected: 'border-gray-500 bg-gray-50 text-gray-700',
    unselected: 'border-gray-300 bg-white text-gray-700 hover:border-gray-400',
    dot: 'bg-gray-500',
  },
  purple: {
    selected: 'border-purple-500 bg-purple-50 text-purple-700',
    unselected: 'border-gray-300 bg-white text-gray-700 hover:border-purple-300',
    dot: 'bg-purple-500',
  },
};

const colorMap: Record<string, 'green' | 'red' | 'blue' | 'yellow' | 'gray' | 'purple'> = {
  ACTIVE: 'green',
  INACTIVE: 'red',
  PENDING: 'blue',
  IN_TRANSIT: 'yellow',
  PARTIALLY_RECEIVED: 'purple',
  RECEIVED: 'green',
  CANCELLED: 'red',
};

export const RadioBadgeGroup: React.FC<RadioBadgeGroupProps> = ({
  name,
  value,
  onChange,
  options,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`flex gap-2 flex-wrap ${className}`}>
      {options.map((option) => {
        const isSelected = value === option.value;
        const colorKey = option.color || (colorMap[option.value] || 'gray');
        const colors = colorClasses[colorKey];

        return (
          <label
            key={option.value}
            className={`
              flex-1 min-w-max
              flex items-center justify-center px-4 py-2.5 rounded-lg border-2 cursor-pointer
              transition-all duration-200
              ${isSelected ? colors.selected : colors.unselected}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={isSelected}
              onChange={() => onChange(option.value)}
              disabled={disabled}
              className="sr-only"
            />
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  isSelected ? colors.dot : 'bg-gray-400'
                }`}
              />
              <span className="font-medium text-sm">{option.label}</span>
            </div>
          </label>
        );
      })}
    </div>
  );
};

export default RadioBadgeGroup;
