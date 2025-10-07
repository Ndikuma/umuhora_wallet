
"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import api from '@/lib/api';
import type { Balance } from '@/lib/types';
import { AxiosError } from 'axios';
import { usePathname, useRouter } from 'next/navigation';

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

  const fetchBalance = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const balanceRes = await api.getWalletBalance();
      setBalance(balanceRes.data);
    } catch (err: any) {
        if (err.message?.includes("Invalid token") || (err instanceof AxiosError && err.response?.status === 401)) {
            // Handle token invalidation by logging the user out
            localStorage.removeItem("authToken");
            document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            router.push("/login");
            return;
        }

        if (err instanceof AxiosError && err.response?.status === 403) {
             // This status code means the user is authenticated but has no on-chain wallet.
             // This is not an error state. We just don't have a balance to show.
             // The UI (e.g., dashboard) will handle prompting the user to create a wallet.
             setBalance(null);
        } else {
            // For other errors, we set a message.
            setError(err.message || "Impossible de charger le solde.");
            console.error("Failed to fetch balance data", err);
        }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password') || pathname.startsWith('/verify-email');

    if (token && !isAuthPage) {
        fetchBalance();
    } else {
        // If there's no token or we are on an auth page, we shouldn't attempt to fetch balance.
        setIsLoading(false);
    }
  }, [fetchBalance, pathname]);

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
