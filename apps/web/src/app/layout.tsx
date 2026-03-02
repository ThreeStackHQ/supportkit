import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/session-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "SupportKit — Customer Support for Indie SaaS",
    template: "%s | SupportKit",
  },
  description:
    "Zendesk-level customer support tools at $9/mo. Email inbox, live chat widget, and AI draft replies for indie SaaS teams.",
  keywords: ["customer support", "help desk", "zendesk alternative", "live chat", "ai support", "indie saas"],
  openGraph: {
    title: "SupportKit — Customer Support for Indie SaaS",
    description: "Zendesk-level tools at $9/mo. Email tickets, AI drafts, live chat widget.",
    url: "https://supportkit.threestack.io",
    siteName: "SupportKit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SupportKit — Customer Support for Indie SaaS",
    description: "Zendesk-level tools at $9/mo for indie SaaS teams.",
  },
  metadataBase: new URL("https://supportkit.threestack.io"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
