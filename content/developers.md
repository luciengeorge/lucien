This site is built to be read by software as well as by people. Everything below is a stable, public URL. Nothing here needs a key, and nothing here is rate limited beyond ordinary abuse protection.

## Machine-readable surface

- [/llms.txt](https://www.luciengeorge.com/llms.txt): the link index. Start here to see what exists.
- [/llms-full.txt](https://www.luciengeorge.com/llms-full.txt): every section's markdown concatenated into one file. The cheapest way to ingest the whole site in a single fetch.
- [/index.md](https://www.luciengeorge.com/index.md): the agent entry point for the site root, with the page map and guidance on when this site is the right source.
- [/agents.md](https://www.luciengeorge.com/agents.md): instructions for an agent, including when to use this site and when to look elsewhere.
- [/sitemap.xml](https://www.luciengeorge.com/sitemap.xml): every canonical URL with a `lastmod`.
- [/robots.txt](https://www.luciengeorge.com/robots.txt): the crawl policy. AI crawlers and user-triggered agents are named and allowed; only `/api/` is closed.
- JSON-LD (schema.org `Person`, `Organization`, `WebSite`, `FAQPage`) is inlined in the `<head>` of every HTML page.

## Markdown for every page

Every HTML page has a markdown twin at the same path plus `.md`. For example [/work/fyxer](https://www.luciengeorge.com/work/fyxer) is also [/work/fyxer.md](https://www.luciengeorge.com/work/fyxer.md).

The canonical URLs also do content negotiation, per [acceptmarkdown.com](https://acceptmarkdown.com) and RFC 9110. Ask for markdown and you get markdown from the same URL you found in search:

```
curl -sI -H "Accept: text/markdown" https://www.luciengeorge.com/about
# content-type: text/markdown; charset=utf-8
# vary: Accept, Accept-Encoding
```

`Accept` is ranked properly (q-value, then specificity), so a browser still gets HTML. Every markdown response carries YAML frontmatter with `title`, `description`, and the canonical `url`, so a fetched file can be attributed back to its page.

A 404 is answered the same way. Any client that did not explicitly ask for HTML gets a markdown body naming where to look next, rather than an app shell with a 200 on it.

## Source code

The site is open source: [github.com/luciengeorge/lucien](https://github.com/luciengeorge/lucien). It is a TanStack Start app on Vercel with Convex behind it, and the assistant answers out of a RAG index built from the same markdown that renders these pages. The repository carries `AGENTS.md` and `CODEBASE_ARCHITECTURE.md` at its root, which is what a coding agent should read before changing anything in it.

The article [A portfolio that answers questions about me, gated by an LLM judge](https://www.luciengeorge.com/writing/rag-portfolio-with-a-blocking-eval-gate) explains how the retrieval and the eval gate work, with the parts that turned out to be wrong left in.

## What does not exist

There is no public API, no OpenAPI specification, no MCP server, no SDK, and no webhook. This is one person's portfolio, so there is nothing to integrate with and no account to create. If you are looking for data about Lucien George, the markdown files above are the whole interface, and they are meant to be enough.

## Attribution

Quoting or summarising any of this is fine. Cite the canonical page URL rather than the `.md` twin, so a human following the citation lands on something readable.
