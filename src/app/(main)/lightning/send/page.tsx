
"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import jsQR from "jsqr";
import { ArrowLeft, ScanLine, Send, X, CheckCircle2, Loader2, Zap, Info, User as UserIcon, MessageSquare, Bitcoin, AlertCircle, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import api from "@/lib/api";
import { DecodedLightningRequest, LightningBalance } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { getFiat } from "@/lib/utils";

type PaymentStep = "input" | "confirm" | "success";

const StepInput = ({ onNext, setRequest, request }: { onNext: () => void, setRequest: (r: string) => void, request: string }) => {
    const { toast } = useToast();
    const [isScanning, setIsScanning] = useState(false);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!isScanning) return;

        let animationFrameId: number;
        
        const getCameraPermission = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                setHasCameraPermission(true);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                    animationFrameId = requestAnimationFrame(scanQRCode);
                }
            } catch (err) {
                console.error("Camera access denied:", err);
                setHasCameraPermission(false);
                toast({
                    variant: 'destructive',
                    title: 'Camera Access Denied',
                    description: 'Please enable camera permissions to scan a QR code.',
                });
            }
        };

        const scanQRCode = () => {
            if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
                animationFrameId = requestAnimationFrame(scanQRCode);
                return;
            }

            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");

            if (ctx) {
                canvas.height = video.videoHeight;
                canvas.width = video.videoWidth;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);

                if (code) {
                    const data = code.data.toLowerCase().replace("lightning:", "");
                    setRequest(data);
                    toast({ title: "Code scanné avec succès" });
                    setIsScanning(false); // Close dialog
                    onNext(); // Move to next step
                    return; // Stop scanning
                }
            }
            animationFrameId = requestAnimationFrame(scanQRCode);
        };

        getCameraPermission();

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isScanning, onNext, setRequest, toast]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Zap className="text-primary" />Envoyer un paiement Lightning</CardTitle>
                <CardDescription>Collez une facture, une adresse Lightning (user@domain.com) ou un LNURL.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Textarea id="invoice" placeholder="lnbc... / user@domain.com / lnurl..." value={request} onChange={(e) => setRequest(e.target.value)} required rows={5} className="font-mono" />
                <Dialog open={isScanning} onOpenChange={setIsScanning}>
                    <DialogTrigger asChild>
                        <Button type="button" variant="outline" className="w-full"><ScanLine className="mr-2 size-4" />Scanner un QR code</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader><DialogTitle>Scanner le QR</DialogTitle><DialogDescription>Pointez votre caméra vers un code QR Lightning.</DialogDescription></DialogHeader>
                        <div className="relative w-full aspect-square bg-muted rounded-md overflow-hidden">
                            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                            <canvas ref={canvasRef} className="hidden" />
                            {hasCameraPermission !== false && <div className="absolute inset-0 border-4 border-primary rounded-lg" />}
                        </div>
                        {hasCameraPermission === false && <Alert variant="destructive"><AlertTitle>Accès caméra requis</AlertTitle><AlertDescription>Veuillez autoriser l'accès à la caméra.</AlertDescription></Alert>}
                    </DialogContent>
                </Dialog>
            </CardContent>
            <CardFooter>
                <Button onClick={onNext} disabled={!request} className="w-full">Suivant</Button>
            </CardFooter>
        </Card>
    );
};

