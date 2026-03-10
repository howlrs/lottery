import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "../i18n/LanguageContext";
import ToastContainer from '@/components/Toast';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = "https://lottery.howlrs.net";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Lottery System",
    template: "%s | Lottery System",
  },
  description: "Web-based lottery system with roulette wheel animation. Create events, manage prizes, and let users spin to win!",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Lottery System",
    description: "Web-based lottery system with roulette wheel animation. Create events, manage prizes, and let users spin to win!",
    url: BASE_URL,
    siteName: "Lottery System",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Lottery System",
    description: "Web-based lottery system with roulette wheel animation. Create events, manage prizes, and let users spin to win!",
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Lottery System",
    url: BASE_URL,
    description: "Web-based lottery system with roulette wheel animation. Create events, manage prizes, and let users spin to win!",
    applicationCategory: "Entertainment",
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LanguageProvider>
          <ToastContainer />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
