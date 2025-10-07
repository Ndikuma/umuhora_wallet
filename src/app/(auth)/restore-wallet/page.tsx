
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { RestoreForm } from "./restore-form"
import { UmuhoraIcon } from "@/components/icons"
import Link from "next/link"

export default function RestoreWalletPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
       <Link href="/" className="mb-8 flex items-center gap-2">
        <UmuhoraIcon className="size-8 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">
          Umuhora Wallet
        </h1>
      </Link>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Restaurer le portefeuille</CardTitle>
          <CardDescription>
            Entrez votre phrase de récupération de 12 or 24 mots.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RestoreForm />
           <div className="mt-4 text-center text-sm">
            Vous n'avez pas de portefeuille ?{" "}
            <Link href="/register" className="font-semibold text-primary underline-offset-4 hover:underline">
              Créer un nouveau
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
