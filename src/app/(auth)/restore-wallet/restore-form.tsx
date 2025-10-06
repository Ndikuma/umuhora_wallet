
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  mnemonic: z.string().min(20, { message: "La phrase de récupération semble trop courte." })
    .refine(value => {
        const wordCount = value.trim().split(/\s+/).length;
        return wordCount === 12 || wordCount === 24;
    }, "La phrase doit contenir 12 ou 24 mots."),
});

export function RestoreForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mnemonic: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await api.restoreWallet(values.mnemonic);
      toast({
        title: "Portefeuille restauré avec succès",
        description: "Votre portefeuille est prêt. Veuillez vous connecter.",
      });
      router.push("/login");
      router.refresh();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Échec de la restauration",
        description: error.message,
      });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="mnemonic"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phrase de récupération</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Entrez les 12 ou 24 mots séparés par des espaces..."
                  className="resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Restauration...' : 'Restaurer le portefeuille'}
        </Button>
      </form>
    </Form>
  );
}
