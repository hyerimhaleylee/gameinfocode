import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TrackVisit from "@/components/TrackVisit";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GAMECODE — AI가 읽어주는 당신의 배틀그라운드",
  description: "당신의 전적은 숫자가 아니라 플레이 스타일입니다. AI 전술 분석 플랫폼 GAMECODE.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="bg-[#090f1e] text-slate-100 min-h-screen">
        <TrackVisit />
        {children}
      </body>
    </html>
  );
}
