import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AccessibilityProvider from "./components/shared/AccessibilityProvider";
import AuthenticatedAIChat from "./components/features/ai-curator/AuthenticatedAIChat";
import { StreamingPreferenceProvider } from "./contexts/StreamingPreferenceContext";
import StreamingPreferenceModal from "./components/features/streaming/StreamingPreferenceModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hanna's Record Collection",
  description: "A curated collection of vinyl records with personal thoughts, AI-powered music discovery, and streaming integration.",
  keywords: ["music", "vinyl", "collection", "discovery", "spotify", "records"],
  authors: [{ name: "Hanna" }],
  creator: "Hanna",
  metadataBase: new URL('http://localhost:3000'),
  openGraph: {
    title: "Hanna's Record Collection",
    description: "A curated collection of vinyl records with personal thoughts and AI-powered music discovery.",
    type: "website",
    locale: "en_US",
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
        <StreamingPreferenceProvider>
          <AccessibilityProvider />
          {children}
          <AuthenticatedAIChat />
          <StreamingPreferenceModal />
        </StreamingPreferenceProvider>
      </body>
    </html>
  );
}
