import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "@/components/providers/SessionProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Analytics Dashboard",
    template: "%s · Analytics Dashboard",
  },
  description: "Matomo Analytics Frontend – klar und fokussiert.",
  robots: {
    index: false,
    follow: false,
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <html lang="de">
        <body className={inter.className}>{children}</body>
      </html>
    </SessionProvider>
  );
}
