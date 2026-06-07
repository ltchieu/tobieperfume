import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import SmoothScroll from "@/components/SmoothScroll";
import "./globals.css";

const sansFont = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const serifFont = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "TOBI PERFUME",
  description: "Perfume shop",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sansFont.variable} ${serifFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0b0c10] text-zinc-100 selection:bg-red-950 selection:text-red-200">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}

