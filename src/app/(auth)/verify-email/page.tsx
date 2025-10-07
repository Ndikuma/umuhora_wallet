
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
import { Loader2 } from "lucide-react";
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
});

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Adresse e-mail non trouvée. Veuillez vous inscrire à nouveau.",
      });
      router.push("/register");
    }
  }, [searchParams, router, toast]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { otp: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!email) return;

    setIsLoading(true);
    try {
      const response = await api.verifyEmail({ email, otp: values.otp });
      const token = response.data.token;

      localStorage.setItem('authToken', token);
      document.cookie = `authToken=${token}; path=/; max-age=604800; samesite=lax`;

      toast({
        title: "Vérification réussie",
        description: "Votre compte est maintenant actif.",
      });
      router.push("/create-or-restore");
      router.refresh();

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Échec de la vérification",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleResendOtp = async () => {
    if (!email) return;
    setIsResending(true);
    try {
        await api.resendOtp(email);
        toast({
            title: "Code renvoyé",
            description: "Un nouveau code de vérification a été envoyé à votre e-mail."
        });
    } catch (error: any) {
         toast({
            variant: "destructive",
            title: "Échec de l'envoi",
            description: error.message,
        });
    } finally {
        setIsResending(false);
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
          <CardTitle>Vérifiez Votre E-mail</CardTitle>
          <CardDescription>
            Un code de vérification a été envoyé à <strong>{email}</strong>. Veuillez le saisir ci-dessous.
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
                    <FormLabel>Code de Vérification (OTP)</FormLabel>
                    <FormControl>
                      <Input placeholder="123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Vérifier & Activer le Compte
              </Button>
            </form>
          </Form>
           <div className="mt-4 text-center text-sm">
            Vous n'avez pas reçu de code ?{" "}
            <Button variant="link" onClick={handleResendOtp} disabled={isResending} className="p-0 h-auto">
              {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Renvoyer le code
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
