'use client';

import React, { useEffect } from 'react';
import { cx } from '@/utils/cx';
import { CloseIcon } from '@/components/icons/Icon';
import cls from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md' 
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={cls.overlay} onClick={onClose}>
      <div 
        className={cx(cls.modal, cls[`size-${size}`])}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cls.header}>
          <h2 className={cls.title}>{title}</h2>
          <button
            className={cls.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            <CloseIcon size={20} />
          </button>
        </div>
        <div className={cls.content}>
          {children}
        </div>
      </div>
    </div>
  );
}
