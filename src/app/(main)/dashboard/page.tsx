
"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDownLeft,
  AlertCircle,
  Eye,
  EyeOff,
  Send,
  Download,
  ShoppingCart,
  Receipt,
  Wallet,
  Loader2,
  PlusCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { cn, shortenText } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import type { Transaction, User } from "@/lib/types";
import { BalanceDisplay } from "@/components/balance-display";
import { useWallet } from "@/context/wallet-context";

const ActionButton = ({ icon: Icon, label, href, disabled = false }: { icon: React.ElementType, label: string, href: string, disabled?: boolean }) => {
  const content = (
    <div className={cn(
      "flex flex-col items-center justify-center space-y-3 rounded-lg border p-6 text-center transition-colors",
      disabled ? "cursor-not-allowed opacity-50 bg-secondary" : "hover:bg-accent hover:text-accent-foreground"
    )}>
      <Icon className="size-8 text-primary" />
      <h3 className="font-semibold">{label}</h3>
    </div>
  );

  if (disabled) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
};

const ActionCard = ({ disabled }: { disabled: boolean }) => (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <ActionButton icon={Send} label="Envoyer" href="/send" disabled={disabled} />
        <ActionButton icon={Download} label="Recevoir" href="/receive" disabled={disabled} />
        <ActionButton icon={ShoppingCart} label="Acheter" href="/buy" disabled={disabled} />
        <ActionButton icon={Receipt} label="Vendre" href="/sell" disabled={disabled} />
    </div>
)


export default function DashboardPage() {
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const { error: walletError } = useWallet();
  const [user, setUser] = useState<User | null>(null);

  const fetchInitialData = useCallback(async () => {
    setLoadingTransactions(true);
    setTransactionsError(null);
    try {
        const [userRes, transactionsRes] = await Promise.all([
            api.getUser(),
            api.getRecentTransactions().catch(() => ({ data: [] })) // Don't fail if transactions fail
        ]);
        setUser(userRes.data);
        setRecentTransactions(transactionsRes.data || []);
    } catch (err: any) {
      setTransactionsError(err.message || "Impossible de charger les données.");
    } finally {
      setLoadingTransactions(false);
    }
  }, []);

  useEffect(() => {
    if (!walletError) {
      fetchInitialData();
    } else {
      setLoadingTransactions(false);
    }
  }, [walletError, fetchInitialData]);

  
    if (walletError) {
        const handleRefresh = () => {
             window.location.reload();
        };

        return (
            <div className="flex items-center justify-center h-full">
                <Alert variant="destructive" className="max-w-lg">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Portefeuille non prêt</AlertTitle>
                    <AlertDescription>
                        {walletError}
                        <div className="mt-4">
                            <Button onClick={handleRefresh}>Actualiser</Button>
                        </div>
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    if (!user?.wallet_created && !loadingTransactions) {
      return (
        <Card className="flex flex-col items-center justify-center text-center p-8 gap-4">
          <Wallet className="size-16 text-primary" />
          <CardTitle>Bienvenue sur votre portefeuille On-Chain</CardTitle>
          <CardDescription className="max-w-md">
            Vous n'avez pas encore de portefeuille on-chain. Créez-en un nouveau ou restaurez un portefeuille existant pour commencer à gérer vos Bitcoins.
          </CardDescription>
          <div className="flex gap-4 pt-4">
            <Button asChild size="lg">
              <Link href="/create-wallet">
                <PlusCircle className="mr-2"/>
                Créer un Portefeuille
              </Link>
            </Button>
             <Button asChild variant="secondary" size="lg">
              <Link href="/restore-wallet">
                Restaurer
              </Link>
            </Button>
          </div>
        </Card>
      )
    }


  return (
    <div className="flex flex-col gap-4 md:gap-8">
       <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg">Solde Total</CardTitle>
            <CardDescription>Aperçu de votre portefeuille on-chain</CardDescription>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsBalanceVisible(!isBalanceVisible)}>
              {isBalanceVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              <span className="sr-only">Afficher/Masquer le solde</span>
          </Button>
        </CardHeader>
        <CardContent className="p-6">
            <BalanceDisplay isVisible={isBalanceVisible} />
        </CardContent>
      </Card>
      
      <ActionCard disabled={!!walletError || !user?.wallet_created} />


       <div className="grid grid-cols-1 gap-4 md:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Transactions Récentes</CardTitle>
                    <CardDescription>Vos dernières activités de portefeuille</CardDescription>
                </div>
                <Button variant="link" size="sm" asChild className="text-primary">
                  <Link href="/transactions">
                    Voir tout
                  </Link>
                </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {loadingTransactions && Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-5 w-2/3" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                    <Skeleton className="h-6 w-1/4" />
                  </div>
                ))}
                {transactionsError && (
                     <div className="h-24 text-center flex flex-col items-center justify-center text-destructive">
                        <AlertCircle className="size-8 mb-2" />
                        <p className="font-semibold">Erreur de chargement des transactions</p>
                        <p className="text-sm">{transactionsError}</p>
                        <Button onClick={fetchInitialData} variant="secondary" className="mt-4">
                            {loadingTransactions && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Réessayer
                        </Button>
                    </div>
                )}
                {!loadingTransactions && !transactionsError && recentTransactions.length > 0 && (
                  recentTransactions.map((tx) => {
                    const isSent = tx.transaction_type === "internal" || tx.transaction_type === "send";
                    const relevantAddress = isSent ? tx.to_address : tx.from_address;

                    return (
                      <div key={tx.id} className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                          {isSent ? (
                            <ArrowUpRight className="size-5 text-destructive" />
                          ) : (
                            <ArrowDownLeft className="size-5 text-green-600" />
                          )}
                        </div>
                        <div className="flex-1 grid gap-1">
                           <p className="font-medium truncate">
                            {isSent ? "Envoyé à" : "Reçu de"}{' '}
                            <span className="font-mono text-muted-foreground">{shortenText(relevantAddress, 6, 6)}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(tx.created_at).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <div className="text-right">
                           <p className={cn("font-semibold font-mono", isSent ? "text-destructive" : "text-green-600")}>
                            {isSent ? '-' : '+'}{tx.amount_formatted}
                          </p>
                           <p className="text-xs text-muted-foreground font-mono">
                             Frais: {tx.fee_formatted.replace("BTC", "").trim()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                {!loadingTransactions && !transactionsError && recentTransactions.length === 0 && (
                  <div className="h-24 text-center flex flex-col items-center justify-center text-muted-foreground">
                    <Wallet className="size-8 mb-4" />
                    <p className="font-semibold">Aucune transaction disponible</p>
                    <p className="text-sm">Vos transactions récentes apparaîtront ici.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
       </div>
    </div>
  );
}
