import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme-provider";
import { FontProvider } from "@/components/font-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Review App",
  description: "Student & Teacher Review Application",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="light"
          themes={["light", "dark"]}
          enableSystem={false}
          disableTransitionOnChange
        >
          <FontProvider>
            {children}
          </FontProvider>
        </ThemeProvider>
        <Script src="https://cdn.lordicon.com/lordicon.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
