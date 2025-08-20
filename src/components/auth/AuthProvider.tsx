'use client';

import React, { useState, useEffect } from 'react';
import { AdminTokenSetup } from './AdminTokenSetup';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if token exists
    const token = localStorage.getItem('admin_token') || 
                  sessionStorage.getItem('admin_token') ||
                  process.env.NEXT_PUBLIC_ADMIN_TOKEN;
    
    setIsAuthenticated(!!token);
    setIsLoading(false);
  }, []);

  const handleTokenSet = () => {
    setIsAuthenticated(true);
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        fontSize: '18px' 
      }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminTokenSetup onTokenSet={handleTokenSet} />;
  }

  return <>{children}</>;
}
