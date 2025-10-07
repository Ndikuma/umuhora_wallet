
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSettings } from "@/context/settings-context";
import api from "@/lib/api";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CopyButton } from "@/components/copy-button";
import { ShieldAlert, Loader2, Moon, Sun, Laptop, KeyRound, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useUser } from "@/hooks/use-user";

const restoreFormSchema = z.object({
  data: z.string().min(20, { message: "Les données de restauration semblent trop courtes." })
    .refine(value => {
        const trimmed = value.trim();
        const wordCount = trimmed.split(/\s+/).length;
        const isMnemonic = wordCount === 12 || wordCount === 24;
        const isWif = (trimmed.startsWith('L') || trimmed.startsWith('K') || trimmed.startsWith('5'));
        const isExtendedKey = /^(xpub|ypub|zpub|tpub|upub|vpub)/.test(trimmed);
        
        return isMnemonic || isWif || isExtendedKey;
    }, "Veuillez entrer une phrase mnémonique valide de 12/24 mots ou une clé privée WIF/étendue."),
});

const passwordChangeSchema = z.object({
  current_password: z.string().min(1, "Le mot de passe actuel est requis."),
  new_password: z.string().min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères."),
});

const otpSchema = z.object({
  otp: z.string().length(6, "L'OTP doit contenir 6 caractères."),
});

