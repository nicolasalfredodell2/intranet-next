import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "animate.css";
import "@mdi/font/css/materialdesignicons.min.css";
import "primeicons/primeicons.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/arya-blue/theme.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Intranet",
  description: "Intranet - Tribunal de Cuentas de Río Negro",
  authors: [{ name: "Tribunal de Cuentas de Río Negro - Area Informática" }],
  robots: "noindex",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={montserrat.variable}>
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body className={`fix-header card-no-border fix-sidebar ${montserrat.className}`}>
        {children}
      </body>
    </html>
  );
}
