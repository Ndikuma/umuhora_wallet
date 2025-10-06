
"use client";

import Link from "next/link"
import {
  LogOut,
  Settings,
  User as UserIcon,
  ChevronDown
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import api from "@/lib/api"
import type { User } from "@/lib/types"
import { Skeleton } from "./ui/skeleton";

export function UserNav() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
      setLoading(true);
      try {
        const response = await api.getUser();
        setUser(response.data);
      } catch (error) {
        // This is expected if the user is not logged in, so we don't need to log an error.
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleLogout = async () => {
    try {
        await api.logout();
    } catch(error) {
        console.error("Logout failed", error);
    } finally {
        localStorage.removeItem("authToken");
        // Clear the cookie
        document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        router.push("/");
        router.refresh();
    }
  }

  const displayName = user?.full_name || user?.username;

  if (loading) {
    return <Skeleton className="h-9 w-28" />;
  }

  if (!user) {
    return (
      <Button asChild>
        <Link href="/login">Se connecter</Link>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 h-9">
          <span>
            {displayName}
            <ChevronDown className="size-4 text-muted-foreground inline-block ml-1" />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <UserIcon />
              <span>Profil</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
             <Link href="/settings">
                <Settings />
                <span>Paramètres</span>
              </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut />
          <span>Déconnexion</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
