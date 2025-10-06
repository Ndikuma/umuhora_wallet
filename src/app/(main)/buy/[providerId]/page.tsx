
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/api";
import type { BuyProvider, BuyFeeCalculation, BuyOrderPayload } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { ArrowLeft, Loader2, ShoppingCart, Bitcoin, AlertCircle, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProviderIcon } from "@/components/provider-icon";


const buySchema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: "Veuillez entrer un nombre valide." })
    .min(1, { message: "Le montant doit être d'au moins 1." }),
  currency: z.string().min(1, "Veuillez sélectionner une devise."),
});

type BuyFormValues = z.infer<typeof buySchema>;

export default function BuyWithProviderPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const providerId = Number(params.providerId);

  const [provider, setProvider] = useState<BuyProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [feeCalc, setFeeCalc] = useState<BuyFeeCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BuyFormValues>({
    resolver: zodResolver(buySchema),
    mode: 'onChange'
  });

  const watchedAmount = form.watch("amount");
  const watchedCurrency = form.watch("currency");
  const debouncedAmount = useDebounce(watchedAmount, 500);

  const fetchProvider = useCallback(async () => {
      setLoading(true);
      setError(null);
      if (isNaN(providerId)) {
        setError("L'identifiant du fournisseur est invalide.");
        setLoading(false);
        return;
      }
      try {
        const response = await api.getBuyProvider(providerId);
        setProvider(response.data);
        if (response.data.currencies.length > 0) {
          form.setValue('currency', response.data.currencies[0]);
        }
      } catch (err: any) {
        setError(err.message || "Échec de la récupération des informations du fournisseur.");
      } finally {
        setLoading(false);
      }
  }, [providerId, form]);

  useEffect(() => {
    fetchProvider();
  }, [fetchProvider]);
  
  const calculateFee = useCallback(async (amount: number, currency: string) => {
    if (!provider || !currency) return;
    setIsCalculating(true);
    setCalcError(null);
    try {
      const response = await api.calculateBuyFee(provider.id, amount, currency);
      setFeeCalc(response.data);
    } catch (err: any) {
      setCalcError(err.message || "Impossible de calculer les frais.");
      setFeeCalc(null);
    } finally {
      setIsCalculating(false);
    }
  }, [provider]);

  useEffect(() => {
    if (debouncedAmount > 0 && watchedCurrency && form.formState.isValid) {
      calculateFee(debouncedAmount, watchedCurrency);
    } else {
      setFeeCalc(null);
      setCalcError(null);
    }
  }, [debouncedAmount, watchedCurrency, form.formState.isValid, calculateFee]);

  const onSubmit = async (data: BuyFormValues) => {
    if (!provider || !feeCalc) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Le calcul des frais n\'est pas terminé.' });
        return;
    }
    setIsSubmitting(true);
    try {
        const orderPayload: BuyOrderPayload = {
            direction: 'buy',
            payment_method: feeCalc.payment_method,
            provider_id: provider.id,
            amount: data.amount,
            amount_currency: data.currency,
            btc_amount: feeCalc.btc_amount ? parseFloat(feeCalc.btc_amount) : undefined,
            ln_amount_sats: feeCalc.sats_amount ? parseInt(feeCalc.sats_amount) : undefined,
        };

        const order = await api.createBuyOrder(orderPayload);
        toast({ title: 'Commande créée', description: `Votre commande #${order.data.id} a été créée.` });
        router.push(`/orders/${order.data.id}`);
    } catch (err: any) {
        toast({ variant: 'destructive', title: 'Échec de la commande', description: err.message || 'Impossible de créer votre commande.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <Skeleton className="h-8 w-32" />
        <Card>
          <CardHeader><Skeleton className="h-12 w-12 rounded-lg" /><div className="space-y-2"><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-60" /></div></CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
        <div className="mx-auto max-w-lg">
            <Button variant="ghost" asChild className="-ml-4"><Link href="/buy"><ArrowLeft className="mr-2 size-4" />Retour aux fournisseurs</Link></Button>
            <Card className="mt-4 flex h-48 items-center justify-center">
                <div className="text-center text-destructive">
                    <AlertCircle className="mx-auto h-8 w-8" />
                    <p className="mt-2 font-semibold">Erreur de chargement du fournisseur</p>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">{error}</p>
                    <Button onClick={fetchProvider} variant="secondary" className="mt-4">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Réessayer
                    </Button>
                </div>
            </Card>
        </div>
    )
  }

  if (!provider) return null;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Button variant="ghost" asChild className="-ml-4">
        <Link href="/buy">
          <ArrowLeft className="mr-2 size-4" />
          Retour aux fournisseurs
        </Link>
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-start gap-4">
            <ProviderIcon provider={provider} />
           <div>
            <CardTitle className="text-2xl">{provider.name}</CardTitle>
            <CardDescription>{provider.description}</CardDescription>
           </div>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-base font-semibold">Montant à acheter</Label>
                      <div className="flex gap-2">
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormControl>
                                        <Input id="amount" type="number" placeholder="100.00" {...field} value={field.value ?? ''} className="text-lg h-12" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="currency"
                            render={({ field }) => (
                                <FormItem>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-12 w-32">
                                                <SelectValue placeholder="Devise" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {provider.currencies.map(c => <SelectItem key={c} value={c}>{c.toUpperCase()}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                      </div>
                    </div>


                    {(isCalculating || feeCalc || calcError) && (
                        <div className="space-y-3 rounded-lg border bg-secondary/30 p-4">
                            {isCalculating && <div className="flex items-center justify-center text-muted-foreground text-sm"><Loader2 className="mr-2 size-4 animate-spin" />Calcul...</div>}
                            {calcError && <div className="text-center text-sm text-destructive">{calcError}</div>}
                            {feeCalc && (
                                <div className="space-y-4">
                                     <div className="space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-muted-foreground">Montant</span><span>{feeCalc.amount} {feeCalc.currency}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">Frais</span><span>{feeCalc.fee} {feeCalc.currency}</span></div>
                                        <Separator />
                                        <div className="flex justify-between font-bold text-base"><span >Total à payer</span><span>{feeCalc.total_amount} {feeCalc.currency}</span></div>
                                    </div>
                                    <Separator className="border-dashed" />
                                    <div className="flex items-center justify-between text-base">
                                        <span className="font-semibold flex items-center gap-2">
                                          {feeCalc.payment_method === 'lightning' ? <Zap className="size-5 text-primary" /> : <Bitcoin className="size-5 text-primary" />}
                                          Vous recevrez
                                        </span>
                                        <span className="font-bold font-mono">
                                          {feeCalc.payment_method === 'lightning'
                                            ? `${feeCalc.sats_amount} sats`
                                            : `${feeCalc.btc_amount} BTC`}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </CardContent>
                <CardFooter>
                    <Button type="submit" size="lg" className="w-full" disabled={!feeCalc || isCalculating || isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ShoppingCart className="mr-2 size-5" />}
                        {isSubmitting ? "Création de la commande..." : "Créer une commande d'achat"}
                    </Button>
                </CardFooter>
            </form>
        </Form>
      </Card>
    </div>
  );
}
