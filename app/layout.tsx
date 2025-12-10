import type { Metadata } from "next";
import "./globals.css";
import { LogoWithText } from "@/components/Logo";

export const metadata: Metadata = {
  title: "SEO Kringle - Secret Santa",
  description: "SEO Community Secret Santa Gift Exchange",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="min-h-screen flex flex-col">
          <header className="bg-primary-600 text-white py-4 px-6 shadow-lg">
            <div className="container mx-auto max-w-6xl">
              <LogoWithText />
            </div>
          </header>

          <main className="flex-1 container mx-auto max-w-6xl px-6 py-8">
            {children}
          </main>

          <footer className="bg-gray-100 py-4 px-6 text-center text-sm text-gray-600">
            <p className="mb-2">
              SEO Kringle 2025 - Community Gift Exchange
            </p>
            <p className="mb-2">
              Made with ❤️ by{' '}
              <a
                href="https://www.linkedin.com/in/riadjoseph/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium"
              >
                Riad Joseph
              </a>
              {' '}+ Claude Code, ChatGPT and Gemini
            </p>
            <p>
              <a href="/privacy-policy" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
