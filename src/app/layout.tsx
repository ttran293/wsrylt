import type { Metadata, Viewport } from "next";
import { Fira_Code } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { Header } from "@/components/Header";
import { SmoothScroll } from "@/components/SmoothScroll";
import "./globals.css";

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Music Blog",
  description: "Share YouTube songs, write captions, and interact through likes and comments.",
  referrer: "strict-origin-when-cross-origin",
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${firaCode.variable} h-full`}>
      <body className={`${firaCode.className} flex min-h-full flex-col`}>
        <AuthProvider>
          <SmoothScroll>
            <Header />
            <main className="w-full flex-1 px-5 py-6">
              {children}
            </main>
          </SmoothScroll>
        </AuthProvider>
      </body>
    </html>
  );
}
