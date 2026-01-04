import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { RootProvider } from "./rootProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const miniappEmbed = {
  version: "1",
  imageUrl: "https://cross-word-seven.vercel.app/crossword.png",
  button: {
    title: "Play Crossword",
    action: {
      type: "launch_miniapp",
      url: "https://cross-word-seven.vercel.app/",
      name: "Crossword",
    },
  },
};

const frameEmbed = {
  version: "1",
  imageUrl: "https://cross-word-seven.vercel.app/crossword.png",
  button: {
    title: "Play Crossword",
    action: {
      type: "launch_frame",
      url: "https://cross-word-seven.vercel.app/",
      name: "Crossword",
    },
  },
};

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
  other: {
    "fc:miniapp": JSON.stringify(miniappEmbed),
    "fc:frame": JSON.stringify(frameEmbed),
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
