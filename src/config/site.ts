export const siteConfig = {
  name: "OnlyHalos",
  description: "The premier platform for elite content creators",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://onlyhalos.com",
  ogImage: "/og-image.png",
  creator: "@onlyhalos",
  links: {
    twitter: "https://twitter.com/onlyhalos",
    instagram: "https://instagram.com/onlyhalos",
  },
} as const;

export type SiteConfig = typeof siteConfig;
