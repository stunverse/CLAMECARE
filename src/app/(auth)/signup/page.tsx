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
import { SignupForm } from "@/components/auth/signup-form";
import { OrDivider } from "@/components/auth/or-divider";

export const metadata: Metadata = { title: "Créer votre compte" };

export default function SignupPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Créer votre compte</CardTitle>
        <CardDescription>
          Confiez le suivi de vos factures impayées en quelques minutes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <GoogleButton label="S'inscrire avec Google" />
        <OrDivider />
        <SignupForm />
        <p className="text-center text-sm text-muted-foreground">
          Vous avez déjà un compte ?{" "}
          <Link href="/login" className="font-medium text-brand hover:underline">
            Se connecter
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
