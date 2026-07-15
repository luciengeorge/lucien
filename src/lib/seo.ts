interface SeoHeadInput {
  title: string;
  description: string;
  url: string;
  type: string; // og:type - pass explicitly per route ("profile" | "website" | "article")
  image?: string; // when present, adds og:image AND twitter:image (resume only today)
  jsonLd?: ReadonlyArray<unknown>; // one <script> per non-nullish entry, in order
}

interface SeoHead {
  meta: Array<Record<string, string>>;
  links: Array<{ rel: string; href: string }>;
  scripts: Array<{ type: string; children: string }>;
}

export function buildSeoHead({ title, description, url, type, image, jsonLd = [] }: SeoHeadInput): SeoHead {
  const meta: Array<Record<string, string>> = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:type", content: type },
    ...(image ? [{ property: "og:image", content: image }] : []),
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    ...(image ? [{ name: "twitter:image", content: image }] : []),
  ];
  const scripts = jsonLd
    .filter((entry) => entry != null)
    .map((entry) => ({ type: "application/ld+json", children: JSON.stringify(entry) }));
  return { meta, links: [{ rel: "canonical", href: url }], scripts };
}
