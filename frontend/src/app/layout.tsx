import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { ReduxProvider } from "@/store/provider";
import { ToastProvider } from "@/components/ui/Toast";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AncerLarins - Premium Real Estate in Lagos",
    template: "%s | AncerLarins",
  },
  description:
    "Discover premium properties in Lagos. Rent or buy apartments, houses, and duplexes in Lekki, Ikoyi, Victoria Island, and more. Verified agents, real listings.",
  keywords: [
    "Lagos real estate",
    "rent apartment Lagos",
    "buy house Lagos",
    "Lekki property",
    "Ikoyi apartments",
    "Victoria Island rent",
    "Nigeria property",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AncerLarins",
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    siteName: "AncerLarins",
    title: "AncerLarins - Premium Real Estate in Lagos",
    description:
      "Discover premium properties in Lagos. Rent or buy apartments, houses, and duplexes in Lekki, Ikoyi, Victoria Island, and more.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "AncerLarins - Premium Real Estate in Lagos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AncerLarins - Premium Real Estate in Lagos",
    description:
      "Discover premium properties in Lagos. Verified agents, real listings.",
    images: ["/images/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0A0A0A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  name: "AncerLarins",
                  url: "https://ancerlarins.com",
                  logo: "https://ancerlarins.com/images/logo-white.png",
                  description:
                    "Premium real estate platform in Lagos, Nigeria. Verified agents, real listings, instant WhatsApp connect.",
                  areaServed: {
                    "@type": "City",
                    name: "Lagos",
                    containedInPlace: {
                      "@type": "Country",
                      name: "Nigeria",
                    },
                  },
                },
                {
                  "@type": "WebSite",
                  name: "AncerLarins",
                  url: "https://ancerlarins.com",
                  potentialAction: {
                    "@type": "SearchAction",
                    target: "https://ancerlarins.com/properties?q={search_term_string}",
                    "query-input": "required name=search_term_string",
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-accent-dark focus:text-primary focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold focus:text-sm"
        >
          Skip to main content
        </a>
        <ReduxProvider>
          <ToastProvider>{children}</ToastProvider>
        </ReduxProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
