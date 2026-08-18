import type { MetadataRoute } from "next";
import { site } from "@/data/site";
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: site.url, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${site.url}/academia`, lastModified, changeFrequency: "monthly", priority: .8 },
    { url: `${site.url}/academia/kit-5p`, lastModified, changeFrequency: "monthly", priority: .9 },
    { url: `${site.url}/academia/kit-5p/recursos`, lastModified, changeFrequency: "monthly", priority: .7 },
  ];
}
