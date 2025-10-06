
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BitcoinIcon } from "@/components/icons";
import { ArrowRight, Loader2 } from "lucide-react";

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-background/80 backdrop-blur-sm">
        <div className="container flex h-20 items-center justify-between py-6">
          <Link href="/" className="flex items-center gap-3">
            <BitcoinIcon className="size-8 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">
              Umuhora Tech Wallet
            </h2>
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" asChild>
              <Link href="/login">Se connecter</Link>
            </Button>
            <Button asChild>
              <Link href="/register">
                Commencer <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </nav>
           <nav className="flex items-center gap-2 md:hidden">
             <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Se connecter</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">
                  S'inscrire
                </Link>
              </Button>           
           </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full flex h-full min-h-[calc(100vh-80px)] flex-grow flex-col items-center justify-center space-y-8 py-24 text-center md:py-32">
            <div className="absolute inset-0 -z-10 h-full w-full bg-background animated-gradient"></div>
            <div className="max-w-4xl px-4">
              <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                Vos clés, vos Bitcoins.
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-lg leading-relaxed text-muted-foreground sm:text-xl">
                Prenez le contrôle total de vos Bitcoins avec un portefeuille simple, sécurisé et open-source. Envoyez, recevez et gérez vos actifs en toute confiance.
              </p>
              <div className="mt-8 flex w-full flex-col justify-center gap-4 sm:flex-row md:justify-center">
                  <Button asChild size="lg" className="w-full sm:w-auto">
                    <Link href="/register">Créer un Nouveau Portefeuille</Link>
                  </Button>
                  <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
                    <Link href="/restore-wallet">Restaurer un Portefeuille</Link>
                  </Button>
                </div>
            </div>
        </section>
      </main>
    </div>
  );
}


export default function RootPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getCookie('authToken');
    if (token) {
      setIsAuthenticated(true);
      router.replace('/dashboard');
    } else {
      setIsAuthenticated(false);
    }
  }, [router]);

  if (isAuthenticated === null || isAuthenticated) {
    return (
       <div className="flex h-dvh w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <LandingPage />;
}
