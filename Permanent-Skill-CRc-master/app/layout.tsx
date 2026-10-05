import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/components/AppProvider";
import { AuthGate } from "@/components/AuthGate";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Permanent Skill Strategy",
  description: "A private community to build skills, SEO authority, and offers that compound.",
  icons: { icon: "/logo.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geist.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-full bg-bg font-sans text-zinc-900" suppressHydrationWarning>
        <AppProvider>
          <AuthGate>{children}</AuthGate>
        </AppProvider>
      </body>
    </html>
  );
}
