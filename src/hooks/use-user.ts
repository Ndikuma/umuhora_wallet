
"use client";

import { useContext } from 'react';
import { UserContext } from '@/context/user-provider';

/**
 * Custom hook to access user data from UserContext.
 * This hook should be used by components that need user information.
 */
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
