import { getCollection } from "astro:content";

export async function GET() {
  const site = "https://dipakwani.com";
  const posts = await getCollection("writing");
  const staticRoutes = [
    "",
    "work/",
    "writing/",
    "writing/papers/",
    "writing/fiction/",
    "reading/",
    "signals/",
    "business/",
    "about/",
    "f1/",
    "ai-mafia/",
    "routine/"
  ];

  const urls = [
    ...staticRoutes.map((path) => `${site}/${path}`),
    ...posts.map((post) => `${site}/writing/${post.id.replace(/\.md$/, "")}/`)
  ];

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}
</urlset>`, {
    headers: { "Content-Type": "application/xml; charset=utf-8" }
  });
}
