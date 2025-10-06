
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/lib/api";
import type { Order, BuyProvider } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  CircleCheck,
  CircleX,
  Clock,
  Landmark,
  FileImage,
  Loader2,
  ReceiptText,
  Copy,
  ExternalLink,
  Bitcoin,
  AlertTriangle,
  Banknote,
  User as UserIcon,
  Phone,
  Mail,
  Hourglass,
  AlertCircle,
  Zap,
} from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CopyButton } from "@/components/copy-button";
import { shortenText, getStatusIcon, getStatusVariant } from "@/lib/utils";

const paymentProofSchema = z.object({
    payment_proof_ref: z.string().min(4, "Veuillez entrer une référence valide."),
    note: z.string().optional(),
    payment_proof_image: z.any().optional(),
});

type PaymentProofFormValues = z.infer<typeof paymentProofSchema>;


function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
}

const PaymentInfoDisplay = ({ provider }: { provider: BuyProvider }) => {
    if (!provider.payment_info) return null;

    const accountDetails = provider.payment_info.account;
    const instructions = provider.payment_info.instructions;

    const formatLabel = (key: string) => {
        return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <Card className="bg-secondary/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Landmark className="size-5 text-primary" />Instructions de Paiement</CardTitle>
                {provider.payment_info.method && <CardDescription>{provider.payment_info.method}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-4">
                 {accountDetails && Object.keys(accountDetails).length > 0 && (
                     <div className="space-y-3 rounded-lg border bg-background/50 p-4">
                        <h4 className="font-semibold">Détails du compte</h4>
                        {Object.entries(accountDetails).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">{formatLabel(key)}</span>
                                <div className="flex items-center gap-2 font-mono">
                                    <span>{value}</span>
                                    <CopyButton textToCopy={value as string} size="icon" variant="ghost" className="h-7 w-7" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {instructions && (
                    <div className="space-y-2">
                         <h4 className="font-semibold">Instructions</h4>
                        {Array.isArray(instructions) ? (
                            <ol className="list-decimal list-inside text-muted-foreground space-y-1 text-sm">
                                {instructions.map((step, i) => <li key={i}>{step}</li>)}
                            </ol>
                        ) : (
                            <p className="text-muted-foreground text-sm">{instructions}</p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function PaymentProofForm({ order, onSuccessfulSubmit }: { order: Order, onSuccessfulSubmit: (updatedOrder: Order) => void }) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const form = useForm<PaymentProofFormValues>({
        resolver: zodResolver(paymentProofSchema),
        defaultValues: {
            payment_proof_ref: "",
            note: "",
        },
    });
    
    const fileRef = form.register("payment_proof_image");

    const onSubmit = async (values: PaymentProofFormValues) => {
        setIsSubmitting(true);
        try {
            let image_base64: string | null = null;
            if (values.payment_proof_image && values.payment_proof_image.length > 0) {
                const file = values.payment_proof_image[0];
                image_base64 = await fileToBase64(file);
            }

            const payload = {
                payment_proof: { 
                    tx_id: values.payment_proof_ref,
                    image_base64: image_base64,
                },
                note: values.note,
                status: 'awaiting_confirmation' as const,
            };

            const response = await api.updateOrder(order.id, payload);
            toast({ title: "Preuve de paiement soumise", description: "Votre preuve a été soumise pour confirmation." });
            onSuccessfulSubmit(response.data);
        } catch (err: any) {
            toast({ variant: "destructive", title: "Échec de la soumission", description: err.message || "Impossible de soumettre votre preuve." });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Soumettre la preuve de paiement</CardTitle>
                <CardDescription>
                    Votre commande est en attente. Veuillez finaliser le paiement en utilisant les instructions ci-dessous, puis soumettez la preuve ici.
                </CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-6">
                        {order.provider && <PaymentInfoDisplay provider={order.provider} />}

                        <FormField
                            control={form.control}
                            name="payment_proof_ref"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Référence de paiement / ID de transaction</FormLabel>
                                    <FormControl>
                                        <Input placeholder="ex: ID de transaction Mobile Money" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="note"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Note (Optionnel)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Ajoutez des informations supplémentaires ici..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <div className="space-y-2">
                            <Label htmlFor="payment_proof_image">Télécharger une image (Optionnel)</Label>
                            <Input 
                                id="payment_proof_image" 
                                type="file" 
                                accept="image/*"
                                {...fileRef}
                                className="text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:py-2 file:px-4 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20" 
                             />
                         </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin"/> : <CircleCheck className="mr-2 size-4" />}
                            {isSubmitting ? "Envoi..." : "Confirmer le Paiement"}
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}

const PayoutDetailItem = ({ icon, label, value }: { icon: React.ElementType, label: string, value?: string | number | null }) => {
    if (!value) return null;
    const Icon = icon;
    return (
        <div className="flex items-center gap-3">
            <Icon className="size-4 text-muted-foreground" />
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-semibold">{value}</p>
            </div>
        </div>
    )
}

function LightningBuyOrderDetails({ order }: { order: Order }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Zap className="size-5 text-primary" />Payer la facture Lightning</CardTitle>
                <CardDescription>Scannez ce code QR ou copiez la facture pour déposer {order.ln_amount_sats} sats dans votre portefeuille.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
                {order.payment_proof?.qr_code ? (
                     <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <Image
                            src={order.payment_proof.qr_code}
                            alt="Code QR de la facture Lightning"
                            width={256}
                            height={256}
                            className="rounded-md"
                            data-ai-hint="qr code"
                        />
                     </div>
                ) : <Skeleton className="h-64 w-64" />}

                {order.ln_invoice && (
                     <div className="w-full space-y-4">
                        <div className="break-all rounded-md border bg-secondary p-3 font-mono text-sm text-muted-foreground">
                            {order.ln_invoice}
                        </div>
                         <CopyButton textToCopy={order.ln_invoice} toastMessage="Facture copiée dans le presse-papiers">
                            Copier la facture
                        </CopyButton>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                 <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>En attente du paiement</AlertTitle>
                    <AlertDescription>
                        Cette page se mettra à jour automatiquement une fois le paiement reçu.
                    </AlertDescription>
                </Alert>
            </CardFooter>
        </Card>
    )
}

function LightningSellOrderDetails({ order, onOrderUpdate }: { order: Order, onOrderUpdate: (order: Order) => void }) {
    const [isPaying, setIsPaying] = useState(false);
    const { toast } = useToast();

    const handlePay = async () => {
        if (!order.ln_invoice) return;
        setIsPaying(true);
        try {
            const response = await api.payLightningInvoice({ request: order.ln_invoice });
            onOrderUpdate(response.data.order);
            toast({ title: "Paiement réussi", description: `Vous avez payé ${response.data.amount_sats} sats.` });
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Échec du paiement', description: err.message });
        } finally {
            setIsPaying(false);
        }
    }

    return (
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Zap className="size-5 text-primary" />Confirmer le paiement Lightning</CardTitle>
                <CardDescription>Veuillez vérifier les détails de la facture avant de confirmer le paiement depuis votre portefeuille.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Détails de la facture</AlertTitle>
                    <AlertDescription>
                         <p>Montant: <strong>{order.ln_amount_sats} sats</strong></p>
                        {order.note && <p>Memo: {order.note}</p>}
                    </AlertDescription>
                </Alert>
                <div className="break-all rounded-md border bg-secondary p-3 font-mono text-sm text-muted-foreground">
                    {order.ln_invoice}
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={handlePay} disabled={isPaying}>
                    {isPaying ? <Loader2 className="mr-2 size-4 animate-spin"/> : <Zap className="mr-2 size-4" />}
                    {isPaying ? "Paiement en cours..." : `Payer ${order.ln_amount_sats} sats`}
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function OrderDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const orderId = Number(params.orderId);

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrder = useCallback(async () => {
        if (isNaN(orderId)) {
            setError("L'ID de la commande est invalide.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await api.getOrder(orderId);
            setOrder(response.data);
        } catch (err: any) {
            setError(err.message || "Impossible de charger les détails de la commande.");
        } finally {
            setLoading(false);
        }
    }, [orderId]);
    
     useEffect(() => {
        fetchOrder();
    }, [fetchOrder]);


    const handleSuccessfulSubmit = (updatedOrder: Order) => {
        setOrder(updatedOrder);
    }
    
    if (loading) {
        return (
            <div className="mx-auto max-w-2xl space-y-4">
                <Skeleton className="h-8 w-32" />
                <Card><CardHeader><Skeleton className="h-8 w-48" /><Skeleton className="h-5 w-64" /></CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (error) {
        return (
            <div className="mx-auto max-w-2xl">
                <Button variant="ghost" asChild className="-ml-4"><Link href="/orders"><ArrowLeft className="mr-2 size-4" />Retour aux commandes</Link></Button>
                <Card className="mt-4 flex h-48 items-center justify-center">
                    <div className="text-center text-destructive">
                        <AlertCircle className="mx-auto h-8 w-8" />
                        <p className="mt-2 font-semibold">Erreur de chargement de la commande</p>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">{error}</p>
                        <Button onClick={fetchOrder} variant="secondary" className="mt-4">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Réessayer
                        </Button>
                    </div>
                </Card>
            </div>
        )
    }

    if (!order) return null;

    const payoutDetails = order.payout_data;
    const isLightning = order.payment_method === 'lightning';
    
    return (
        <div className="mx-auto max-w-2xl space-y-6">
             <Button variant="ghost" asChild className="-ml-4">
                <Link href="/orders">
                <ArrowLeft className="mr-2 size-4" />
                Retour aux commandes
                </Link>
            </Button>
            
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                           {getStatusIcon(order.status)}
                           <div>
                                <CardTitle className="text-2xl capitalize">
                                    Commande d'{order.direction === 'buy' ? 'Achat' : 'Vente'} #{order.id}
                                </CardTitle>
                                <CardDescription>
                                    <div className="flex items-center gap-2">
                                        <span>le {new Date(order.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric'})}</span>
                                        <Badge variant="outline" className="capitalize">{order.payment_method.replace('_', '-')}</Badge>
                                    </div>
                                </CardDescription>
                           </div>
                        </div>
                        <Badge variant={getStatusVariant(order.status)} className="capitalize text-base py-1 px-3">{order.status.replace('_', ' ')}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    { isLightning ? (
                         <div className="space-y-2 rounded-lg border bg-secondary/30 p-4">
                            <div className="flex justify-between font-bold text-base"><span >Montant</span><span>{order.ln_amount_sats} sats</span></div>
                        </div>
                    ) : (
                        <div className="space-y-2 rounded-lg border bg-secondary/30 p-4">
                            <div className="flex justify-between"><span className="text-muted-foreground">Montant</span><span>{order.amount} {order.amount_currency}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Frais</span><span>{order.fee} {order.amount_currency}</span></div>
                            <Separator />
                            <div className="flex justify-between font-bold text-base"><span >Total</span><span>{order.total_amount} {order.amount_currency}</span></div>
                        </div>
                    )}
                    
                     {order.provider && (
                        <div className="space-y-2 rounded-lg border bg-secondary/30 p-4">
                             <div className="flex justify-between"><span className="text-muted-foreground">Fournisseur</span><span className="font-semibold">{order.provider.name}</span></div>
                             {order.provider.payment_info?.method && <div className="flex justify-between"><span className="text-muted-foreground">Méthode de paiement</span><span className="font-semibold">{order.provider.payment_info.method}</span></div>}
                        </div>
                     )}
                </CardContent>
                 <CardFooter className="justify-end">
                    <Button variant="destructive">
                        <AlertTriangle className="mr-2 size-4" />
                        Signaler un problème
                    </Button>
                </CardFooter>
            </Card>

            {order.direction === 'sell' && order.payment_method === 'on_chain' && payoutDetails && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Banknote className="size-5 text-primary" />
                           Informations de paiement
                        </CardTitle>
                        <CardDescription>Vos fonds seront envoyés à ce compte :</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        <PayoutDetailItem icon={UserIcon} label="Nom complet" value={payoutDetails.full_name} />
                        <PayoutDetailItem icon={Phone} label="Numéro de téléphone" value={payoutDetails.phone_number} />
                        <PayoutDetailItem icon={Landmark} label="Numéro de compte" value={payoutDetails.account_number} />
                        <PayoutDetailItem icon={Mail} label="E-mail" value={payoutDetails.email} />
                    </CardContent>
                </Card>
            )}

            {order.status === 'completed' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Bitcoin className="size-5 text-primary" />
                           {order.direction === 'buy' ? 'Bitcoin Reçu' : 'Bitcoin Envoyé'}
                        </CardTitle>
                        <CardDescription>Cette commande est terminée.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         {isLightning ? (
                            <>
                                <div className="space-y-1">
                                    <Label>Montant</Label>
                                    <div className="font-semibold font-mono text-lg">{order.ln_amount_sats} sats</div>
                                </div>
                                <div className="space-y-1">
                                    <Label>Hash de Paiement</Label>
                                    <div className="flex items-center gap-2">
                                        <p className="font-mono text-muted-foreground">{shortenText(order.ln_payment_hash, 12, 12)}</p>
                                        <CopyButton textToCopy={order.ln_payment_hash || ''} size="icon" variant="ghost" className="h-7 w-7"/>
                                    </div>
                                </div>
                            </>
                         ) : (
                             <>
                                <div className="space-y-1">
                                    <Label>Montant</Label>
                                    <div className="font-semibold font-mono text-lg">{order.btc_amount} BTC</div>
                                </div>
                                <div className="space-y-1">
                                    <Label>Adresse de transaction</Label>
                                    <div className="flex items-center gap-2">
                                        <p className="font-mono text-muted-foreground">{shortenText(order.btc_address, 12, 12)}</p>
                                        <CopyButton textToCopy={order.btc_address || ''} size="icon" variant="ghost" className="h-7 w-7"/>
                                    </div>
                                </div>
                                {order.btc_txid && (
                                <>
                                    <div className="space-y-1">
                                        <Label>ID de transaction (TxID)</Label>
                                        <div className="flex items-center gap-2">
                                            <p className="font-mono text-muted-foreground">{shortenText(order.btc_txid, 12, 12)}</p>
                                            <CopyButton textToCopy={order.btc_txid || ''} size="icon" variant="ghost" className="h-7 w-7"/>
                                        </div>
                                    </div>
                                    {order.provider?.explorer_url && (
                                    <Button variant="outline" asChild>
                                        <Link href={`${order.provider.explorer_url}/tx/${order.btc_txid}`} target="_blank">
                                            Voir sur l'explorateur de blocs <ExternalLink className="ml-2 size-4" />
                                        </Link>
                                    </Button>
                                    )}
                                </>
                                )}
                            </>
                         )}
                    </CardContent>
                </Card>
            )}

            {order.direction === 'buy' && order.payment_method === 'on_chain' && order.status === 'pending' && <PaymentProofForm order={order} onSuccessfulSubmit={handleSuccessfulSubmit} />}

            {order.direction === 'buy' && isLightning && order.status === 'pending' && <PaymentProofForm order={order} onSuccessfulSubmit={handleSuccessfulSubmit} />}

            {order.direction === 'sell' && isLightning && order.status === 'pending' && <LightningSellOrderDetails order={order} onOrderUpdate={setOrder} />}

            {order.status === 'awaiting_confirmation' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Hourglass className="size-5 text-primary" />En attente de confirmation</CardTitle>
                        <CardDescription>Votre preuve de paiement a été soumise et est en cours de vérification par le fournisseur.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Vous serez notifié lorsque votre paiement sera confirmé et que les Bitcoins seront envoyés à votre portefeuille. Cela peut prendre un certain temps.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
