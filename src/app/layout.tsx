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

const TITLE = "ClaimCare AI — Fight unfair insurance claim denials with AI";
const DESCRIPTION =
  "Upload your denial letter. ClaimCare AI analyzes it, tells you what went wrong, builds your evidence file, and generates the appeal letter for you. Informational assistance only — not legal advice.";

export const metadata: Metadata = {
  metadataBase: new URL(env.APP_URL),
  title: {
    default: TITLE,
    template: "%s · ClaimCare AI",
  },
  description: DESCRIPTION,
  applicationName: "ClaimCare AI",
  keywords: [
    "insurance claim",
    "claim denial appeal",
    "insurance appeal letter",
    "denied claim help",
    "Department of Insurance complaint",
    "insurance dispute",
  ],
  openGraph: {
    type: "website",
    siteName: "ClaimCare AI",
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
