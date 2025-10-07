
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
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
import { useState } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UmuhoraIcon } from "@/components/icons";


const formSchema = z.object({
  otp: z.string().min(6, { message: "L'OTP doit contenir 6 caractères." }).max(6),
});

export default function VerifyOtpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { otp: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const response = await api.verifyOtpLogin(values.otp);
      const { wallet_created } = response.data;
      
      toast({
        title: "Vérification réussie",
        description: "Connexion sécurisée terminée.",
      });

      if (wallet_created) {
        router.push("/dashboard");
      } else {
        router.push("/create-or-restore");
      }
      router.refresh();

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Échec de la vérification OTP",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <UmuhoraIcon className="size-8 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Umuhora Wallet</h1>
      </Link>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Vérification à deux facteurs</CardTitle>
          <CardDescription>
            Pour votre sécurité, veuillez entrer le code de votre application d'authentification.
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
                      <Input placeholder="123456" {...field} autoComplete="one-time-code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Vérifier & Se connecter
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
