import { ClerkProvider } from "@clerk/nextjs";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"] });

export const metadata = {
  title: "AI Media Generator",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
        <head>
          <link rel="manifest" href="/manifest.json" />
        </head>
        <body className="bg-canvas text-ink">{children}</body>
      </html>
    </ClerkProvider>
  );
}
