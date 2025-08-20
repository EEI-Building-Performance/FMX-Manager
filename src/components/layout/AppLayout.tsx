'use client';

import React, { useState } from 'react';
import { Header } from '@/components/navigation/Header';
import { Sidebar } from '@/components/navigation/Sidebar';
import cls from './AppLayout.module.css';

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleMenuClick = () => {
    setIsSidebarOpen(true);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className={cls.layout}>
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
      
      {/* Main content area */}
      <div className={cls.main}>
        {/* Header */}
        <Header title={title} onMenuClick={handleMenuClick} />
        
        {/* Page content */}
        <main className={cls.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
