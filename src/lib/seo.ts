import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/constants";

const DEFAULT_SITE_URL = "https://sideflip.vercel.app";
const DEFAULT_OG_IMAGE_PATH = "/images/logo.svg";

function normalizeSiteUrl(value: string | undefined): string {
  if (!value) return DEFAULT_SITE_URL;
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_APP_URL);
export const DEFAULT_OG_IMAGE_URL = `${SITE_URL}${DEFAULT_OG_IMAGE_PATH}`;

export function absoluteUrl(path: string): string {
  if (!path) return SITE_URL;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return `${SITE_URL}${path}`;
  return `${SITE_URL}/${path}`;
}

export const NO_INDEX_ROBOTS: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
  },
};

export function privatePageMetadata(title: string, description?: string): Metadata {
  return {
    title,
    description,
    robots: NO_INDEX_ROBOTS,
  };
}

export function publicPageMetadata(input: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article" | "profile";
}): Metadata {
  const canonical = absoluteUrl(input.path);
  const fullTitle = `${input.title} | ${SITE_NAME}`;

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: fullTitle,
      description: input.description,
      url: canonical,
      siteName: SITE_NAME,
      type: input.type ?? "website",
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
      title: fullTitle,
      description: input.description,
      images: [DEFAULT_OG_IMAGE_URL],
    },
  };
}

export const DEFAULT_SEO_DESCRIPTION = SITE_DESCRIPTION;
