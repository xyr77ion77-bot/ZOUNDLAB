import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZoundLab · Music Player (Fusión jetAudio+AIMP)",
  description:
    "App de música Android-style con motor Web Audio API: EQ 20 bandas ISO, Reverb, Crossfeed, Limiter, Material You dynamic color y 6 temas presets.",
  keywords: [
    "music player",
    "web audio api",
    "EQ 20 bandas",
    "Material You",
    "BASS",
    "AIMP",
    "jetAudio",
    "DSP",
  ],
  authors: [{ name: "Z.ai Design Lab" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "ZoundLab · Music Player",
    description: "App de música fusión jetAudio+AIMP con Web Audio API real",
    url: "https://chat.z.ai",
    siteName: "Z.ai",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZoundLab",
    description: "App de música fusión jetAudio+AIMP",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
