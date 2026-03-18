import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dagstaten - Strukton",
  description: "Dagelijkse staten beheer voor Strukton",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className="min-h-screen bg-gray-50 antialiased">
        {children}
      </body>
    </html>
  );
}
