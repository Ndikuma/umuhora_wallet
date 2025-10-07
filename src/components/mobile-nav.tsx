
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Receipt,
  Download,
  User,
  Zap,
  Bitcoin,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  // Detect if we're inside the Lightning section
  const isLightning = pathname.startsWith("/lightning");

  // Define FAB (center floating action button)
  const fabAction = {
    href: isLightning ? "/lightning/send" : "/send",
    icon: isLightning ? Zap : Bitcoin,
    label: "Envoyer",
  };

  // Define receive action (regular menu item)
  const receiveAction = {
    href: isLightning ? "/lightning/invoice" : "/receive",
    icon: isLightning ? FileText : Download,
    label: "Recevoir",
  };

  // Unified structure: all use href (no `path`)
  const menuItems = [
    { href: "/dashboard", icon: Bitcoin, label: "On-chain" },
    receiveAction,
    { href: "/orders", icon: Receipt, label: "Commandes" },
    { href: "/lightning", icon: Zap, label: "Lightning" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 h-20 border-t bg-background/95 backdrop-blur-sm md:hidden">
      <div className="relative grid h-full grid-cols-5 items-center">
        {/* Left two icons */}
        {menuItems.slice(0, 2).map((item) => {
          const isActive =
            pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Floating Action Button in the center */}
        <div className="relative flex justify-center items-center col-start-3">
          <Link
            href={fabAction.href}
            className="absolute bottom-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
          >
            <fabAction.icon className="size-7" />
            <span className="sr-only">{fabAction.label}</span>
          </Link>
        </div>

        {/* Right two icons */}
        {menuItems.slice(2).map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
