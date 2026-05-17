import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
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
  title: "Sistem Absensi Pegawai",
  description: "Aplikasi absensi pegawai modern dengan verifikasi wajah dan validasi GPS. Sistem kehadiran berbasis face recognition dan lokasi realtime.",
  keywords: ["absensi", "pegawai", "face recognition", "GPS", "kehadiran", "attendance"],
  authors: [{ name: "Sistem Absensi Pegawai" }],
  manifest: "/api/manifest",
  icons: {
    icon: "/api/favicon",
    apple: "/api/pwa-icon/192",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Dynamic favicon - served from DB via API route */}
        <link rel="icon" href="/api/favicon" id="favicon-link" />
        <link rel="apple-touch-icon" href="/api/pwa-icon/192" id="apple-touch-icon-link" />
        <meta name="theme-color" content="#1e40af" />
        {/* PWA meta tags for Android/iOS installability */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Absensi" />
        <meta name="application-name" content="Absensi" />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
