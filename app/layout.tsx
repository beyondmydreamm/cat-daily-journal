import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "猫咪日常手账",
  description: "记录猫砂、剪指甲、呕吐、驱虫等猫咪日常事件与日期。",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
