import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/tickets", "/contacts", "/settings", "/api/"],
      },
    ],
    sitemap: "https://supportkit.threestack.io/sitemap.xml",
  };
}
