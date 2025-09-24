import type { Metadata } from "next";
import "./globals1.css";
import { ClientProviders } from "@/components/ClientProviders";
import { ThemeProvider } from "@/providers/theme-provider";

export const metadata: Metadata = {
  title: "SN Clinic | คลินิกบริหารยาผู้ป่วยรักษายา",
  description: "Clinic Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <ClientProviders>
            {children}
          </ClientProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
