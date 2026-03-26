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
        {/* Global arrow watermark — fixed and viewport-centered on every page.
            Opacity controlled by .hero-watermark: 0.06 normally, 0 while splash plays. */}
        <div
          className="hero-watermark fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
          style={{ zIndex: 0 }}
          aria-hidden
        >
          <svg viewBox="-46 -46 92 132" style={{ height: "65vh", width: "auto" }}>
            <defs>
              <linearGradient id="global-wm-g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%"   stopColor="#0A84FF" />
                <stop offset="100%" stopColor="#30D158" />
              </linearGradient>
            </defs>
            <rect    x="-16" y="0"  width="32" height="80" rx="4" fill="url(#global-wm-g)" />
            <polygon points="-40,10 0,-40 40,10"                   fill="url(#global-wm-g)" />
            <rect    x="-28" y="36" width="56" height="8"  rx="3" fill="url(#global-wm-g)" opacity="0.9" />
          </svg>
        </div>
        {children}
      </body>
    </html>
  );
}
