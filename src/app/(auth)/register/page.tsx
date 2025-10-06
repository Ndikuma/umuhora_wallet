
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { RegisterForm } from "./register-form"
import { BitcoinIcon } from "@/components/icons"

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <BitcoinIcon className="size-8 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">
          Umuhora Tech Wallet
        </h1>
      </Link>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Créer un compte</CardTitle>
          <CardDescription>
            Entrez vos informations pour créer votre portefeuille sécurisé.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
          <div className="mt-4 text-center text-sm">
            Vous avez déjà un compte ?{" "}
            <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
              Se connecter
            </Link>
          </div>
           <div className="mt-2 text-center text-sm">
            Vous voulez restaurer un portefeuille existant ?{" "}
            <Link href="/restore-wallet" className="font-semibold text-primary underline-offset-4 hover:underline">
              Restaurer maintenant
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
