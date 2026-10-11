import type { Metadata, Viewport } from "next";
import { Gowun_Batang, IBM_Plex_Sans_KR, Shippori_Mincho } from "next/font/google";
import { SajuProvider } from "@/components/SajuProvider";
import "./globals.css";

// 한글·한자 글리프는 subset 이 없어 preload 하지 않는다 (Google Fonts 가 unicode-range 로 나눠 제공)
const gowun = Gowun_Batang({ weight: ["400", "700"], variable: "--font-gowun", preload: false, display: "swap" });
const shippori = Shippori_Mincho({ weight: ["500", "700"], variable: "--font-shippori", preload: false, display: "swap" });
const plex = IBM_Plex_Sans_KR({ weight: ["400", "500", "600"], variable: "--font-plex", preload: false, display: "swap" });

export const metadata: Metadata = {
  title: "명(命) — AI 사주 상담",
  description: "여덟 글자는 정확하게 계산하고, 풀이는 상담사처럼 차분하게.",
};

export const viewport: Viewport = {
  themeColor: "#121419",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${gowun.variable} ${shippori.variable} ${plex.variable}`}>
      <body className="min-h-dvh bg-ink text-washi">
        <SajuProvider>
          <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col md:border-x md:border-line-soft">
            {children}
          </div>
        </SajuProvider>
      </body>
    </html>
  );
}
