'use client';

import React from 'react';
import { MenuIcon } from '@/components/icons/Icon';
import cls from './Header.module.css';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  return (
    <header className={cls.header}>
      <div className={cls.content}>
        {/* Mobile menu button */}
        <button
          className={cls.menuButton}
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <MenuIcon size={20} />
        </button>

        {/* Page title */}
        <div className={cls.titleSection}>
          <h1 className={cls.title}>{title}</h1>
        </div>

        {/* Right section for future actions */}
        <div className={cls.actions}>
          {/* Space for future header actions like user menu, notifications, etc. */}
        </div>
      </div>
    </header>
  );
}
