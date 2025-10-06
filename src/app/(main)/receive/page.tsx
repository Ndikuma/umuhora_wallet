
"use client";

import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CopyButton } from "@/components/copy-button";
import { useState, useEffect, useCallback } from "react";
import { ShareButton } from "./share-button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Loader2, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export default function ReceivePage() {
  const { toast } = useToast();
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateNewAddressFn = useCallback(async (isInitial = false) => {
    if (!isInitial) setGenerating(true);
    setLoading(true);
    setError(null);
    try {
      const response = await api.generateNewAddress();
      setAddress(response.data.address);
      if (!isInitial) {
         toast({
          title: "Nouvelle adresse générée",
          description: "Une nouvelle adresse de réception a été créée pour vous.",
        });
      }
    } catch (error: any) {
      const errorMsg = error.message || "Impossible de générer une nouvelle adresse. Veuillez réessayer.";
      setError(errorMsg);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: errorMsg,
      });
    } finally {
      if (!isInitial) setGenerating(false);
      setLoading(false);
    }
  }, [toast]);
  
  const fetchAddress = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getWallets();
      if (response.data && Array.isArray(response.data) && response.data.length > 0 && response.data[0].address) {
        setAddress(response.data[0].address);
      } else {
        await generateNewAddressFn(true); // First time generation
      }
    } catch (error) {
      await generateNewAddressFn(true);
    } finally {
      setLoading(false);
    }
  }, [generateNewAddressFn]);

  useEffect(() => {
    fetchAddress();
  }, [fetchAddress]);

  useEffect(() => {
    if (!address) return;

    const uri = `bitcoin:${address}`;

    const generateQrCodeFn = async () => {
        try {
            const response = await api.generateQrCode(uri);
            setQrCode(response.data.qr_code);
        } catch (error) {
            console.error("Échec de la génération du QR code depuis le backend, utilisation d'une solution de secours.", error);
            const fallbackQrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(uri)}&format=png&bgcolor=ffffff`;
            setQrCode(fallbackQrApiUrl);
        }
    };

    generateQrCodeFn();
  }, [address]);


  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Recevoir des Bitcoins</CardTitle>
          <CardDescription>
            Partagez votre adresse pour recevoir des BTC.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div className="rounded-lg border bg-white p-4 shadow-sm min-h-[288px] min-w-[288px] flex items-center justify-center">
            {loading ? (
                <Skeleton className="h-[256px] w-[256px] rounded-md" />
            ) : error ? (
                 <div className="text-center text-destructive p-4">
                    <AlertCircle className="mx-auto h-8 w-8" />
                    <p className="mt-2 font-semibold">Erreur de génération d'adresse</p>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">{error}</p>
                    <Button onClick={fetchAddress} variant="secondary" className="mt-4">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Réessayer
                    </Button>
                </div>
            ) : qrCode ? (
                <Image
                src={qrCode}
                alt="Code QR de l'adresse du portefeuille"
                width={256}
                height={256}
                className="rounded-md"
                data-ai-hint="qr code"
              />
            ) : (
                <Skeleton className="h-[256px] w-[256px] rounded-md" />
            )}
          </div>
          
          <div className="w-full space-y-4">
            <div className="text-sm text-muted-foreground break-all font-code p-3 rounded-md bg-secondary border text-center">
                {loading ? <Skeleton className="h-5 w-4/5 mx-auto" /> : address || '...'}
            </div>
          </div>
         
          <div className="flex w-full flex-col gap-3">
             <div className="grid grid-cols-2 gap-3">
                <CopyButton 
                  textToCopy={address || ''} 
                  disabled={loading || !address || !!error} 
                  toastMessage="Adresse copiée dans le presse-papiers"
                  variant="outline"
                >
                  Copier l'adresse
                </CopyButton>
                <ShareButton 
                  shareData={{ title: "Mon adresse Bitcoin", text: address || '' }} 
                  disabled={loading || !address || !!error}
                  variant="outline"
                >
                  Partager l'adresse
                </ShareButton>
             </div>

             <Separator />
             
             <Button variant="ghost" size="sm" onClick={() => generateNewAddressFn(false)} disabled={generating || loading || !!error}>
                <RefreshCw className={cn("mr-2 size-4", generating && "animate-spin")} />
                {generating ? 'Génération...' : 'Générer une nouvelle adresse'}
             </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
