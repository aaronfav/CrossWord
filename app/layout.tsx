import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { RootProvider } from "./rootProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Crossword",
  description:
    "Build as many sub-words as you can before the timer hits zero.",
  openGraph: {
    title: "Crossword",
    description:
      "Build as many sub-words as you can before the timer hits zero.",
    images: ["/og.svg"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Crossword",
    description:
      "Build as many sub-words as you can before the timer hits zero.",
    images: ["/og.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
