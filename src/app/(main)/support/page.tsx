
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Send } from "lucide-react";
import api from "@/lib/api";
import { useUser } from "@/hooks/use-user";

const supportFormSchema = z.object({
  subject: z.string().min(5, { message: "Le sujet doit contenir au moins 5 caractères." }),
  message: z.string().min(20, { message: "Le message doit contenir au moins 20 caractères." }),
});

type SupportFormValues = z.infer<typeof supportFormSchema>;

const faqItems = [
  {
    question: "Qu'est-ce qu'un portefeuille non-custodial ?",
    answer: "Un portefeuille non-custodial, comme Umuhora Tech Wallet, signifie que vous seul avez le contrôle total de vos clés privées et, par conséquent, de vos fonds. Personne d'autre ne peut accéder à votre portefeuille sans votre phrase de récupération.",
  },
  {
    question: "J'ai perdu ma phrase de récupération. Pouvez-vous m'aider ?",
    answer: "Étant donné qu'il s'agit d'un portefeuille non-custodial, nous n'avons jamais accès à votre phrase de récupération ou à vos clés privées. Malheureusement, si vous perdez votre phrase, nous ne pouvons pas récupérer vos fonds. C'est pourquoi il est crucial de la conserver dans un endroit sûr et hors ligne.",
  },
  {
    question: "Pourquoi ma transaction est-elle en attente (pending) ?",
    answer: "Les transactions Bitcoin on-chain nécessitent une confirmation par les mineurs du réseau. Le temps de confirmation peut varier en fonction de l'encombrement du réseau et des frais de transaction que vous avez payés. Généralement, cela prend de 10 minutes à une heure, mais peut être plus long.",
  },
  {
    question: "Comment sont calculés les frais de transaction ?",
    answer: "Les frais de transaction (network fees) sont payés aux mineurs de Bitcoin pour inclure votre transaction dans un bloc. Ils sont dynamiques et dépendent de la taille de votre transaction en octets et de l'état actuel du réseau. Notre portefeuille estime les frais optimaux pour vous.",
  },
  {
    question: "Quelle est la différence entre On-Chain et Lightning ?",
    answer: "On-Chain fait référence aux transactions standards enregistrées sur la blockchain Bitcoin, idéales pour les montants plus importants et la sécurité. Le Lightning Network est une solution de seconde couche pour des transactions quasi-instantanées avec des frais très bas, parfaite pour les petits paiements quotidiens.",
  },
];

export default function SupportPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SupportFormValues>({
    resolver: zodResolver(supportFormSchema),
    defaultValues: { subject: "", message: "" },
  });

  const onSubmit = async (data: SupportFormValues) => {
    setIsSubmitting(true);
    try {
      await api.sendSupportRequest(data.subject, data.message);
      toast({
        title: "Message envoyé",
        description: "Votre demande de support a été envoyée. Notre équipe vous répondra bientôt.",
      });
      form.reset();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Échec de l'envoi",
        description: error.message || "Impossible d'envoyer votre message. Veuillez réessayer.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Support</h1>
        <p className="text-muted-foreground">
          Besoin d'aide ? Trouvez des réponses ici ou contactez-nous directement.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Questions Fréquemment Posées (FAQ)</CardTitle>
          <CardDescription>
            Trouvez rapidement des réponses aux questions courantes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contacter le Support (Ticket)</CardTitle>
          <CardDescription>
            Si vous ne trouvez pas de réponse, envoyez-nous un ticket.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {user?.email && (
                <div className="text-sm">
                  Connecté en tant que : <span className="font-semibold">{user.email}</span>
                </div>
              )}
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sujet</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: Problème de transaction" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Veuillez décrire votre problème en détail..."
                        rows={6}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Send className="mr-2 size-4" />
                )}
                {isSubmitting ? "Envoi en cours..." : "Envoyer le ticket"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
