
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/api";
import type { Balance, SellProvider, FeeEstimation, SellOrderPayload, PayoutData, Order, LightningBalance } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Bitcoin, Landmark, Loader2, Banknote, Info, User as UserIcon, Phone, Mail, AlertCircle, Check, Zap, CheckCircle2 } from "lucide-react";
import Image from "next/image";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { getFiat } from "@/lib/utils";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";

const networkSchema = z.object({
    network: z.enum(["on_chain", "lightning"]),
});

const onChainAmountSchema = (balance: number) => z.object({
  amount: z.coerce
    .number({ invalid_type_error: "Veuillez entrer un nombre valide." })
    .positive({ message: "Le montant doit être supérieur à zéro." })
    .max(balance, `Solde insuffisant. Disponible : ${balance.toFixed(8)} BTC`),
});

const lightningAmountSchema = (balance: number) => z.object({
  amount: z.coerce
    .number({ invalid_type_error: "Veuillez entrer un nombre valide." })
    .int("Veuillez entrer un nombre entier de sats.")
    .positive({ message: "Le montant doit être supérieur à zéro." })
    .max(balance, `Solde insuffisant. Disponible : ${balance} sats`),
});

const providerSchema = z.object({
    providerId: z.string({ required_error: "Veuillez sélectionner un fournisseur." }),
});

const paymentDetailsSchema = z.object({
    full_name: z.string().min(1, "Le nom complet est requis."),
    phone_number: z.string().min(1, "Le numéro de téléphone est requis."),
    account_number: z.string().min(1, "Le numéro de compte est requis."),
    email: z.string().email("Veuillez entrer une adresse e-mail valide.").optional(),
});

type FormData = {
    network?: "on-chain" | "lightning";
    amount?: number;
    providerId?: string;
    paymentDetails?: PayoutData;
};


