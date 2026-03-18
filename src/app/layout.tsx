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
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-surface-muted antialiased">
        {children}
      </body>
    </html>
  );
}
