import type { Metadata } from "next";
import { Toaster } from "sonner";
import { inter, playfair } from "@/styles/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "OnlyHalos | Premium Creator Platform",
  description:
    "The elite platform where iconic creators share exclusive content with their most dedicated fans. Join the halo — where icons shine.",
  keywords: [
    "creator platform",
    "exclusive content",
    "premium creators",
    "subscriptions",
    "OnlyHalos",
  ],
  authors: [{ name: "OnlyHalos" }],
  openGraph: {
    title: "OnlyHalos | Premium Creator Platform",
    description:
      "The elite platform where iconic creators share exclusive content with their most dedicated fans.",
    url: "https://onlyhalos.com",
    siteName: "OnlyHalos",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "OnlyHalos — Where Icons Shine",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OnlyHalos | Premium Creator Platform",
    description:
      "The elite platform where iconic creators share exclusive content with their most dedicated fans.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${playfair.variable}`}>
      <body className={`${inter.className} min-h-screen bg-background`}>
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "hsl(240 6% 10%)",
              border: "1px solid hsl(240 4% 18%)",
              color: "hsl(240 5% 96%)",
            },
            className: "sonner-toast",
          }}
          richColors
        />
      </body>
    </html>
  );
}
