import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resonant - Focus Group Platform",
  description: "A real-time focus group platform with perception tracking",
  keywords: ["focus group", "perception analyzer", "dial testing", "qualitative research", "video conferencing"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
