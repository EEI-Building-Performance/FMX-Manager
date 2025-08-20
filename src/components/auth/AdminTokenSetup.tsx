'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import cls from './AdminTokenSetup.module.css';

interface AdminTokenSetupProps {
  onTokenSet: () => void;
}

export function AdminTokenSetup({ onTokenSet }: AdminTokenSetupProps) {
  const [token, setToken] = useState('');
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    // Check if token is already stored
    const storedToken = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
    if (storedToken) {
      setIsValid(true);
      onTokenSet();
    }
  }, [onTokenSet]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      localStorage.setItem('admin_token', token.trim());
      setIsValid(true);
      onTokenSet();
    }
  };

  const handleClearToken = () => {
    localStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_token');
    setToken('');
    setIsValid(false);
  };

  if (isValid) {
    return (
      <div className={cls.container}>
        <div className={cls.status}>
          <div className={cls.success}>
            <h3>✅ Admin Token Configured</h3>
            <p>You are authenticated and can access the admin features.</p>
          </div>
          <Button variant="secondary" onClick={handleClearToken}>
            Change Token
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cls.container}>
      <div className={cls.setup}>
        <h2>Admin Authentication Required</h2>
        <p>
          Please enter your admin token to access the FMX Maintenance Template Manager.
          This token is configured in your environment variables.
        </p>
        
        <form onSubmit={handleSubmit} className={cls.form}>
          <Input
            label="Admin Token"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter your admin token"
            isRequired
          />
          <Button type="submit" disabled={!token.trim()}>
            Authenticate
          </Button>
        </form>
        
        <div className={cls.info}>
          <p>
            <strong>Note:</strong> The token is stored locally in your browser and 
            will be used for API authentication. Make sure you're on a secure device.
          </p>
        </div>
      </div>
    </div>
  );
}
