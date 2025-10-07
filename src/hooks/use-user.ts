
"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import type { User } from "@/lib/types";
import { usePathname, useRouter } from "next/navigation";

export function useUser() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.getUser();
      setUser(response.data);
    } catch (error) {
      // Not an error if on a public page
      if (!pathname.startsWith('/(auth)') && pathname !== '/') {
        console.error("Failed to fetch user", error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [pathname]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (token) {
        fetchUser();
    } else {
        setIsLoading(false);
    }
  }, [fetchUser]);

  return { user, isLoading };
}
