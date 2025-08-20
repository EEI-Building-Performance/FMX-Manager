import React from 'react';
import { cx } from '@/utils/cx';
import cls from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  isRequired?: boolean;
}

export function Input({ 
  label, 
  error, 
  isRequired = false,
  className, 
  id,
  ...rest 
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={cls.container}>
      {label && (
        <label htmlFor={inputId} className={cls.label}>
          {label}
          {isRequired && <span className={cls.required}>*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={cx(
          cls.input,
          error && cls.error,
          className
        )}
        {...rest}
      />
      {error && <span className={cls.errorText}>{error}</span>}
    </div>
  );
}
