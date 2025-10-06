
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowUpRight, Loader2, AlertCircle, ArrowDownLeft, Send, FileText, Zap, CircleCheck, Clock, CircleX } from "lucide-react";
import api from "@/lib/api";
import type { LightningBalance, LightningTransaction } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { getFiat } from "@/lib/utils";
import { Badge, badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";

const formatSats = (sats: number) => {
  return new Intl.NumberFormat("fr-FR").format(sats);
};

const ActionButton = ({ href, icon: Icon, title, description }: { href: string; icon: React.ElementType; title: string; description: string }) => (
    <Link href={href} className="block p-4 rounded-lg hover:bg-secondary transition-colors group">
        <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary group-hover:bg-primary/10 transition-colors">
                <Icon className="size-6 text-primary" />
            </div>
            <div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </div>
    </Link>
);

const getStatusVariant = (status: string): VariantProps<typeof badgeVariants>["variant"] => {
  switch (status.toLowerCase()) {
    case 'paid':
    case 'succeeded':
    case 'confirmed':
       return 'success';
    case 'pending': return 'warning';
    case 'failed':
    case 'expired':
       return 'destructive';
    default: return 'secondary';
  }
}

const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'succeeded':
      case 'confirmed':
        return <CircleCheck className="size-3.5" />;
      case 'pending': return <Clock className="size-3.5" />;
       case 'failed':
       case 'expired':
        return <CircleX className="size-3.5" />;
      default: return <AlertCircle className="size-3.5" />;
    }
}


export default function LightningPage() {
    const [balance, setBalance] = useState<LightningBalance | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [transactions, setTransactions] = useState<LightningTransaction[]>([]);
    const [loadingTransactions, setLoadingTransactions] = useState(true);
    const [transactionsError, setTransactionsError] = useState<string | null>(null);

    const fetchBalance = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.getLightningBalance();
            setBalance(response.data);
        } catch (err: any) {
            setError(err.message || "Impossible de charger le solde Lightning.");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchTransactions = useCallback(async () => {
        setLoadingTransactions(true);
        setTransactionsError(null);
        try {
            const response = await api.getLightningTransactions();
            const results = response.data.results || response.data || [];
            setTransactions(results.slice(0, 5)); // Limit to recent 5
        } catch (err: any) {
            setTransactionsError(err.message || "Impossible de charger l'historique des transactions.");
        } finally {
            setLoadingTransactions(false);
        }
    }, []);

    useEffect(() => {
        fetchBalance();
        fetchTransactions();
    }, [fetchBalance, fetchTransactions]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
        <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
                <Zap className="size-7 text-primary" />
                Portefeuille Lightning
            </h1>
            <p className="text-muted-foreground">
                Effectuez des paiements instantanés avec de faibles frais.
            </p>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Solde Lightning</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-48" />
                        <Skeleton className="h-5 w-36 mt-2" />
                    </div>
                ) : error ? (
                    <div className="text-destructive p-4 border border-destructive/50 rounded-lg text-sm">
                        <AlertCircle className="inline-block h-4 w-4 mr-2" />
                        {error}
                        <Button onClick={fetchBalance} variant="link" size="sm" className="ml-2">
                            Réessayer
                        </Button>
                    </div>
                ) : balance ? (
                    <div className="space-y-1">
                        <h2 className="text-4xl font-bold tracking-tighter">
                            {formatSats(balance.balance)} <span className="text-2xl text-muted-foreground">sats</span>
                        </h2>
                        <div className="flex items-center gap-4 text-muted-foreground">
                            {balance.balance_usd !== undefined && <p>{getFiat(balance.balance_usd, 'USD')}</p>}
                            {balance.balance_usd !== undefined && balance.balance_bif !== undefined && <span>•</span>}
                            {balance.balance_bif !== undefined && <p>{getFiat(balance.balance_bif, 'BIF')}</p>}
                        </div>
                    </div>
                ) : (
                    <p className="text-muted-foreground">Aucun solde disponible.</p>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                 <CardTitle className="text-lg">Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="grid grid-cols-1 divide-y md:grid-cols-2 md:divide-x md:divide-y-0">
                    <ActionButton href="/lightning/send" icon={Send} title="Envoyer / Payer" description="Payer une facture ou une adresse" />
                    <ActionButton href="/lightning/invoice" icon={FileText} title="Recevoir" description="Générer une facture" />
                </div>
            </CardContent>
        </Card>

      {/* Transaction History */}
      <Card>
          <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Historique des Transactions</CardTitle>
                <CardDescription>Vos paiements Lightning récents.</CardDescription>
              </div>
               <Button asChild variant="link" className="text-primary">
                    <Link href="/transactions">Voir tout</Link>
                </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loadingTransactions ? (
                <div className="p-4 space-y-4">
                     {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4 px-2">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : transactionsError ? (
                <div className="p-4">
                    <div className="p-4 text-center text-destructive border border-destructive/20 bg-destructive/10 rounded-lg">
                        <AlertCircle className="mx-auto h-6 w-6" />
                        <p className="mt-2 font-semibold">Erreur de chargement</p>
                        <p className="text-sm">{transactionsError}</p>
                        <Button onClick={fetchTransactions} variant="secondary" size="sm" className="mt-4">
                            Réessayer
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-0">
                {transactions.length > 0 ? (
                    transactions.map((tx, index) => (
                    <React.Fragment key={tx.payment_hash || `${index}-${tx.created_at}`}>
                    <div className="flex items-center gap-4 p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                        {tx.type === "incoming" ? (
                            <ArrowDownLeft className="size-5 text-green-500" />
                        ) : (
                            <ArrowUpRight className="size-5 text-red-500" />
                        )}
                        </div>
                        <div className="flex-1">
                        <p
                            className={`font-semibold ${
                            tx.type === "incoming"
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                        >
                            {tx.type === "incoming" ? "+" : "-"}
                            {formatSats(tx.amount_sats)} sats
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                            {tx.memo || (tx.type === 'incoming' ? 'Paiement reçu' : 'Paiement envoyé')}
                        </p>
                        </div>
                         <div className="text-right space-y-1">
                             <p className="text-xs text-muted-foreground capitalize">
                                {format(parseISO(tx.created_at), "d MMM", { locale: fr })}
                            </p>
                            <Badge variant={getStatusVariant(tx.status)} className="capitalize text-xs py-0.5 px-1.5 font-medium">
                                {getStatusIcon(tx.status)}
                                <span className="ml-1">{tx.status}</span>
                            </Badge>
                         </div>
                    </div>
                    {index < transactions.length - 1 && (
                        <Separator />
                    )}
                    </React.Fragment>
                ))) : (
                    <div className="p-8 text-center text-muted-foreground">
                    Aucune transaction pour le moment.
                    </div>
                )}
                </div>
            )}
          </CardContent>
      </Card>
    </div>
  );
}

    
    