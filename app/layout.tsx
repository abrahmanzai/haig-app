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
    <html lang="en" suppressHydrationWarning>
      {/* Runs synchronously before first paint — sets data-splash so hero stays
          hidden until the splash overlay is ready, preventing a content flash. */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){if(!sessionStorage.getItem('haig_splash_seen')){document.documentElement.dataset.splash='1';}})();` }} />
      </head>
      <body className={dmSans.className}>{children}</body>
    </html>
  );
}
