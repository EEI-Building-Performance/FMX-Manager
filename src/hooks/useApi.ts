'use client';

import { useState, useCallback } from 'react';

interface ApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

interface ApiHookReturn<T> extends ApiState<T> {
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
}

export function useApi<T = unknown>(
  apiFunction: (...args: any[]) => Promise<T>
): ApiHookReturn<T> {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(async (...args: any[]): Promise<T> => {
    setState({ data: null, isLoading: true, error: null });
    
    try {
      const result = await apiFunction(...args);
      setState({ data: result, isLoading: false, error: null });
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState({ data: null, isLoading: false, error: errorMessage });
      throw error;
    }
  }, [apiFunction]);

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Helper function to get admin token from environment or prompt user
function getAdminToken(): string {
  // In a real app, this might come from a login form or secure storage
  // For now, we'll assume it's passed via a prompt or stored securely
  const token = process.env.NEXT_PUBLIC_ADMIN_TOKEN || 
                sessionStorage.getItem('admin_token') ||
                localStorage.getItem('admin_token');
  
  if (!token) {
    throw new Error('Admin token not found. Please set NEXT_PUBLIC_ADMIN_TOKEN or login.');
  }
  
  return token;
}

// API client with authentication
export const apiClient = {
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = getAdminToken();
    
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  },

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  },

  post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  },
};
