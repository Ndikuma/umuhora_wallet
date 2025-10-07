"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UmuhoraIcon } from "@/components/icons";
import { ArrowRight, Loader2, Zap, Bitcoin } from "lucide-react";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

// Hero Section
function HeroSection() {
  return (
    <section className="relative flex flex-col items-center justify-center text-center py-24 md:py-32">
      <div className="absolute inset-0 -z-10 h-full w-full bg-gradient-to-br from-primary/30 via-purple-900/20 to-primary/10 animate-gradient-slow"></div>
      <div className="max-w-4xl px-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight">
          Vos clés, vos Bitcoins.
        </h1>
        <p className="mt-6 text-lg sm:text-xl max-w-2xl mx-auto text-gray-300 leading-relaxed">
          Prenez le contrôle total de vos Bitcoins avec un portefeuille simple, sécurisé et open-source.
          Envoyez, recevez et gérez vos actifs en toute confiance.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" className="w-full sm:w-auto hover:scale-105 transition-transform">
            <Link href="/register">Créer un Nouveau Portefeuille</Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto hover:scale-105 transition-transform">
            <Link href="/restore-wallet">Restaurer un Portefeuille</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// Features Section
function FeaturesSection() {
  return (
    <section className="bg-gray-900/50 py-20 px-4 md:px-8 text-center">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-12">Pourquoi choisir Umuhora Wallet?</h2>
      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {/* Lightning Wallet */}
        <div className="flex flex-col items-center p-6 bg-gray-800/60 rounded-xl shadow-lg hover:shadow-2xl transition-shadow">
          <Zap className="h-12 w-12 text-yellow-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Lightning Wallet</h3>
          <p className="text-gray-300">
            Effectuez des paiements ultra-rapides et à faible coût avec notre portefeuille Lightning intégré.
            Idéal pour les transactions quotidiennes et micro-paiements.
          </p>
        </div>
        {/* On-chain Wallet */}
        <div className="flex flex-col items-center p-6 bg-gray-800/60 rounded-xl shadow-lg hover:shadow-2xl transition-shadow">
          <Bitcoin className="h-12 w-12 text-orange-500 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Portefeuille Bitcoin On-Chain</h3>
          <p className="text-gray-300">
            Stockez vos Bitcoins de manière sécurisée avec un contrôle total sur vos clés privées.
            Envoyez et recevez directement depuis la blockchain.
          </p>
        </div>
        {/* Security & Open-Source */}
        <div className="flex flex-col items-center p-6 bg-gray-800/60 rounded-xl shadow-lg hover:shadow-2xl transition-shadow">
          <svg className="h-12 w-12 text-blue-400 mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0-1.104-.895-2-2-2s-2 .896-2 2 .895 2 2 2 2-.896 2-2zM12 3v4M6.343 6.343l2.828 2.828M3 12h4M6.343 17.657l2.828-2.828M12 21v-4M17.657 17.657l-2.828-2.828M21 12h-4M17.657 6.343l-2.828 2.828" />
          </svg>
          <h3 className="text-xl font-semibold text-white mb-2">Sécurité & Open-Source</h3>
          <p className="text-gray-300">
            Umuhora Wallet est open-source, audité et conçu pour garantir la sécurité maximale de vos fonds.
          </p>
        </div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 py-8 text-center text-sm">
      <p>© 2025 Umuhora Wallet. Tous droits réservés.</p>
      <p>Open-source et sécurisé pour tous vos besoins Bitcoin.</p>
    </footer>
  );
}

function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/70 backdrop-blur-md">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-8">
          <Link href="/" className="flex items-center gap-3">
            <UmuhoraIcon className="h-10 w-10 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">Umuhora Wallet</h2>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Se connecter</Link>
            </Button>
            <Button asChild>
              <Link href="/register">
                Commencer <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </nav>

          {/* Mobile Nav */}
          <nav className="flex md:hidden items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Se connecter</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">S'inscrire</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
      </main>

      <Footer />
    </div>
  );
}

export default function RootPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getCookie("authToken");
    if (token) {
      setIsAuthenticated(true);
      router.replace("/dashboard");
    } else {
      setIsAuthenticated(false);
    }
  }, [router]);

  if (isAuthenticated === null || isAuthenticated) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-gradient-to-b from-gray-900 via-gray-950 to-black">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <LandingPage />;
}
