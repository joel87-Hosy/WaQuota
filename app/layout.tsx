import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WaQuote",
  description: "Suivi d'ouverture de devis PDF et relances WhatsApp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
