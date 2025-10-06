
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import type { User, Wallet } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowRight, User as UserIcon, BarChart2, Clock, Hash, TrendingUp, TrendingDown, Copy, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { shortenText } from "@/lib/utils.tsx";
import { CopyButton } from "@/components/copy-button";

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: string | number | undefined;
  isLoading: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, isLoading }) => {
    return (
        <Card className="flex flex-col justify-between p-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{title}</p>
                <Icon className="size-5 text-muted-foreground" />
            </div>
            {isLoading ? (
                <Skeleton className="mt-2 h-7 w-20" />
            ) : (
                <p className="text-2xl font-bold">{value}</p>
            )}
        </Card>
    );
};

export default function ProfilePage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        const [userResponse, walletResponse] = await Promise.all([
            api.getUserProfile(),
            api.getWallets()
        ]);
        setUser(userResponse.data);
        if (walletResponse.data && walletResponse.data.length > 0) {
          setWallet(walletResponse.data[0]);
        }
      } catch (error: any) {
        const errorMsg = error.message || "Impossible de charger les données de l'utilisateur. Veuillez réessayer plus tard.";
        setError(errorMsg);
        toast({
          variant: "destructive",
          title: "Échec du chargement du profil",
          description: errorMsg,
        });
      } finally {
        setLoading(false);
      }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const getInitials = () => {
      if (!user) return "";
      const firstNameInitial = user.first_name?.[0] || '';
      const lastNameInitial = user.last_name?.[0] || '';
      return `${firstNameInitial}${lastNameInitial}`.toUpperCase() || user.username?.[0].toUpperCase();
  }

  const walletStats = wallet?.stats;

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-72" />
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-4 w-60" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-4 space-y-2">
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-7 w-1/4" />
                </Card>
            ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
       <div className="mx-auto max-w-2xl text-center">
         <Card className="flex h-48 items-center justify-center">
            <div className="text-center text-destructive">
              <AlertCircle className="mx-auto h-8 w-8" />
              <p className="mt-2 font-semibold">Erreur de chargement du profil</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">{error}</p>
              <Button onClick={fetchData} variant="secondary" className="mt-4">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Réessayer
              </Button>
            </div>
          </Card>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Mon Profil</h1>
        <p className="text-muted-foreground">
          Affichez les informations de votre compte et les statistiques de votre portefeuille.
        </p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
             <Avatar className="h-20 w-20 sm:h-16 sm:w-16 text-3xl font-bold">
              <AvatarFallback>
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl sm:text-2xl">{user.first_name && user.last_name ? `${user.first_name} ${user.last_name}`: user.username}</CardTitle>
              <CardDescription>
                <span className="font-mono">{user.username}</span> - {user.email}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/profile/edit">
              Modifier le profil
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
      
      <div className="space-y-2">
        <h2 className="text-xl font-bold tracking-tight md:text-2xl">Statistiques du Portefeuille</h2>
        <p className="text-muted-foreground">
          Aperçu de l'activité de votre portefeuille.
        </p>
      </div>

       <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard icon={BarChart2} title="Solde" value={wallet?.balance_formatted} isLoading={loading} />
          <StatCard icon={Hash} title="Total Transactions" value={walletStats?.total_transactions} isLoading={loading} />
          <StatCard icon={Clock} title="Âge du portefeuille (jours)" value={walletStats?.wallet_age_days} isLoading={loading} />
          <StatCard icon={TrendingDown} title="Total envoyé" value={walletStats?.total_sent} isLoading={loading} />
          <StatCard icon={TrendingUp} title="Total reçu" value={walletStats?.total_received} isLoading={loading} />
          <Card className="flex flex-col justify-between p-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Adresse principale</p>
                <UserIcon className="size-5 text-muted-foreground" />
            </div>
            {loading ? (
                <Skeleton className="mt-2 h-7 w-full" />
            ) : (
                <div className="flex items-center gap-2 mt-2">
                    <p className="text-sm font-code font-semibold break-all">{shortenText(wallet?.primary_address, 10, 10)}</p>
                    <CopyButton
                        textToCopy={wallet?.primary_address || ''}
                        toastMessage="Adresse copiée"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                    />
                </div>
            )}
        </Card>
       </div>
    </div>
  );
}