export default function SellPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [balance, setBalance] = useState<Balance | null>(null);
    const [lightningBalance, setLightningBalance] = useState<LightningBalance | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [dataError, setDataError] = useState<string | null>(null);

    const [providers, setProviders] = useState<SellProvider[]>([]);
    
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<FormData>({});
    
    const [feeEstimation, setFeeEstimation] = useState<FeeEstimation | null>(null);
    const [isEstimatingFee, setIsEstimatingFee] = useState(false);
    const [feeError, setFeeError] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const currentOnChainBalance = balance ? parseFloat(balance.balance) : 0;
    const currentLightningBalance = lightningBalance ? lightningBalance.balance : 0;

    const networkForm = useForm<z.infer<typeof networkSchema>>({
        resolver: zodResolver(networkSchema),
    });

    const onChainAmountForm = useForm<{ amount: number }>({
        resolver: zodResolver(onChainAmountSchema(currentOnChainBalance)),
        mode: "onChange",
    });

    const lightningAmountForm = useForm<{ amount: number }>({
        resolver: zodResolver(lightningAmountSchema(currentLightningBalance)),
        mode: "onChange",
    });

    const providerForm = useForm<{ providerId: string }>({
        resolver: zodResolver(providerSchema),
        mode: "onChange",
    });

    const paymentDetailsForm = useForm<z.infer<typeof paymentDetailsSchema>>({
        resolver: zodResolver(paymentDetailsSchema),
        mode: "onChange",
    });
    
    const fetchInitialData = useCallback(async (network?: 'on_chain' | 'lightning') => {
        setIsLoadingData(true);
        setDataError(null);
        try {
            const promises: Promise<any>[] = [api.getSellProviders(network)];
            if (network === 'on_chain') {
                promises.push(api.getWalletBalance());
            } else if (network === 'lightning') {
                promises.push(api.getLightningBalance());
            } else {
                 promises.push(api.getWalletBalance(), api.getLightningBalance());
            }

            const [providersRes, balanceRes, lightningBalanceRes] = await Promise.all(promises);

            setProviders(providersRes.data);

            if(balanceRes) setBalance(balanceRes.data);
            if(lightningBalanceRes) setLightningBalance(lightningBalanceRes.data);
            
        } catch (err: any) {
            const errorMsg = err.message || "Échec du chargement des données initiales.";
            setDataError(errorMsg);
            toast({ variant: "destructive", title: "Erreur", description: errorMsg });
        } finally {
            setIsLoadingData(false);
        }
    }, [toast]);
    
    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);
    
    const estimateFeeCallback = useCallback(async (amount: number) => {
        if (formData.network !== 'on_chain') return;
        setIsEstimatingFee(true);
        setFeeError(null);
        try {
            const feeResponse = await api.estimateFee({ amount: String(amount) });
            setFeeEstimation(feeResponse.data);
        } catch (error: any) {
            setFeeError(error.message);
            setFeeEstimation(null);
        } finally {
            setIsEstimatingFee(false);
        }
    }, [formData]);

    useEffect(() => {
        (onChainAmountForm.control as any)._resolver = zodResolver(onChainAmountSchema(currentOnChainBalance));
        if (onChainAmountForm.formState.isDirty) {
            onChainAmountForm.trigger("amount");
        }
    }, [balance, onChainAmountForm, currentOnChainBalance]);

    useEffect(() => {
        (lightningAmountForm.control as any)._resolver = zodResolver(lightningAmountSchema(currentLightningBalance));
        if (lightningAmountForm.formState.isDirty) {
            lightningAmountForm.trigger("amount");
        }
    }, [lightningBalance, lightningAmountForm, currentLightningBalance]);


    const handleNext = async () => {
        let isStepValid = false;
        if (currentStep === 0) {
            isStepValid = await networkForm.trigger();
            if(isStepValid) {
                const network = networkForm.getValues().network;
                setFormData({ network });
                await fetchInitialData(network); // Re-fetch providers and balance for the selected network
                setCurrentStep(1);
            }
        }
        else if (currentStep === 1) {
            const isLightning = formData.network === 'lightning';
            const formToValidate = isLightning ? lightningAmountForm : onChainAmountForm;
            isStepValid = await formToValidate.trigger();
            if (isStepValid) {
                const newFormData = { ...formData, ...formToValidate.getValues() };
                setFormData(newFormData);
                setCurrentStep(2);
            }
        } else if (currentStep === 2) {
            isStepValid = await providerForm.trigger();
            if (isStepValid) {
                const newFormData = { ...formData, ...providerForm.getValues() };
                setFormData(newFormData);
                setCurrentStep(3);
            }
        } else if (currentStep === 3) {
             isStepValid = await paymentDetailsForm.trigger();
            if (isStepValid) {
                const newFormData = { ...formData, paymentDetails: paymentDetailsForm.getValues() };
                setFormData(newFormData);
                if (newFormData.network === 'on_chain' && newFormData.amount) {
                    estimateFeeCallback(newFormData.amount);
                }
                setCurrentStep(4);
            }
        }
    }


    const handleBack = () => {
        setCurrentStep(prev => Math.max(0, prev - 1));
        if (currentStep === 1) {
            fetchInitialData(); // Fetch all providers again
        }
        if (currentStep <= 4) {
            setFeeEstimation(null);
            setFeeError(null);
        }
    };

    const handleSell = async () => {
        if (!formData.amount || !formData.providerId || !formData.paymentDetails || !formData.network) {
            toast({ variant: 'destructive', title: 'Données manquantes', description: 'Veuillez compléter toutes les étapes.' });
            return;
        }

        if (formData.network === 'on_chain' && !feeEstimation) {
            toast({ variant: 'destructive', title: 'Calcul des frais requis', description: 'Impossible d\'estimer les frais de transaction.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const provider_id = Number(formData.providerId);
            const payout_data = formData.paymentDetails;

            let orderPayload: SellOrderPayload;

            if (formData.network === 'on_chain' && feeEstimation) {
                orderPayload = {
                    direction: 'sell',
                    provider_id,
                    payment_method: 'on_chain',
                    amount: formData.amount,
                    btc_amount: parseFloat(feeEstimation.sendable_btc),
                    payout_data,
                    amount_currency: 'BTC',
                    total_amount: feeEstimation.sendable_bif.toString(), // Example, adjust as needed
                };
            } else { // Lightning
                orderPayload = {
                    direction: 'sell',
                    provider_id,
                    payment_method: 'lightning',
                    ln_amount_sats: formData.amount,
                    payout_data,
                };
            }
            
            const response = await api.createSellOrder(orderPayload);
            toast({ title: 'Commande de vente créée', description: `Votre commande #${response.data.id} est en cours de traitement.` });
            router.push(`/orders/${response.data.id}`);

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Échec de la vente', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const selectedProvider = useMemo(() => {
        return providers.find(p => String(p.id) === formData.providerId);
    }, [providers, formData.providerId]);

    const renderNetworkStep = () => (
         <Card>
            <CardHeader>
                <CardTitle>Étape 1: Choisissez le Réseau</CardTitle>
                <CardDescription>Indiquez si vous souhaitez vendre des fonds depuis votre solde On-Chain ou Lightning.</CardDescription>
            </CardHeader>
            <Form {...networkForm}>
                <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
                    <CardContent>
                         <FormField
                            control={networkForm.control}
                            name="network"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormItem>
                                                <FormControl>
                                                    <RadioGroupItem value="on_chain" id="on-chain" className="peer sr-only" />
                                                </FormControl>
                                                <Label htmlFor="on-chain" className="cursor-pointer hover:border-primary transition-colors p-6 flex flex-col items-center justify-center text-center rounded-lg border-2 border-muted bg-popover peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                                    <Bitcoin className="size-10 text-primary mb-3"/>
                                                    <h3 className="font-semibold text-lg">On-Chain</h3>
                                                    <p className="text-sm text-muted-foreground mt-1">Vendre depuis votre solde principal. Idéal pour des montants plus importants.</p>
                                                </Label>
                                            </FormItem>
                                             <FormItem>
                                                <FormControl>
                                                    <RadioGroupItem value="lightning" id="lightning" className="peer sr-only" />
                                                </FormControl>
                                                <Label htmlFor="lightning" className="cursor-pointer hover:border-primary transition-colors p-6 flex flex-col items-center justify-center text-center rounded-lg border-2 border-muted bg-popover peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                                    <Zap className="size-10 text-primary mb-3"/>
                                                    <h3 className="font-semibold text-lg">Lightning</h3>
                                                    <p className="text-sm text-muted-foreground mt-1">Vendre des sats depuis votre solde Lightning pour un paiement rapide.</p>
                                                </Label>
                                            </FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage className="pt-2" />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" size="lg" disabled={isLoadingData}>Suivant</Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );

    const renderAmountStep = () => {
        const isLightning = formData.network === 'lightning';
        const form = isLightning ? lightningAmountForm : onChainAmountForm;
        const currentBalance = isLightning ? currentLightningBalance : currentOnChainBalance;
        const unit = isLightning ? 'sats' : 'BTC';

        return (
             <Card>
                <CardHeader>
                    <CardTitle>Étape 2: Entrez le Montant</CardTitle>
                    <CardDescription>Spécifiez la quantité de {unit} que vous souhaitez vendre.</CardDescription>
                </CardHeader>
                <Form {...form}>
                <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
                    <CardContent className="space-y-6">
                         <div className="p-4 rounded-lg bg-secondary border">
                            <p className="text-sm text-muted-foreground">Votre solde disponible</p>
                            {isLoadingData ? 
                                <Skeleton className="h-8 w-48 mt-1" /> :
                                <p className="text-2xl font-bold font-mono">{isLightning ? currentBalance.toLocaleString('fr-FR') : currentBalance.toFixed(8)} {unit}</p>
                            }
                        </div>
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Montant en {unit}</FormLabel>
                                <div className="relative">
                                    <FormControl><Input type="number" step={isLightning ? "1" : "0.00000001"} placeholder="0.00" {...field} value={field.value ?? ''} className="pl-8 text-lg h-12"/></FormControl>
                                    {isLightning ? <Zap className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /> : <Bitcoin className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />}
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => form.setValue("amount", parseFloat((currentBalance * 0.25).toFixed(isLightning ? 0 : 8)), { shouldValidate: true })}>25%</Button>
                                    <Button type="button" variant="outline" size="sm" onClick={() => form.setValue("amount", parseFloat((currentBalance * 0.50).toFixed(isLightning ? 0 : 8)), { shouldValidate: true })}>50%</Button>
                                    <Button type="button" variant="outline" size="sm" onClick={() => form.setValue("amount", parseFloat((currentBalance * 0.75).toFixed(isLightning ? 0 : 8)), { shouldValidate: true })}>75%</Button>
                                    <Button type="button" variant="destructive" size="sm" onClick={() => form.setValue("amount", currentBalance, { shouldValidate: true })}>Max</Button>
                                </div>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" size="lg">Suivant</Button>
                    </CardFooter>
                </form>
                </Form>
            </Card>
        );
    }

     const renderProviderStep = () => (
         <Card>
            <CardHeader>
                <CardTitle>Étape 3: Choisissez un Fournisseur</CardTitle>
                <CardDescription>Sélectionnez un fournisseur pour traiter votre transaction de vente.</CardDescription>
            </CardHeader>
             <Form {...providerForm}>
            <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
                <CardContent className="space-y-6">
                    {isLoadingData && <Loader2 className="animate-spin mx-auto" />}
                    {dataError && <Alert variant="destructive"><AlertTitle>Erreur</AlertTitle><AlertDescription>{dataError}</AlertDescription></Alert>}
                     {!isLoadingData && !dataError && providers.length === 0 && (
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Aucun Fournisseur Disponible</AlertTitle>
                            <AlertDescription>Actuellement, aucun fournisseur n'est disponible pour traiter les ordres de vente pour le réseau {formData.network}. Veuillez réessayer plus tard.</AlertDescription>
                        </Alert>
                    )}
                    {!isLoadingData && <FormField
                        control={providerForm.control}
                        name="providerId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fournisseurs disponibles</FormLabel>
                                <FormControl>
                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="space-y-2">
                                        {providers.map(provider => (
                                            <FormItem key={provider.id}>
                                                <FormControl>
                                                     <RadioGroupItem value={String(provider.id)} id={`provider-${provider.id}`} className="peer sr-only" />
                                                </FormControl>
                                                <Label htmlFor={`provider-${provider.id}`} className="block rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                                    <div className="flex items-start gap-4">
                                                        {provider.image ? <Image src={provider.image} alt={`${provider.name} logo`} width={40} height={40} className="rounded-lg border" /> : <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-secondary"><Landmark className="size-5 text-muted-foreground" /></div>}
                                                        <div>
                                                            <p className="font-semibold">{provider.name}</p>
                                                            <p className="text-sm text-muted-foreground">{provider.description}</p>
                                                        </div>
                                                    </div>
                                                </Label>
                                            </FormItem>
                                        ))}
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />}
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" size="lg" disabled={providers.length === 0 || isLoadingData}>Suivant</Button>
                </CardFooter>
            </form>
            </Form>
        </Card>
    );

    const renderPaymentDetailsStep = () => (
         <Card>
            <CardHeader>
                <CardTitle>Étape 4: Entrez les Détails de Paiement</CardTitle>
                <CardDescription>Fournissez vos informations de compte pour recevoir les fonds. C'est là que votre argent sera envoyé, alors assurez-vous de l'exactitude.</CardDescription>
            </CardHeader>
             <Form {...paymentDetailsForm}>
            <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
                <CardContent className="space-y-4">
                     <FormField
                        control={paymentDetailsForm.control}
                        name="full_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nom Complet</FormLabel>
                                <FormControl>
                                    <Input placeholder="ex: Alice Dubois" {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={paymentDetailsForm.control}
                        name="phone_number"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Numéro de téléphone</FormLabel>
                                <FormControl>
                                    <Input placeholder="ex: +25779988777" {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={paymentDetailsForm.control}
                        name="account_number"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Numéro de Compte</FormLabel>
                                <FormControl>
                                    <Input placeholder="ex: 987654321" {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={paymentDetailsForm.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>E-mail (Optionnel)</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="ex: alice@example.com" {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" size="lg">Suivant</Button>
                </CardFooter>
            </form>
            </Form>
        </Card>
    );

    const renderConfirmationStep = () => {
        const isLightning = formData.network === 'lightning';

        if (isEstimatingFee && !isLightning) {
            return (
                <Card>
                    <CardHeader>
                        <CardTitle>Étape 5: Confirmer & Vendre</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-48">
                        <Loader2 className="mr-2 size-6 animate-spin" />
                        <p>Estimation des frais...</p>
                    </CardContent>
                </Card>
            );
        }

        if (feeError && !isLightning) {
            return (
                 <Card>
                    <CardHeader><CardTitle>Étape 5: Confirmer & Vendre</CardTitle></CardHeader>
                    <CardContent>
                        <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Échec de l'estimation</AlertTitle><AlertDescription>{feeError}</AlertDescription></Alert>
                    </CardContent>
                     <CardFooter><Button variant="outline" size="lg" onClick={handleBack} className="w-full">Retour</Button></CardFooter>
                </Card>
            );
        }
        
        if (!formData.amount || !selectedProvider || !formData.paymentDetails || (formData.network === 'on_chain' && !feeEstimation)) {
            return (
                 <Card>
                    <CardHeader><CardTitle>Étape 5: Confirmer & Vendre</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground text-center py-8">En attente des détails...</p></CardContent>
                    <CardFooter className="grid grid-cols-2 gap-4"><Button variant="outline" size="lg" onClick={handleBack}>Retour</Button><Button size="lg" disabled>Vendre</Button></CardFooter>
                </Card>
            );
        }

        const amountToSell = formData.amount;
        
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Étape 5: Confirmer & Vendre</CardTitle>
                    <CardDescription>Passez en revue les détails de votre transaction avant de confirmer la vente.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLightning ? (
                        <div className="p-4 rounded-lg bg-secondary border space-y-3 text-sm">
                            <div className="flex justify-between items-center font-semibold">
                                <span>À vendre</span>
                                <span className="font-mono text-base">{amountToSell.toLocaleString('fr-FR')} sats</span>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 rounded-lg bg-secondary border space-y-3 text-sm">
                            <div className="flex justify-between items-center"><span className="text-muted-foreground">À vendre</span><span className="font-mono font-bold text-base">{Number(amountToSell).toFixed(8)} BTC</span></div>
                            <div className="flex justify-between items-center"><span className="text-muted-foreground">Frais de réseau</span><span className="font-mono">-{feeEstimation?.network_fee_btc} BTC</span></div>
                            <div className="border-t border-dashed" />
                            <div className="flex justify-between items-center font-semibold"><span className="text-foreground">Montant de la vente</span><span className="font-mono text-base">{feeEstimation?.sendable_btc} BTC</span></div>
                        </div>
                    )}
                    
                     <Card className="bg-secondary/30">
                        <CardHeader className="pb-4"><CardTitle className="text-base">Détails de Paiement</CardTitle><CardDescription>Les fonds seront envoyés via {selectedProvider?.name} aux détails suivants:</CardDescription></CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center gap-3"><UserIcon className="size-4 text-muted-foreground" /><span className="font-semibold">{formData.paymentDetails?.full_name}</span></div>
                            <div className="flex items-center gap-3"><Phone className="size-4 text-muted-foreground" /><span className="font-semibold">{formData.paymentDetails?.phone_number}</span></div>
                            {formData.paymentDetails?.account_number && <div className="flex items-center gap-3"><Landmark className="size-4 text-muted-foreground" /><span className="font-semibold">{formData.paymentDetails.account_number}</span></div>}
                            {formData.paymentDetails?.email && <div className="flex items-center gap-3"><Mail className="size-4 text-muted-foreground" /><span className="font-semibold">{formData.paymentDetails.email}</span></div>}
                        </CardContent>
                    </Card>
                 </CardContent>
                <CardFooter className="grid grid-cols-2 gap-4">
                    <Button variant="outline" size="lg" onClick={handleBack} disabled={isSubmitting}>Annuler</Button>
                    <Button size="lg" disabled={isEstimatingFee || isSubmitting} onClick={handleSell}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        {isSubmitting ? "Vente en cours..." : "Confirmer & Vendre"}
                    </Button>
                </CardFooter>
            </Card>
        );
    };

    const steps = [
        { title: "Réseau" },
        { title: "Montant" },
        { title: "Fournisseur" },
        { title: "Paiement" },
        { title: "Confirmer" }
    ];

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <div className="space-y-2">
                {currentStep > 0 && (
                    <Button variant="ghost" onClick={handleBack} className="-ml-4" disabled={isSubmitting}>
                        <ArrowLeft className="mr-2 size-4" /> Retour
                    </Button>
                )}
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Vendre des Bitcoins</h1>
                <p className="text-muted-foreground">Suivez les étapes pour vendre vos Bitcoins en toute sécurité.</p>
            </div>
            
            {currentStep > 0 && (
                 <div className="flex w-full items-center justify-between rounded-lg border bg-card p-2 text-xs sm:text-sm">
                    {steps.map((step, index) => (
                        <React.Fragment key={index}>
                            <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:gap-2">
                                <div className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${currentStep > index ? 'bg-primary text-primary-foreground' : currentStep === index ? 'border-2 border-primary text-primary' : 'bg-muted text-muted-foreground'}`}>
                                    {currentStep > index ? <Check className="size-4" /> : index + 1}
                                </div>
                                <span className={`hidden sm:block ${currentStep >= index ? 'font-semibold' : 'text-muted-foreground'}`}>{step.title}</span>
                            </div>
                            {index < steps.length - 1 && <div className="flex-1 h-px bg-border mx-2" />}
                        </React.Fragment>
                    ))}
                </div>
            )}
            
            {currentStep === 0 && renderNetworkStep()}
            {currentStep === 1 && renderAmountStep()}
            {currentStep === 2 && renderProviderStep()}
            {currentStep === 3 && renderPaymentDetailsStep()}
            {currentStep === 4 && renderConfirmationStep()}
        </div>
    );
}
