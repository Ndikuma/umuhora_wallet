
"use client";

import { useForm } from "react-hook-form";
import { useState, useRef, useEffect, useCallback } from "react";
import jsQR from "jsqr";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowUpRight, Bitcoin, ScanLine, CheckCircle2, Loader2, Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import type { FeeEstimation } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { getFiat } from "@/lib/utils.tsx";
import { Separator } from "@/components/ui/separator";
import { useWallet } from "@/context/wallet-context";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";


const formSchema = (balance: number) => z.object({
  recipient: z
    .string()
    .min(26, { message: "L'adresse Bitcoin est trop courte." })
    .max(62, { message: "L'adresse Bitcoin est trop longue." }),
  amount: z.coerce
    .number({invalid_type_error: "Veuillez entrer un nombre valide."})
    .positive({ message: "Le montant doit être supérieur à zéro." })
    .max(balance, { message: `Solde insuffisant. Disponible : ${balance.toFixed(8)} BTC` }),
});

export type SendFormValues = z.infer<ReturnType<typeof formSchema>>;

export function SendForm() {
  const { toast } = useToast();
  const router = useRouter();
  const { balance, isLoading: isBalanceLoading, error: balanceError, refreshBalance } = useWallet();

  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [feeEstimation, setFeeEstimation] = useState<FeeEstimation | null>(null);
  const [isEstimatingFee, setIsEstimatingFee] = useState(false);
  const [feeError, setFeeError] = useState<string | null>(null);
  
  const currentBalance = balance ? parseFloat(balance.balance) : 0;

  const form = useForm<SendFormValues>({
    resolver: zodResolver(formSchema(currentBalance)),
    defaultValues: { recipient: "", amount: undefined },
    mode: "onChange",
  });

  const watchedAmount = form.watch("amount");
  const debouncedAmount = useDebounce(watchedAmount, 500);

  const estimateFee = useCallback(async (amount: number) => {
      setIsEstimatingFee(true);
      setFeeError(null);
      setFeeEstimation(null);
      try {
          const feeResponse = await api.estimateFee({ amount: String(amount) });
          setFeeEstimation(feeResponse.data);
      } catch (error: any) {
          setFeeError(error.message);
          setFeeEstimation(null);
      } finally {
          setIsEstimatingFee(false);
      }
  }, []);

  useEffect(() => {
    const isAmountValid = debouncedAmount > 0 && form.getFieldState('amount').error === undefined;
    
    if (isAmountValid) {
      estimateFee(debouncedAmount);
    } else {
      setFeeEstimation(null);
      setFeeError(null);
    }
  }, [debouncedAmount, form, estimateFee]);

  useEffect(() => {
    const newBalance = balance ? parseFloat(balance.balance) : 0;
    (form.control as any)._resolver = zodResolver(formSchema(newBalance));
     if (form.formState.isDirty) {
      form.trigger("amount");
    }
  }, [balance, form]);

   useEffect(() => {
    if (!isScanning) return;

    let stream: MediaStream | null = null;
    let animationFrameId: number;

    const scanQRCode = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code) {
            const address = code.data.replace(/^bitcoin:/, "").split("?")[0];
            form.setValue("recipient", address, { shouldValidate: true });
            toast({ title: "QR Code scanné", description: `L'adresse du destinataire a été définie.` });
            setIsScanning(false);
            return; 
          }
        }
      }
      animationFrameId = requestAnimationFrame(scanQRCode);
    };

    const startScan = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          animationFrameId = requestAnimationFrame(scanQRCode);
        }
      } catch (error) {
        setHasCameraPermission(false);
      }
    };

    startScan();

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isScanning, toast, form]);

  const handleSetMax = () => {
    if (currentBalance > 0) {
      form.setValue("amount", currentBalance, { shouldValidate: true, shouldDirty: true });
    }
  };

  const handleSetAmount = (percentage: number) => {
    const newAmount = currentBalance * percentage;
    form.setValue("amount", parseFloat(newAmount.toFixed(8)), { shouldValidate: true, shouldDirty: true });
  };

  async function onSubmit(values: SendFormValues) {
    if (!feeEstimation) {
        toast({ variant: "destructive", title: "Impossible d'envoyer", description: "Veuillez attendre la fin du calcul des frais." });
        return;
    }
    setIsLoading(true);
    try {
        const response = await api.sendTransaction({
            to_address: values.recipient,
            amount: feeEstimation.sendable_btc,
        });
        toast({
            title: (response.data as any).message || "Transaction envoyée",
            description: `Envoi de ${feeEstimation.sendable_btc} BTC.`,
        });
        refreshBalance();
        setIsSuccessDialogOpen(true);
    } catch(error: any) {
        toast({
            variant: "destructive",
            title: "Échec de la transaction",
            description: error.message,
        });
    } finally {
        setIsLoading(false);
    }
  }

  if (isBalanceLoading && !balance) {
    return (
        <div className="space-y-8">
            <div className="p-4 rounded-lg bg-secondary border">
                <p className="text-sm text-muted-foreground">Votre solde disponible</p>
                <Skeleton className="h-8 w-48 mt-1" />
            </div>
            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
            <Skeleton className="h-11 w-full" />
        </div>
    )
  }

  if (balanceError) {
    return <Alert variant="destructive"><AlertTitle>Impossible de charger le solde</AlertTitle><AlertDescription>{balanceError}</AlertDescription></Alert>
  }


  return (
    <>
      <div className="p-4 rounded-lg bg-secondary border mb-6">
        <p className="text-sm text-muted-foreground">Votre solde disponible</p>
        {isBalanceLoading ? 
            <Skeleton className="h-8 w-48 mt-1" /> :
            <p className="text-2xl font-bold font-mono">{currentBalance.toFixed(8)} BTC</p>
        }
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="recipient"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adresse du destinataire</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input placeholder="bc1q..." {...field} className="pr-10"/>
                  </FormControl>
                  <Dialog open={isScanning} onOpenChange={setIsScanning}>
                    <DialogTrigger asChild>
                       <Button variant="ghost" size="icon" type="button" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"><ScanLine className="size-5" /><span className="sr-only">Scanner QR</span></Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader className="text-center">
                        <DialogTitle>Scanner le Code QR</DialogTitle>
                        <DialogDescription>Pointez votre caméra vers le code QR de l'adresse Bitcoin.</DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative w-full aspect-square bg-muted rounded-md overflow-hidden">
                           <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                           <canvas ref={canvasRef} className="hidden" />
                           <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none"><div className="w-2/3 h-2/3 border-4 border-primary rounded-lg" /></div>
                        </div>
                        {hasCameraPermission === false && (
                          <Alert variant="destructive"><AlertTitle>Permission de caméra requise</AlertTitle><AlertDescription>Veuillez autoriser l'accès à la caméra pour utiliser cette fonctionnalité.</AlertDescription></Alert>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                 <FormLabel>Montant à Envoyer</FormLabel>
                 <div className="relative">
                    <FormControl><Input type="number" step="0.00000001" placeholder="0.00" {...field} value={field.value ?? ""} className="pl-8"/></FormControl>
                    <Bitcoin className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                 </div>
                 <div className="flex gap-2 pt-1">
                    <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => handleSetAmount(0.25)}>25%</Button>
                    <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => handleSetAmount(0.5)}>50%</Button>
                    <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => handleSetAmount(0.75)}>75%</Button>
                    <Button type="button" variant="destructive" size="sm" className="flex-1" onClick={handleSetMax}>Max</Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
           {(isEstimatingFee || feeEstimation || feeError) && (
            <div className="space-y-4 rounded-lg border bg-secondary/30 p-4">
                {isEstimatingFee ? (
                    <div className="flex items-center justify-center text-sm text-muted-foreground h-40">
                        <Loader2 className="mr-2 size-4 animate-spin" /> Estimation des frais...
                    </div>
                ) : feeError ? (
                    <div className="text-sm text-center text-destructive h-40 flex items-center justify-center">{feeError}</div>
                ) : feeEstimation ? (
                    <div className="space-y-4">
                        <div className="space-y-2">
                           <p className="text-sm text-muted-foreground">Vous enverrez</p>
                           <p className="text-2xl font-bold font-mono">{feeEstimation.sendable_btc} BTC</p>
                           <p className="text-sm text-muted-foreground font-mono">{getFiat(feeEstimation.sendable_usd, 'USD')} / {getFiat(feeEstimation.sendable_bif, 'BIF')}</p>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                           <div className="flex justify-between text-sm">
                               <p className="text-muted-foreground">Frais de réseau</p>
                               <p className="font-mono">{feeEstimation.network_fee_btc} BTC</p>
                           </div>
                           <div className="flex justify-between text-xs">
                               <p className="text-muted-foreground"></p>
                               <p className="font-mono text-muted-foreground">{getFiat(feeEstimation.network_fee_usd, 'USD')} / {getFiat(feeEstimation.network_fee_bif, 'BIF')}</p>
                           </div>
                        </div>
                        <Separator className="border-dashed" />
                        <div className="flex justify-between items-center font-semibold">
                            <span className="text-base flex items-center gap-2"><Wallet className="size-5" />Total à débiter</span>
                            <div className="text-right font-mono">
                                <p className="text-base">{watchedAmount || '0.00000000'} BTC</p>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={!form.formState.isValid || isLoading || isEstimatingFee || !feeEstimation}>
            {isLoading ? <Loader2 className="mr-2 size-5 animate-spin" /> : <ArrowUpRight className="mr-2 size-5" />}
            {isLoading ? 'Envoi en cours...' : 'Envoyer des Bitcoins'}
          </Button>
        </form>
      </Form>
      <Dialog open={isSuccessDialogOpen} onOpenChange={(open) => {
        if (!open) {
          form.reset();
          setFeeEstimation(null);
          router.push("/dashboard");
        }
        setIsSuccessDialogOpen(open);
      }}>
        <DialogContent>
          <DialogHeader className="items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20"><CheckCircle2 className="size-10 text-green-600 dark:text-green-400" /></div>
              <div className="space-y-2 pt-4">
                  <DialogTitle>Transaction envoyée</DialogTitle>
                  <DialogDescription className="text-muted-foreground">Vos Bitcoins ont été envoyés. Cela peut prendre un moment pour être confirmé.</DialogDescription>
              </div>
          </DialogHeader>
          <DialogClose asChild><Button className="w-full max-w-xs mx-auto">Terminé</Button></DialogClose>
        </DialogContent>
      </Dialog>
    </>
  );
}
