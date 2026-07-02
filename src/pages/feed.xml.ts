import { getCollection } from "astro:content";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function GET() {
  const site = "https://dipakwani.com";
  const posts = (await getCollection("writing")).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Dipak Wani Writing</title>
    <link>${site}/writing/</link>
    <description>Essays, AI notes, paper walkthroughs, fiction, and business notes by Dipak Wani.</description>
${posts.map((post) => `    <item>
      <title>${escapeXml(post.data.title)}</title>
      <link>${site}/writing/${post.id.replace(/\.md$/, "")}/</link>
      <guid>${site}/writing/${post.id.replace(/\.md$/, "")}/</guid>
      <pubDate>${post.data.date.toUTCString()}</pubDate>
      <description>${escapeXml(post.data.abstract)}</description>
    </item>`).join("\n")}
  </channel>
</rss>`, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" }
  });
}
