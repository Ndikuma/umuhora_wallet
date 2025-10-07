
"use client";

import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import api from '@/lib/api';
import type { User } from '@/lib/types';
import { usePathname } from 'next/navigation';

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  refetchUser: () => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.getUser();
      setUser(response.data);
    } catch (error) {
      // Not an error if on a public page, or if token is invalid
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const isPublicPage = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/'].includes(pathname);

    if (token && !isPublicPage) {
        fetchUser();
    } else {
        setIsLoading(false);
    }
  }, [fetchUser, pathname]);

  return (
    <UserContext.Provider value={{ user, isLoading, refetchUser: fetchUser }}>
      {children}
    </UserContext.Provider>
  );
}
