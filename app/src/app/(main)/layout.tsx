
import { HeaderTitle } from "@/components/header-title";
import { MainNav } from "@/components/main-nav";
import { MobileNav } from "@/components/mobile-nav";
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { UserNav } from "@/components/user-nav";
import { WalletProvider } from "@/context/wallet-context";
import { Suspense } from "react";
import { UserProvider } from "@/context/user-provider";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <WalletProvider>
        <SidebarProvider>
          <Sidebar collapsible="icon" variant="inset">
            <Suspense>
              <MainNav />
            </Suspense>
          </Sidebar>
          <SidebarInset>
            <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
              <SidebarTrigger className="md:hidden" />
              <div className="flex-1">
                <Suspense fallback={null}>
                  <HeaderTitle />
                </Suspense>
              </div>
              <UserNav />
            </header>
            <main className="flex-1 p-4 md:p-6 lg:p-8 mb-20 md:mb-0">{children}</main>
            <MobileNav />
          </SidebarInset>
        </SidebarProvider>
      </WalletProvider>
    </UserProvider>
  );
}
