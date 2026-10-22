import { Geist } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme-provider";
import { FontProvider } from "@/components/font-provider";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "CSE Review System | Civil Service Examination Review",
  description: "Comprehensive Civil Service Examination Review and Educational Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} antialiased`}
      >
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="light"
          themes={["light", "dark"]}
          enableSystem={false}
          disableTransitionOnChange
        >
          <FontProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </FontProvider>
        </ThemeProvider>
        <Script src="https://cdn.lordicon.com/lordicon.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
