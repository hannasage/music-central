import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AccessibilityProvider from "./components/AccessibilityProvider";
import AuthenticatedAIChat from "./components/AuthenticatedAIChat";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Music Central - Your Digital Vinyl Collection",
  description: "Discover, explore, and enjoy your vinyl collection with AI-powered music discovery and Spotify integration.",
  keywords: ["music", "vinyl", "collection", "discovery", "spotify"],
  authors: [{ name: "Music Central" }],
  creator: "Music Central",
  metadataBase: new URL('http://localhost:3000'),
  openGraph: {
    title: "Music Central - Your Digital Vinyl Collection",
    description: "Discover, explore, and enjoy your vinyl collection with AI-powered music discovery.",
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
        <AccessibilityProvider />
        {children}
        <AuthenticatedAIChat />
      </body>
    </html>
  );
}
