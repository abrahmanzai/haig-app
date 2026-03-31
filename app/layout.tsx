import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "700"],
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
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('haig_theme');if(t)document.documentElement.dataset.theme=t;if(!sessionStorage.getItem('haig_splash_seen')){document.documentElement.dataset.splash='1';}var sc=localStorage.getItem('haig_sidebar_collapsed');document.documentElement.style.setProperty('--sidebar-width',sc==='1'?'64px':'256px');})();` }} />
      </head>
      <body className={`${ibmPlexSans.variable} ${jetbrainsMono.variable} ${ibmPlexSans.className}`} style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
