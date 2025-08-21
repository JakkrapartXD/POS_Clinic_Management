import type { Metadata } from "next";
import "./globals1.css";
import { UserProvider } from "@/hooks/use-user";

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
    <html lang="en">
      <body className="antialiased">
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
