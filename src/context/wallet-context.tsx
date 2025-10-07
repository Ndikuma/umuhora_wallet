
"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import api from '@/lib/api';
import type { Balance } from '@/lib/types';
import { AxiosError } from 'axios';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';

interface WalletContextType {
  balance: Balance | null;
  isLoading: boolean;
  error: string | null;
  refreshBalance: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading: isUserLoading } = useUser();

  const fetchBalance = useCallback(async () => {
    // This function should only be called if we know a wallet exists.
    setIsLoading(true);
    setError(null);
    try {
      const balanceRes = await api.getWalletBalance();
      setBalance(balanceRes.data);
    } catch (err: any) {
        if (err.message?.includes("Invalid token") || (err instanceof AxiosError && err.response?.status === 401)) {
            localStorage.removeItem("authToken");
            document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            router.push("/login");
            return;
        }
        // If we're here, it's an unexpected error since we already checked for wallet existence.
        setError(err.message || "Impossible de charger le solde.");
        console.error("Failed to fetch balance data", err);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password') || pathname.startsWith('/verify-email');
    
    if (isUserLoading || isAuthPage) {
        // Wait until we have user info, or if on an auth page, do nothing.
        return;
    }

    if (user?.wallet_created) {
        fetchBalance();
    } else {
        // User is logged in but has no on-chain wallet, or user is not logged in.
        // No need to fetch balance.
        setBalance(null);
        setIsLoading(false);
    }
  }, [user, isUserLoading, pathname, fetchBalance]);

  return (
    <WalletContext.Provider value={{ balance, isLoading, error, refreshBalance: fetchBalance }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
