import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins, Jaro } from "next/font/google";
import { Providers } from "./providers";
import "md-editor-rt/lib/style.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-face",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono-face",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins-face",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jaro = Jaro({
  variable: "--font-jaro-face",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "FORKED NUCES",
    template: "%s | FORKED NUCES",
  },
  description: "Discover, share, and collaborate on student-built projects across FAST NUCES.",
  openGraph: {
    title: "FORKED NUCES",
    description: "Discover, share, and collaborate on student-built projects across FAST NUCES.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "FORKED NUCES",
    description: "Discover, share, and collaborate on student-built projects across FAST NUCES.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${jaro.variable}`}
    >
      <body
        className="min-h-screen bg-[#E8EAEC] font-sans antialiased"
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
