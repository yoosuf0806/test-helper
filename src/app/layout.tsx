import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agile Testing Tool",
  description:
    "A discipline tool for bug tickets and implementation tests - every checklist step is pre-populated so skipping is always deliberate.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">{children}</body>
    </html>
  );
}
