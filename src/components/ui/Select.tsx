import React from 'react';
import { cx } from '@/utils/cx';
import cls from './Select.module.css';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  isRequired?: boolean;
  options?: SelectOption[];
  placeholder?: string;
  onChange?: (value: string) => void;
}

export function Select({ 
  label, 
  error, 
  isRequired = false,
  options = [],
  placeholder,
  onChange,
  className, 
  id,
  ...rest 
}: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={cls.container}>
      {label && (
        <label htmlFor={selectId} className={cls.label}>
          {label}
          {isRequired && <span className={cls.required}>*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={cx(
          cls.select,
          error && cls.error,
          className
        )}
        onChange={(e) => onChange?.(e.target.value)}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className={cls.errorText}>{error}</span>}
    </div>
  );
}
