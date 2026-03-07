import type { Metadata } from "next";
import { JetBrains_Mono, Manrope, Space_Grotesk } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { NavbarWrapper } from "@/components/layout/navbar-wrapper";
import { Footer } from "@/components/layout/footer";
import { PageTransition } from "@/components/layout/page-transition";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";
import { absoluteUrl, DEFAULT_OG_IMAGE_URL, SITE_URL } from "@/lib/seo";
import { Toaster } from "sonner";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "buy indie products",
    "sell online businesses",
    "beta testing marketplace",
    "indie products marketplace",
    "buy micro saas",
    "sell digital products",
    "startup acquisition",
    "project listings",
    "SideFlip",
  ],
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: absoluteUrl("/"),
    siteName: SITE_NAME,
    type: "website",
    images: [
      {
        url: DEFAULT_OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} logo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE_URL],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body
          className={`${manrope.variable} ${spaceGrotesk.variable} ${jetbrains.variable} bg-zinc-950 text-zinc-50 antialiased`}
        >
          <div className="flex min-h-screen flex-col">
            <NavbarWrapper />
            <main className="flex-1">
              <PageTransition>{children}</PageTransition>
            </main>
            <Footer />
          </div>
          <Toaster theme="dark" position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}
