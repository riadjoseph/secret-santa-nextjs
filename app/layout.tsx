import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

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
      <head>
        <Script
          src="https://js.hcaptcha.com/1/api.js"
          async
          defer
        />
      </head>
      <body className="antialiased">
        <div className="min-h-screen flex flex-col">
          <header className="bg-primary-600 text-white py-4 px-6 shadow-lg">
            <div className="container mx-auto max-w-6xl">
              <h1 className="text-2xl font-bold">🎅 SEO Kringle</h1>
              <p className="text-sm text-primary-100">Secret Santa Gift Exchange</p>
            </div>
          </header>

          <main className="flex-1 container mx-auto max-w-6xl px-6 py-8">
            {children}
          </main>

          <footer className="bg-gray-100 py-4 px-6 text-center text-sm text-gray-600">
            <p>SEO Kringle {new Date().getFullYear()} - Community Gift Exchange</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