export function SettingsClient() {
  const { toast } = useToast();
  const { user, refetchUser } = useUser();
  const { settings, setCurrency, setDisplayUnit, setTheme } = useSettings();
  
  const [wif, setWif] = useState<string | null>(null);
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false);
  
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // 2FA State
  const [is2FASetupOpen, setIs2FASetupOpen] = useState(false);
  const [is2FADisableOpen, setIs2FADisableOpen] = useState(false);
  const [is2FALoading, setIs2FALoading] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState<{ qr_code: string; secret: string } | null>(null);

  const restoreForm = useForm<z.infer<typeof restoreFormSchema>>({ resolver: zodResolver(restoreFormSchema), defaultValues: { data: "" } });
  const passwordForm = useForm<z.infer<typeof passwordChangeSchema>>({ resolver: zodResolver(passwordChangeSchema), defaultValues: { current_password: "", new_password: "" } });
  const otpForm = useForm<z.infer<typeof otpSchema>>({ resolver: zodResolver(otpSchema), defaultValues: { otp: "" } });

  const handleBackup = async () => {
    setIsBackupLoading(true);
    setIsBackupDialogOpen(true);
    try {
        const response = await api.backupWallet();
        setWif(response.data.wif);
    } catch(error: any) {
        toast({ variant: "destructive", title: "Échec de la sauvegarde", description: error.message });
        setIsBackupDialogOpen(false);
    } finally {
        setIsBackupLoading(false);
    }
  };

  const closeBackupDialog = () => { setIsBackupDialogOpen(false); setWif(null); }

  const handleRestoreSubmit = async (values: z.infer<typeof restoreFormSchema>) => {
    setIsRestoring(true);
    try {
      await api.restoreWallet(values.data);
      toast({ title: "Restauration du portefeuille lancée", description: "Votre portefeuille est en cours de restauration. L'application va se rafraîchir." });
      setTimeout(() => window.location.reload(), 2000);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Échec de la restauration", description: error.message });
    } finally {
      setIsRestoring(false);
      setIsRestoreDialogOpen(false);
    }
  }

  const handlePasswordChange = async (values: z.infer<typeof passwordChangeSchema>) => {
    setIsChangingPassword(true);
    try {
      await api.changePassword(values);
      toast({ title: "Mot de passe modifié", description: "Votre mot de passe a été mis à jour avec succès." });
      passwordForm.reset();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Échec de la modification du mot de passe", description: error.message });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handle2FAToggle = async (enabled: boolean) => {
    if (enabled) {
      setIs2FALoading(true);
      setIs2FASetupOpen(true);
      try {
        const response = await api.setup2FA();
        setTwoFactorSecret(response.data);
      } catch (error: any) {
        toast({ variant: "destructive", title: "Erreur 2FA", description: error.message });
        setIs2FASetupOpen(false);
      } finally {
        setIs2FALoading(false);
      }
    } else {
      setIs2FADisableOpen(true);
    }
  };

  const handleEnable2FA = async (values: z.infer<typeof otpSchema>) => {
    setIs2FALoading(true);
    try {
      await api.enable2FA(values.otp);
      toast({ title: "2FA activé", description: "L'authentification à deux facteurs est maintenant activée pour votre compte." });
      refetchUser();
      setIs2FASetupOpen(false);
      otpForm.reset();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Échec de l'activation 2FA", description: error.message });
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleDisable2FA = async (values: z.infer<typeof otpSchema>) => {
    setIs2FALoading(true);
    try {
      await api.disable2FA(values.otp);
      toast({ title: "2FA désactivé", description: "L'authentification à deux facteurs est maintenant désactivée." });
      refetchUser();
      setIs2FADisableOpen(false);
      otpForm.reset();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Échec de la désactivation 2FA", description: error.message });
    } finally {
      setIs2FALoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Préférences d'Affichage</CardTitle>
          <CardDescription>
            Choisissez comment les valeurs et l'apparence sont affichées dans l'application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
           <div>
            <Label className="font-medium">Thème d'affichage</Label>
            <p className="text-sm text-muted-foreground pt-1">Personnalisez l'apparence de l'application.</p>
            <RadioGroup
              value={settings.theme}
              onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}
              className="mt-3 grid grid-cols-3 gap-4"
            >
              <RadioGroupItem value="light" id="light" className="sr-only peer" />
              <Label htmlFor="light" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                <Sun className="mb-2 size-5" />
                Clair
              </Label>
              <RadioGroupItem value="dark" id="dark" className="sr-only peer" />
              <Label htmlFor="dark" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                <Moon className="mb-2 size-5" />
                Sombre
              </Label>
              <RadioGroupItem value="system" id="system" className="sr-only peer" />
              <Label htmlFor="system" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                <Laptop className="mb-2 size-5" />
                Système
              </Label>
            </RadioGroup>
          </div>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <Label htmlFor="currency">Devise</Label>
              <p className="text-sm text-muted-foreground">
                Définissez votre devise fiat préférée.
              </p>
            </div>
            <Select
              value={settings.currency}
              onValueChange={(value) => setCurrency(value as "usd" | "eur" | "jpy" | "bif")}
            >
              <SelectTrigger id="currency" className="w-full sm:w-48">
                <SelectValue placeholder="Choisir la devise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usd">USD</SelectItem>
                <SelectItem value="eur">EUR</SelectItem>
                <SelectItem value="jpy">JPY</SelectItem>
                <SelectItem value="bif">BIF</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="font-medium">Unité d'Affichage Principale</Label>
            <p className="text-sm text-muted-foreground pt-1">Sélectionnez l'unité principale pour afficher votre solde.</p>
            <RadioGroup
              value={settings.displayUnit}
              onValueChange={(value) => setDisplayUnit(value as "btc" | "sats" | "usd" | "bif")}
              className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4"
            >
              <RadioGroupItem value="btc" id="btc" className="sr-only peer" />
              <Label htmlFor="btc" className="flex h-16 flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 text-center text-sm hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer sm:h-auto sm:py-4 sm:text-base">BTC</Label>
              <RadioGroupItem value="sats" id="sats" className="sr-only peer" />
              <Label htmlFor="sats" className="flex h-16 flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 text-center text-sm hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer sm:h-auto sm:py-4 sm:text-base">Sats</Label>
              <RadioGroupItem value="usd" id="usd" className="sr-only peer" />
              <Label htmlFor="usd" className="flex h-16 flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 text-center text-sm hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer sm:h-auto sm:py-4 sm:text-base">USD</Label>
              <RadioGroupItem value="bif" id="bif" className="sr-only peer" />
              <Label htmlFor="bif" className="flex h-16 flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 text-center text-sm hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer sm:h-auto sm:py-4 sm:text-base">BIF</Label>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sécurité & Données</CardTitle>
          <CardDescription>Gérez la sécurité et les données du portefeuille.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="flex flex-col items-start justify-between gap-4 rounded-lg border p-4 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <p className="font-semibold">Authentification à deux facteurs (2FA)</p>
              <p className="text-sm text-muted-foreground">Ajoutez une couche de sécurité supplémentaire à votre compte lors de la connexion.</p>
            </div>
            <Switch
              checked={user?.is_2fa_enabled}
              onCheckedChange={handle2FAToggle}
              disabled={is2FALoading}
              aria-label="Toggle Two-Factor Authentication"
            />
          </div>
          <div className="space-y-4 rounded-lg border p-4">
             <div className="space-y-1">
              <p className="font-semibold">Changer le mot de passe</p>
              <p className="text-sm text-muted-foreground">Mettez à jour le mot de passe de votre compte.</p>
            </div>
             <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="current_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mot de passe actuel</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input type={showCurrentPassword ? "text" : "password"} {...field} className="pr-10" />
                          </FormControl>
                          <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                            {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="new_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nouveau mot de passe</FormLabel>
                        <div className="relative">
                           <FormControl>
                              <Input type={showNewPassword ? "text" : "password"} {...field} className="pr-10" />
                           </FormControl>
                           <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                             {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                           </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isChangingPassword}>
                    {isChangingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <KeyRound className="mr-2 h-4 w-4"/>}
                    Changer le mot de passe
                  </Button>
                </form>
             </Form>
          </div>
          <div className="flex flex-col items-start justify-between gap-4 rounded-lg border p-4 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <p className="font-semibold">Sauvegarder le Portefeuille</p>
              <p className="text-sm text-muted-foreground">Affichez votre clé privée WIF. Sauvegardez-la dans un endroit sûr et hors ligne.</p>
            </div>
            <Button onClick={handleBackup} className="w-full sm:w-auto" disabled={isBackupLoading}>
              {isBackupLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sauvegarder maintenant
            </Button>
          </div>
          <div className="flex flex-col items-start justify-between gap-4 rounded-lg border p-4 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <p className="font-semibold">Restaurer le Portefeuille</p>
              <p className="text-sm text-muted-foreground">Restaurez à partir d'une phrase mnémonique ou d'une clé privée WIF.</p>
            </div>
            <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">Restaurer</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Restaurer Votre Portefeuille</AlertDialogTitle>
                        <AlertDialogDescription>
                            Entrez votre phrase mnémonique de 12/24 mots ou votre clé privée WIF. Cela remplacera le portefeuille actuel de ce compte.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Form {...restoreForm}>
                        <form onSubmit={restoreForm.handleSubmit(handleRestoreSubmit)} className="space-y-4">
                            <FormField
                                control={restoreForm.control}
                                name="data"
                                render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Données de Restauration</FormLabel>
                                      <FormControl>
                                        <Textarea
                                          placeholder="Entrez votre phrase mnémonique ou clé WIF..."
                                          className="resize-none"
                                          rows={4}
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <AlertDialogFooter className="pt-2">
                                <Button type="button" variant="ghost" onClick={() => setIsRestoreDialogOpen(false)} disabled={isRestoring}>Annuler</Button>
                                <Button type="submit" disabled={isRestoring}>
                                    {isRestoring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    {isRestoring ? "Restauration..." : "Restaurer le portefeuille"}
                                </Button>
                            </AlertDialogFooter>
                        </form>
                    </Form>
                </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Backup Dialog */}
      <AlertDialog open={isBackupDialogOpen} onOpenChange={setIsBackupDialogOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Votre Clé Privée de Portefeuille (WIF)</AlertDialogTitle>
                  <AlertDialogDescription>
                      C'est votre clé privée. Elle donne un accès complet à vos fonds.
                      Gardez-la secrète et sauvegardez-la dans un endroit sûr et hors ligne.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-4">
                <Alert variant="destructive">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Avertissement de Sécurité</AlertTitle>
                    <AlertDescription>
                        Ne partagez jamais cette clé avec qui que ce soit. Toute personne ayant cette clé peut voler vos fonds.
                    </AlertDescription>
                </Alert>
                <div className="rounded-lg border bg-secondary p-4 text-center font-code break-all">
                    {isBackupLoading ? <Skeleton className="h-5 w-4/5 mx-auto" /> : wif}
                </div>
              </div>
              <AlertDialogFooter className="pt-4 sm:gap-2 gap-4 flex-col sm:flex-row">
                  <Button variant="outline" onClick={closeBackupDialog} className="mt-0 w-full sm:w-auto">Fermer</Button>
                  <CopyButton textToCopy={wif || ''} disabled={isBackupLoading || !wif} toastMessage="Clé privée copiée" onCopy={closeBackupDialog} className="w-full sm:w-auto">
                    Copier la clé & Fermer
                   </CopyButton>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      {/* 2FA Enable Dialog */}
      <AlertDialog open={is2FASetupOpen} onOpenChange={setIs2FASetupOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activer l'Authentification à Deux Facteurs</AlertDialogTitle>
            <AlertDialogDescription>
              Scannez ce QR code avec votre application d'authentification (ex: Google Authenticator, Authy), puis entrez le code à 6 chiffres pour confirmer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col items-center gap-6">
            {twoFactorSecret?.qr_code ? (
              <Image src={twoFactorSecret.qr_code} alt="QR Code 2FA" width={200} height={200} data-ai-hint="qr code" />
            ) : (
              <Skeleton className="h-48 w-48" />
            )}
            <Form {...otpForm}>
              <form onSubmit={otpForm.handleSubmit(handleEnable2FA)} className="w-full space-y-4">
                <FormField
                  control={otpForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code de Vérification</FormLabel>
                      <FormControl>
                        <Input placeholder="123456" {...field} autoComplete="one-time-code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <AlertDialogFooter className="pt-2">
                    <Button type="button" variant="ghost" onClick={() => setIs2FASetupOpen(false)} disabled={is2FALoading}>Annuler</Button>
                    <Button type="submit" disabled={is2FALoading}>
                        {is2FALoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ShieldCheck className="mr-2 size-4"/>}
                        {is2FALoading ? "Vérification..." : "Activer"}
                    </Button>
                </AlertDialogFooter>
              </form>
            </Form>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* 2FA Disable Dialog */}
      <AlertDialog open={is2FADisableOpen} onOpenChange={setIs2FADisableOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Désactiver l'Authentification à Deux Facteurs</AlertDialogTitle>
            <AlertDialogDescription>
              Pour confirmer, veuillez entrer un code de votre application d'authentification.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Form {...otpForm}>
            <form onSubmit={otpForm.handleSubmit(handleDisable2FA)} className="w-full space-y-4 pt-4">
              <FormField
                control={otpForm.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code de Vérification</FormLabel>
                    <FormControl>
                      <Input placeholder="123456" {...field} autoComplete="one-time-code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <AlertDialogFooter className="pt-2">
                  <Button type="button" variant="ghost" onClick={() => setIs2FADisableOpen(false)} disabled={is2FALoading}>Annuler</Button>
                  <Button type="submit" variant="destructive" disabled={is2FALoading}>
                      {is2FALoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                      {is2FALoading ? "Désactivation..." : "Désactiver"}
                  </Button>
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
