import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Journal Companion",
  description:
    "Ein ruhiges Tagebuch mit einem einfühlsamen KI-Begleiter, der dir beim Reflektieren hilft.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
