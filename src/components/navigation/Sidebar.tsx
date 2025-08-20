'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cx } from '@/utils/cx';
import {
  BuildingIcon,
  ClipboardIcon,
  TemplateIcon,
  BundleIcon,
  AssignmentIcon,
  ExportIcon,
  CloseIcon
} from '@/components/icons/Icon';
import cls from './Sidebar.module.css';

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  description: string;
}

const navigationItems: NavigationItem[] = [
  {
    href: '/buildings',
    label: 'Buildings & Equipment',
    icon: BuildingIcon,
    description: 'Manage buildings and equipment'
  },
  {
    href: '/instructions',
    label: 'Instructions',
    icon: ClipboardIcon,
    description: 'Create maintenance instruction sets'
  },
  {
    href: '/task-templates',
    label: 'Task Templates',
    icon: TemplateIcon,
    description: 'Define maintenance task templates'
  },
  {
    href: '/pm-templates',
    label: 'PM Templates',
    icon: BundleIcon,
    description: 'Bundle tasks into PM programs'
  },
  {
    href: '/assignments',
    label: 'Assignments',
    icon: AssignmentIcon,
    description: 'Assign templates to equipment'
  },
  {
    href: '/export',
    label: 'Export',
    icon: ExportIcon,
    description: 'Generate FMX import files'
  }
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className={cls.overlay} 
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <aside className={cx(cls.sidebar, isOpen && cls.open)}>
        {/* Header */}
        <div className={cls.header}>
          <div className={cls.logo}>
            <h1 className={cls.title}>FMX Maintenance</h1>
            <p className={cls.subtitle}>Template Manager</p>
          </div>
          
          {/* Mobile close button */}
          <button
            className={cls.closeButton}
            onClick={onClose}
            aria-label="Close navigation"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className={cls.nav}>
          <ul className={cls.navList}>
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cx(cls.navLink, isActive && cls.active)}
                    onClick={onClose} // Close mobile menu on navigation
                  >
                    <div className={cls.navIcon}>
                      <IconComponent size={20} />
                    </div>
                    <div className={cls.navContent}>
                      <span className={cls.navLabel}>{item.label}</span>
                      <span className={cls.navDescription}>{item.description}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
