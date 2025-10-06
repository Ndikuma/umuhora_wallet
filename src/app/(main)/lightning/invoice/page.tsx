
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, FileText, Zap, Loader2, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyButton } from "@/components/copy-button";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { LightningInvoice } from "@/lib/types";

export default function GenerateInvoicePage() {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [invoice, setInvoice] = useState<LightningInvoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  // Polling effect to check invoice status
  useEffect(() => {
    if (!invoice || isPaid || invoice.status === 'paid') {
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        const response = await api.getLightningInvoice(invoice.payment_hash);
        if (response.data.status === 'paid') {
          setIsPaid(true);
          toast({
            title: "Paiement Reçu!",
            description: `Vous avez reçu ${response.data.amount_sats} sats.`,
          });
          clearInterval(intervalId);
        }
      } catch (error: any) {
        // Stop polling on error to avoid spamming the console.
        // This can happen if the backend hasn't processed the invoice yet.
        // We let it continue polling silently.
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId);
  }, [invoice, isPaid, toast]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setInvoice(null);
    setIsPaid(false);
    
    try {
      const response = await api.generateLightningInvoice({
        amount: parseInt(amount, 10),
        memo: memo || undefined,
      });
      setInvoice(response.data);
    } catch(error: any) {
       toast({
        variant: "destructive",
        title: "Échec de la génération",
        description: error.message || "Impossible de générer une facture.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReset = () => {
    setAmount("");
    setMemo("");
    setInvoice(null);
    setIsPaid(false);
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Button variant="ghost" asChild className="-ml-4">
        <Link href="/lightning">
          <ArrowLeft className="mr-2 size-4" />
          Retour
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="text-primary" />
            {isPaid ? "Paiement Reçu" : "Générer une facture Lightning"}
          </CardTitle>
          <CardDescription>
             {isPaid 
                ? `La facture de ${invoice?.amount_sats} sats a été payée.`
                : "Créez une facture pour recevoir un paiement via le Lightning Network."
             }
          </CardDescription>
        </CardHeader>
        
        {invoice ? (
          <>
            <CardContent className="flex flex-col items-center gap-6">
              {isPaid ? (
                <div className="flex flex-col items-center justify-center text-center space-y-4 my-8">
                  <CheckCircle2 className="size-24 text-green-500" />
                  <p className="text-2xl font-bold">Paiement Reçu !</p>
                  <p className="text-muted-foreground">
                    {invoice.amount_sats} sats ont été ajoutés à votre solde.
                  </p>
                </div>
              ) : (
                <>
                  <div className="relative rounded-lg border bg-white p-4 shadow-sm">
                    {invoice.qr_code ? (
                      <Image
                        src={invoice.qr_code}
                        alt="Code QR de la facture Lightning"
                        width={256}
                        height={256}
                        className="rounded-md"
                        data-ai-hint="qr code"
                      />
                    ) : (
                      <Skeleton className="h-64 w-64" />
                    )}
                  </div>
                   <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 rounded-lg bg-secondary">
                        <Clock className="size-4 animate-pulse" />
                        <span>En attente du paiement...</span>
                    </div>
                  <div className="w-full space-y-2">
                    <Label>Facture Lightning</Label>
                    <div className="break-all rounded-md border bg-secondary p-3 font-mono text-sm text-muted-foreground">
                      {invoice.bolt11}
                    </div>
                  </div>
                  <CopyButton textToCopy={invoice.bolt11} toastMessage="Facture copiée dans le presse-papiers">
                    Copier la facture
                  </CopyButton>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button variant={isPaid ? "default" : "outline"} className="w-full" onClick={handleReset}>
                Créer une autre facture
              </Button>
            </CardFooter>
          </>
        ) : (
          <form onSubmit={handleGenerate}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Montant (sats)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="memo">Mémo (optionnel)</Label>
                <Input
                  id="memo"
                  type="text"
                  placeholder="Ex: Pour le café"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin"/>}
                {isLoading ? "Génération en cours..." : "Générer la facture"}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
