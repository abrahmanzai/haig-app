import { DM_Sans } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";

const dmSans = DM_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "High Agency Investment Group",
  description: "HAIG student-run investment club portal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={dmSans.className}>{children}</body>
    </html>
  );
}
