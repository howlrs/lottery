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

export const metadata: Metadata = {
  title: {
    default: "Lottery System",
    template: "%s | Lottery System",
  },
  description: "Web-based lottery system with roulette wheel animation. Create events, manage prizes, and let users spin to win!",
  openGraph: {
    title: "Lottery System",
    description: "Web-based lottery system with roulette wheel animation",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
