import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FocusGroup - Real-time Perception Tracking",
  description: "A web streaming platform for focus groups with Frank Luntz-style perception analyzer dial",
  keywords: ["focus group", "perception analyzer", "dial testing", "qualitative research", "video conferencing"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
