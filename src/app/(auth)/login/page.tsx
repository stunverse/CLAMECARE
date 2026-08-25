import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GoogleButton } from "@/components/auth/google-button";
import { LoginForm } from "@/components/auth/login-form";
import { OrDivider } from "@/components/auth/or-divider";
import { FormMessage } from "@/components/auth/form-message";

export const metadata: Metadata = { title: "Connexion" };

const ERROR_MESSAGES: Record<string, string> = {
  not_configured: "La connexion Google n'est pas encore activée.",
  oauth: "Impossible de démarrer la connexion Google. Réessayez.",
  auth_callback: "Impossible de finaliser la connexion. Réessayez.",
  delete_unavailable:
    "Vous avez été déconnecté. La suppression de compte nécessite une configuration admin — contactez le support pour terminer.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const redirectTo =
    typeof sp.redirectTo === "string" ? sp.redirectTo : undefined;
  const error = sp.error ? ERROR_MESSAGES[sp.error] : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Bon retour</CardTitle>
        <CardDescription>Connectez-vous à votre espace ClaimGuard.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <FormMessage error={error} />}
        <GoogleButton label="Se connecter avec Google" />
        <OrDivider />
        <LoginForm redirectTo={redirectTo} />
        <p className="text-center text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="font-medium text-brand hover:underline">
            Créer un compte
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
