
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import api from '@/lib/api';
import { useState, useEffect } from "react";
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BitcoinIcon } from "@/components/icons";


const formSchema = z.object({
  otp: z.string().min(6, { message: "L'OTP doit contenir 6 caractères." }).max(6),
  password: z.string().min(8, { message: "Le mot de passe doit contenir au moins 8 caractères." }),
});

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Adresse e-mail non trouvée. Veuillez recommencer le processus.",
      });
      router.push("/forgot-password");
    }
  }, [searchParams, router, toast]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { otp: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!email) return;
    setIsLoading(true);
    try {
      await api.confirmReset({ email, otp: values.otp, password: values.password });
      toast({
        title: "Mot de passe réinitialisé",
        description: "Votre mot de passe a été mis à jour. Vous pouvez maintenant vous connecter.",
      });
      router.push("/login");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Échec de la réinitialisation",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (!email) {
    return (
       <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <Link href="/" className="mb-8 flex items-center gap-2">
        <BitcoinIcon className="size-8 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Umuhora Tech Wallet</h1>
      </Link>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Réinitialiser le mot de passe</CardTitle>
          <CardDescription>
            Entrez le code OTP de votre e-mail et votre nouveau mot de passe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
               <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code OTP</FormLabel>
                    <FormControl>
                      <Input placeholder="123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nouveau mot de passe</FormLabel>
                     <div className="relative">
                        <FormControl>
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="********" 
                            {...field}
                            className="pr-10"
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Réinitialiser le mot de passe
              </Button>
            </form>
          </Form>
           <div className="mt-4 text-center text-sm">
            <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline flex items-center justify-center">
              <ArrowLeft className="mr-2 size-4" />
              Retour à la connexion
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
