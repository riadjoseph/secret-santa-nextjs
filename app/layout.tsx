import type { Metadata } from "next";
import "./globals.css";
import { LogoWithText } from "@/components/Logo";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "name": "SEO Kringle",
      "url": "https://seokringle.com",
      "description": "SEO Kringle is the SEO community's own Secret Santa exchange, created to bring together SEOs from all backgrounds through small, meaningful gifts and festive fun.",
      "sameAs": [
        "https://www.linkedin.com/in/riadjoseph/",
        "https://en.wikipedia.org/wiki/Secret_Santa",
        "https://en.wikipedia.org/wiki/Kris_Kringle",
        "https://en.wikipedia.org/wiki/Gift",
        "https://en.wikipedia.org/wiki/Search_engine_optimization"
      ],
      "mainEntityOfPage": "https://seokringle.com"
    },
    {
      "@type": "Event",
      "name": "SEO Kringle Secret Santa Exchange",
      "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
      "eventStatus": "https://schema.org/EventScheduled",
      "location": {
        "@type": "VirtualLocation",
        "url": "https://seokringle.com"
      },
      "organizer": {
        "@type": "Organization",
        "name": "SEO Kringle",
        "url": "https://seokringle.com"
      },
      "description": "Global gift-exchange for SEOs: sign up, get matched, send a small surprise, and receive a gift from another participant. Discover new tools, meet peers, and share #SEOKringle joy.",
      "potentialAction": {
        "@type": "JoinAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://seokringle.com/",
          "actionApplication": {
            "@type": "SoftwareApplication",
            "name": "LinkedIn OAuth",
            "applicationCategory": "SocialNetworkingApplication",
            "operatingSystem": "All"
          }
        },
        "description": "Sign up on SEOkringle.com with LinkedIn, receive your match, send a gift, and share your reveal with #SEOKringle."
      },
      "about": [
        { "@id": "https://en.wikipedia.org/wiki/Secret_Santa" },
        { "@id": "https://en.wikipedia.org/wiki/Kris_Kringle" },
        { "@id": "https://en.wikipedia.org/wiki/Gift" },
        { "@id": "https://en.wikipedia.org/wiki/Search_engine_optimization" }
      ],
      "offers": [
        {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
          "description": "Sponsor-provided tools, swag, discounts, and digital goodies for participants to give."
        }
      ],
      "applicationCategory": "CommunityEventApplication",
      "operatingSystem": "Any",
      "inLanguage": "en"
    },
    {
      "@id": "https://en.wikipedia.org/wiki/Secret_Santa",
      "@type": "Thing",
      "name": "Secret Santa",
      "sameAs": ["https://en.wikipedia.org/wiki/Secret_Santa"]
    },
    {
      "@id": "https://en.wikipedia.org/wiki/Kris_Kringle",
      "@type": "Thing",
      "name": "Kringle",
      "sameAs": ["https://en.wikipedia.org/wiki/Kris_Kringle"]
    },
    {
      "@id": "https://en.wikipedia.org/wiki/Gift",
      "@type": "Thing",
      "name": "Gifting",
      "sameAs": ["https://en.wikipedia.org/wiki/Gift"]
    },
    {
      "@id": "https://en.wikipedia.org/wiki/Search_engine_optimization",
      "@type": "Thing",
      "name": "SEO",
      "sameAs": ["https://en.wikipedia.org/wiki/Search_engine_optimization"]
    }
  ]
};

export const metadata: Metadata = {
  title: "SEO Kringle – Secret Santa for the SEO Community",
  description:
    "SEO Kringle is a Secret Santa for the SEO community. Sign up with LinkedIn, get matched with another SEO, and exchange gifts sponsored by SEO tools and services.",
  metadataBase: new URL("https://seokringle.com"),
  openGraph: {
    type: "website",
    url: "https://seokringle.com/",
    siteName: "SEO Kringle",
    locale: "en_US",
    title: "SEO Kringle – Secret Santa for the SEO Community",
    description:
      "Join the SEO community Secret Santa: sign up with LinkedIn, share your wishlist, and exchange gifts sponsored by generous SEO tools and services.",
    images: [
      {
        url: "https://seokringle.com/seo-kringle-lady-elf-with-gift.png",
        width: 1200,
        height: 630,
        alt: "SEO Kringle – SEO Community Secret Santa gift exchange",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SEO Kringle – Secret Santa for the SEO Community",
    description:
      "Secret Santa for SEOs: sign up with LinkedIn, get matched, and swap gifts sponsored by SEO tools. Open to everyone, beyond any religion.",
    images: ["https://seokringle.com/seo-kringle-myth-figure-with-gift.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Playfair+Display:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body className="antialiased font-sans">
        <div className="min-h-screen flex flex-col bg-gray-50">
          <header className="bg-primary-600 text-white py-4 px-6 shadow-lg">
            <div className="container mx-auto max-w-6xl">
              <LogoWithText />
            </div>
          </header>

          <main className="flex-1 container mx-auto max-w-6xl px-6 py-8">
            {children}
          </main>

          <footer className="bg-gray-100 py-4 px-6 text-center text-sm text-gray-600">
            <p className="mb-2">SEO Kringle 2025 - Community Gift Exchange</p>
            <p className="mb-2">
              Made with ❤️ by{" "}
              <a
                href="https://www.linkedin.com/in/riadjoseph/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium"
              >
                Riad Joseph
              </a>{" "}
              + Claude Code, ChatGPT and Gemini
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
