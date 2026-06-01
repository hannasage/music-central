import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Mono, Syne } from "next/font/google";
import "./globals.css";
import AccessibilityProvider from "./components/shared/AccessibilityProvider";
import AuthenticatedAIChat from "./components/features/ai-curator/AuthenticatedAIChat";
import { StreamingPreferenceProvider } from "./contexts/StreamingPreferenceContext";
import StreamingPreferenceModal from "./components/features/streaming/StreamingPreferenceModal";
import FloatingActionButtons from "./components/shared/FloatingActionButtons";
import StreamingSettingsFAB from "./components/features/streaming/StreamingSettingsFAB";
import AddAlbumModalWrapper from "./components/features/albums/AddAlbumModalWrapper";
import ToastProvider from "./components/shared/ToastProvider";
import UIProvider from "./components/shared/UIProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
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
        className={`${geistSans.variable} ${geistMono.variable} ${ibmPlexMono.variable} ${syne.variable} antialiased`}
      >
        <UIProvider>
          <StreamingPreferenceProvider>
            <AddAlbumModalWrapper>
              <AccessibilityProvider />
              {children}
              <FloatingActionButtons>
                <AuthenticatedAIChat />
                <StreamingSettingsFAB />
              </FloatingActionButtons>
              <StreamingPreferenceModal />
              <ToastProvider />
            </AddAlbumModalWrapper>
          </StreamingPreferenceProvider>
        </UIProvider>
      </body>
    </html>
  );
}
