
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ShieldCheck, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/copy-button";

export default function CreateWalletPage() {
  const { toast } = useToast();
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateMnemonic = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.generateMnemonic();
      setMnemonic(response.data.mnemonic);
      localStorage.setItem("tempMnemonic", response.data.mnemonic);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error?.details?.detail ||
        "Impossible de générer la phrase de récupération. Veuillez réessayer.";
      setError(errorMsg);
      toast({
        variant: "destructive",
        title: "Échec de la création du portefeuille",
        description: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    generateMnemonic();
  }, [generateMnemonic]);

  const mnemonicWords = mnemonic?.split(" ") || Array(12).fill(null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Votre phrase de récupération</CardTitle>
          <CardDescription>
            Ces 12 mots sont le seul moyen de récupérer votre portefeuille.
            <br />
            Écrivez-les et conservez-les dans un endroit sûr, hors ligne.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive" className="bg-destructive/10">
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Ne partagez jamais ces mots !</AlertTitle>
            <AlertDescription>
              Toute personne possédant ces mots peut voler vos Bitcoins. Ne les stockez pas en ligne.
            </AlertDescription>
          </Alert>
          <div className="rounded-lg border bg-background p-6">
            {loading ? (
              <div className="grid grid-cols-2 gap-x-12 gap-y-4 font-code text-lg sm:grid-cols-3">
                {Array.from({ length: 12 }).map((_, index) => (
                  <Skeleton key={index} className="h-6 w-24" />
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center text-center text-destructive">
                <AlertCircle className="mb-2 size-8" />
                <p className="font-semibold">Erreur de génération des mots</p>
                <p className="text-sm">{error}</p>
                <Button
                  onClick={generateMnemonic}
                  variant="secondary"
                  className="mt-4"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Réessayer
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-12 gap-y-4 font-code text-lg sm:grid-cols-3">
                {mnemonicWords.map((word, index) => (
                  <div key={index} className="flex items-baseline">
                    <span className="mr-3 text-sm text-muted-foreground">
                      {index + 1}.
                    </span>
                    <span>{word}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <CopyButton
            textToCopy={mnemonic || ""}
            disabled={loading || !mnemonic || !!error}
            variant="outline"
            toastMessage="Phrase de récupération copiée"
          >
            Copier les mots
          </CopyButton>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full" size="lg" disabled={loading || !!error || !mnemonic}>
            <Link href="/verify-mnemonic">Je les ai notés</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
