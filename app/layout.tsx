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
      <body className={dmSans.className}>
        {/* Global logo watermark — fixed and viewport-centered on every page.
            Opacity controlled by .hero-watermark: 0.06 normally, 0 while splash plays. */}
        <div
          className="hero-watermark fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
          style={{ zIndex: 0 }}
          aria-hidden
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-mark.svg"
            alt=""
            style={{ height: "65vh", width: "auto" }}
          />
        </div>
        {children}
      </body>
    </html>
  );
}
