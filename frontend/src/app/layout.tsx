import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals1.css";
import { ClientProviders } from "@/components/ClientProviders";
import { ThemeProvider } from "@/providers/theme-provider";

const notoSansThai = Noto_Sans_Thai({ 
  subsets: ["thai", "latin"],
  variable: "--font-noto-sans-thai",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "SN Clinic | คลินิกบริหารยาผู้ป่วยรักษายา",
  description: "Clinic Management System",
  keywords: ["clinic", "medical", "pharmacy", "management", "system"],
  authors: [{ name: "SN Clinic" }],
  creator: "SN Clinic",
  publisher: "SN Clinic",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  openGraph: {
    title: "SN Clinic | คลินิกบริหารยาผู้ป่วยรักษายา",
    description: "Clinic Management System",
    url: "/",
    siteName: "SN Clinic",
    locale: "th_TH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SN Clinic | คลินิกบริหารยาผู้ป่วยรักษายา",
    description: "Clinic Management System",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#10b981",
      },
    ],
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#10b981" },
    { media: "(prefers-color-scheme: dark)", color: "#059669" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@100;200;300;400;500;600;700;800;900&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className={`antialiased ${notoSansThai.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <ClientProviders>
            {children}
          </ClientProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
