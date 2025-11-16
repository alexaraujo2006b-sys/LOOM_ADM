import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
import { AppProvider } from "@/context/AppContext";
import React from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Controle de Produção de Teares BIG BAGS",
  description: "Um aplicativo web interativo para controle diário de produção de uma linha de teares, permitindo entrada de dados, cálculos automáticos de eficiência e geração de relatórios.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-gray-100`}>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
