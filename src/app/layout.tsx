import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ColorPicker",
  description: "颜色选择器应用",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
