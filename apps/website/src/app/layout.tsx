import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TradeFlow ERP — The Complete ERP for Import & Distribution",
    template: "%s | TradeFlow ERP",
  },
  description:
    "Manage inventory, procurement, sales, accounting, and collections — all in one platform built for importers and distributors.",
  keywords: [
    "ERP",
    "enterprise resource planning",
    "inventory management",
    "distribution software",
    "import business software",
    "warehouse management",
    "accounting software",
    "sales invoicing",
    "TradeFlow",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "TradeFlow ERP",
    title: "TradeFlow ERP — The Complete ERP for Import & Distribution",
    description:
      "Manage inventory, procurement, sales, accounting, and collections — all in one platform built for importers and distributors.",
  },
  twitter: {
    card: "summary_large_image",
    title: "TradeFlow ERP — The Complete ERP for Import & Distribution",
    description:
      "Manage inventory, procurement, sales, accounting, and collections — all in one platform built for importers and distributors.",
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
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap"
        />
      </head>
      <body className="antialiased">
        <Navbar />
        <main className="pt-16 lg:pt-18">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
