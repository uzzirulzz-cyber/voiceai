import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Voice AI — Five-Engine AI Workspace",
  description:
    "Premium multi-agent AI workspace coordinating Claude, Gemini, GLM, Codex, and Research agents. Plan, execute, verify, and deliver from one instruction.",
  keywords: ["Voice AI", "Multi-agent", "Claude", "Gemini", "GLM", "Codex", "AI workspace"],
  authors: [{ name: "Voice AI" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="midnight" data-coreui-theme="dark">
      <head>
        {/* CoreUI Bootstrap 5.6.1 — deeply embedded */}
        <link rel="stylesheet" href="/coreui/css/style.min.css" />
        <script defer src="/coreui/js/coreui.bundle.min.js" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
