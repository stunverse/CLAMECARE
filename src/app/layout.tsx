import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { env } from "@/lib/env";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const TITLE = "ClaimGuard — L'assistant de paiement des indépendants";
const DESCRIPTION =
  "Freelance, consultant, artisan ou prestataire : déposez votre facture impayée. ClaimGuard analyse votre dossier, contacte votre client, suit les échanges et vous accompagne automatiquement jusqu'à la résolution du paiement.";

export const metadata: Metadata = {
  metadataBase: new URL(env.APP_URL),
  title: {
    default: TITLE,
    template: "%s · ClaimGuard",
  },
  description: DESCRIPTION,
  applicationName: "ClaimGuard",
  keywords: [
    "facture impayée",
    "relance client",
    "freelance indépendant",
    "recouvrement amiable",
    "suivi de paiement",
    "relance facture freelance",
  ],
  openGraph: {
    type: "website",
    siteName: "ClaimGuard",
    title: TITLE,
    description: DESCRIPTION,
    url: env.APP_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
