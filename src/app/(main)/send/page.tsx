
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SendForm } from "./send-form";
import { Bitcoin } from "lucide-react";


export default function SendPage() {

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
            <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Bitcoin className="size-6 text-primary" />
            </div>
            <CardTitle>Envoyer des Bitcoins</CardTitle>
            </div>
            <CardDescription>
            Entrez l'adresse du destinataire et le montant à envoyer. Les frais optimaux seront calculés en fonction des UTXOs. Évitez d'envoyer la totalité de votre solde car cela peut entraîner des erreurs de calcul des frais.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <SendForm />
        </CardContent>
      </Card>
    </div>
  );
}
