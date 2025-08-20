import React from 'react';
import { cx } from '@/utils/cx';
import cls from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  isLoading = false,
  className, 
  children,
  disabled,
  ...rest 
}: ButtonProps) {
  return (
    <button
      className={cx(
        cls.base,
        cls[`variant-${variant}`],
        cls[`size-${size}`],
        isLoading && cls.loading,
        (disabled || isLoading) && cls.disabled,
        className
      )}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading && <span className={cls.spinner} />}
      <span className={cx(isLoading && cls.content)}>{children}</span>
    </button>
  );
}
