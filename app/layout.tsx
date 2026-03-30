import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "High Agency Investment Group",
  description:
    "A student-run investment partnership where members pool capital, research equities, and execute real trades together.",
  openGraph: {
    title: "High Agency Investment Group",
    description:
      "A student-run investment partnership. Learn. Invest. Build.",
    siteName: "HAIG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "High Agency Investment Group",
    description:
      "A student-run investment partnership. Learn. Invest. Build.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Runs synchronously before first paint — sets data-splash so hero stays
          hidden until the splash overlay is ready, preventing a content flash. */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('haig_theme');if(t)document.documentElement.dataset.theme=t;if(!sessionStorage.getItem('haig_splash_seen')){document.documentElement.dataset.splash='1';}})();` }} />
      </head>
      <body className={`${dmSans.variable} ${jetbrainsMono.variable} ${dmSans.className}`}>
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
            className="wm-dark"
            style={{ height: "65vh", width: "auto" }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-mark-dark.svg"
            alt=""
            className="wm-light"
            style={{ height: "65vh", width: "auto" }}
          />
        </div>
        {children}
      </body>
    </html>
  );
}
