import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Career Guidance",
  description: "Psychology-based career cluster assessment",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-full bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 antialiased">
        <div className="mx-auto min-h-full max-w-5xl px-2 sm:px-4">{children}</div>
      </body>
    </html>
  );
}