const StepConfirm = ({ request, onBack, onSuccess }: { request: string, onBack: () => void, onSuccess: () => void }) => {
    const { toast } = useToast();
    const [decoded, setDecoded] = useState<DecodedLightningRequest | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPaying, setIsPaying] = useState(false);
    
    const [lightningBalance, setLightningBalance] = useState<LightningBalance | null>(null);
    const [isBalanceLoading, setIsBalanceLoading] = useState(true);
    const [balanceError, setBalanceError] = useState<string | null>(null);

    const [amountSats, setAmountSats] = useState<number | string>("");

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            setError(null);
            setBalanceError(null);
            
            try {
                const [decodedRes, balanceRes] = await Promise.all([
                    api.decodeLightningRequest({ request }),
                    api.getLightningBalance()
                ]);
                
                setDecoded(decodedRes.data);
                if (decodedRes.data.amount_sats) {
                    setAmountSats(decodedRes.data.amount_sats);
                }

                setLightningBalance(balanceRes.data);

            } catch (err: any) {
                if (err.config?.url.includes('decode')) {
                    setError(err.message);
                    toast({ variant: "destructive", title: "Erreur de décodage", description: err.message });
                } else {
                    setBalanceError(err.message);
                }
            } finally {
                setIsLoading(false);
                setIsBalanceLoading(false);
            }
        };

        fetchInitialData();
    }, [request, toast]);
    
    const totalAmountSats = decoded?.amount_sats || Number(amountSats) || 0;

    const handlePay = async () => {
        if (!decoded || totalAmountSats <= 0) {
            toast({ variant: "destructive", title: "Montant invalide", description: "Veuillez spécifier un montant supérieur à zéro." });
            return;
        }
        setIsPaying(true);
        try {
            await api.payLightningInvoice({
                request,
                amount_sats: totalAmountSats,
             });
            toast({ title: "Paiement réussi !", description: "Votre paiement a été envoyé." });
            onSuccess();
        } catch (err: any) {
            toast({ variant: "destructive", title: "Échec du paiement", description: err.message });
        } finally {
            setIsPaying(false);
        }
    };

    const DetailRow = ({ icon: Icon, label, value, children }: { icon: React.ElementType, label: string, value?: string | number | null, children?: React.ReactNode}) => (
        <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground"><Icon className="size-5" /></div>
            <div>
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                {children || <p className="font-semibold break-all">{value || "N/A"}</p>}
            </div>
        </div>
    );
    
    const hasSufficientBalance = lightningBalance ? lightningBalance.balance >= totalAmountSats : false;
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Confirmer le Paiement</CardTitle>
                <CardDescription>Veuillez vérifier les détails de la transaction avant de confirmer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {(isLoading || isBalanceLoading) && (
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-10 w-2/3" />
                    </div>
                )}
                {error && <Alert variant="destructive"><AlertTitle>Impossible de traiter la requête</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                {balanceError && <Alert variant="destructive"><AlertTitle>Impossible de charger le solde</AlertTitle><AlertDescription>{balanceError}</AlertDescription></Alert>}
                

                {!isLoading && decoded && (
                    <div className="space-y-6">
                        <div className="space-y-4 rounded-lg border bg-secondary/50 p-4">
                           <DetailRow icon={UserIcon} label="Destination" value={decoded.payee_pubkey ? `${decoded.payee_pubkey.substring(0, 20)}...` : "Inconnue"} />
                           {decoded.memo && <DetailRow icon={MessageSquare} label="Mémo" value={decoded.memo} />}
                        </div>
                        
                         {!decoded.amount_sats ? (
                            <div className="space-y-2">
                                <Label htmlFor="amount">Montant (sats)</Label>
                                <Input id="amount" type="number" placeholder="Entrez le montant en sats" value={amountSats} onChange={(e) => setAmountSats(e.target.value)} required disabled={isPaying} />
                            </div>
                        ) : (
                             <div className="space-y-4 rounded-lg border p-4">
                                <DetailRow icon={Bitcoin} label="Montant">
                                    <div className="font-semibold text-lg">{decoded.amount_sats} sats</div>
                                </DetailRow>
                                {(decoded.amount_usd || decoded.amount_bif) && (
                                     <div className="text-sm text-muted-foreground">
                                         {decoded.amount_usd && getFiat(decoded.amount_usd, 'USD')}
                                         {decoded.amount_usd && decoded.amount_bif && ' / '}
                                         {decoded.amount_bif && getFiat(decoded.amount_bif, 'BIF')}
                                     </div>
                                )}
                            </div>
                        )}
                        
                        {!isBalanceLoading && lightningBalance && (
                            <DetailRow icon={Wallet} label="Votre solde Lightning">
                                <p className="font-semibold">{lightningBalance.balance} sats</p>
                            </DetailRow>
                        )}

                        {totalAmountSats > 0 && !hasSufficientBalance && !isBalanceLoading && (
                             <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Solde insuffisant</AlertTitle>
                                <AlertDescription>Vous n'avez pas assez de fonds pour effectuer ce paiement.</AlertDescription>
                            </Alert>
                        )}
                    </div>
                )}
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={onBack} disabled={isPaying}>Retour</Button>
                <Button onClick={handlePay} disabled={isLoading || isBalanceLoading || !!error || isPaying || !hasSufficientBalance || totalAmountSats <= 0}>
                    {isPaying ? <><Loader2 className="mr-2 size-4 animate-spin"/>Envoi...</> : "Payer"}
                </Button>
            </CardFooter>
        </Card>
    );
};

const StepSuccess = () => (
    <Card className="p-8 text-center">
        <CheckCircle2 className="mx-auto size-20 text-green-500" />
        <CardHeader>
            <CardTitle className="text-2xl">Paiement Envoyé</CardTitle>
            <CardDescription>Votre transaction a été complétée avec succès.</CardDescription>
        </CardHeader>
        <CardContent>
            <Button asChild className="w-full">
                <Link href="/lightning">Retour au portefeuille Lightning</Link>
            </Button>
        </CardContent>
    </Card>
);

export default function SendPaymentPage() {
    const [step, setStep] = useState<PaymentStep>("input");
    const [request, setRequest] = useState("");

    const handleNext = () => setStep("confirm");
    const handleBack = () => setStep("input");
    const handleSuccess = () => setStep("success");

    return (
        <div className="mx-auto max-w-md space-y-6">
            {step !== "success" && (
                <Button variant="ghost" asChild className="-ml-4">
                    <Link href="/lightning"><ArrowLeft className="mr-2 size-4" />Retour</Link>
                </Button>
            )}

            {step === 'input' && <StepInput onNext={handleNext} setRequest={setRequest} request={request} />}
            {step === 'confirm' && <StepConfirm request={request} onBack={handleBack} onSuccess={handleSuccess} />}
            {step === 'success' && <StepSuccess />}
        </div>
    );
}
