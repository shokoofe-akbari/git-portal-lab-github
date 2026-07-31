import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Git Portal Lab | آزمایشگاه تعاملی Git و GitHub",
  description:
    "با اجرای واقعی دستورها، حرکت فایل‌ها میان Working Directory، Staging، Local Repository و GitHub را یاد بگیرید.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
