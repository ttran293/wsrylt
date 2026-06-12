import type { Metadata, Viewport } from "next";
import { Fira_Code, Inter } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { Header } from "@/components/Header";
import { SmoothScroll } from "@/components/SmoothScroll";
import "./globals.css";

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const titleSans = Inter({
  variable: "--font-title-sans",
  subsets: ["latin"],
  weight: ["700", "800"],
});

export const metadata: Metadata = {
  title: "What song are you listening to?",
  description: "Share YouTube songs, write captions, and interact through likes and comments.",
  icons: {
    icon: [{ url: "/disc3.gif", type: "image/gif" }],
    shortcut: [{ url: "/disc3.gif", type: "image/gif" }],
  },
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
    <html
      lang="en"
      className={`${firaCode.variable} ${titleSans.variable} h-full`}
    >
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
