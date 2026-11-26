import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DIGI CHOICE — Apple Smart Choice Guide & Bundling System | Digimap",
  description:
    "Compare Smart, Bundle Right, Checkout Fast. Aplikasi web konsultasi ekosistem Apple, Tiered Casing Bundle, Trade-In Laku6, Proteksi Qoala, dan Simulasi Cicilan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
