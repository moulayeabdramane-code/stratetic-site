import type { Metadata } from "next";
import { Inter, Archivo } from "next/font/google";
import { SmoothScrollProvider } from "@/components/motion/SmoothScrollProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const archivo = Archivo({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

export const metadata: Metadata = {
  title: "STRATETIC — Produire ce qui compte.",
  description:
    "Agence de production audiovisuelle, design et communication basée à Niamey. Depuis 2013, nous produisons ce qui compte pour le Niger, le Sahel et ceux qui s'y intéressent.",
  icons: {
    icon: "/brand/Icon Stratetic New-01.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${archivo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
    </html>
  );
}
