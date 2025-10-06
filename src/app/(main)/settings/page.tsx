
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SettingsClient } from "./settings-client";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérez les paramètres et préférences de votre portefeuille.
        </p>
      </div>
      <SettingsClient />
    </div>
  );
}
