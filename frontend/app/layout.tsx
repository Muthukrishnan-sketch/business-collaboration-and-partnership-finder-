import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { ActiveBusinessProvider } from "@/lib/activeBusiness";
import { ThemeProvider } from "@/lib/theme";
import { NavBar } from "@/components/NavBar";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Threadwork — Find your business partners",
  description: "Discover compatible local businesses to partner with.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${fraunces.variable} ${inter.variable} ${ibmPlexMono.variable} font-body bg-cream text-ink`}
        >
          <ThemeProvider>
            <ActiveBusinessProvider>
              <NavBar />
              {children}
            </ActiveBusinessProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}