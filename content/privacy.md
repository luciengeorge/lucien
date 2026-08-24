This is a personal site with an AI assistant on it, not a product with accounts. Nobody needs to sign up, and there is nothing to buy. What follows is the whole picture of what gets collected, who processes it, and how to have it deleted.

## What the chat stores

The assistant on the homepage ("Poof") keeps the conversation so it can answer follow-up questions and so the thread survives a page reload. That means the messages you send and the replies you get are stored in a database (Convex), along with timestamps and which model answered. A signed, HTTP-only cookie named `lucien-conversation` holds nothing but an opaque conversation id and session id, so the browser can be handed back its own thread and not anybody else's.

Your messages are sent to OpenAI to generate each reply. OpenAI processes them as an API provider and, under its API terms, does not use them to train its models.

Do not type anything into the chat you would not want stored or read. Treat it as a message to a stranger's website, because that is what it is. Lucien can read the conversations, and does look at them to see where the assistant answers badly.

If you use the assistant's contact tool to send Lucien a message, that message, the name and contact detail you give it, and the conversation id are posted to a private Slack channel he owns, so the message reaches him.

## Analytics and error monitoring

The site measures traffic, not people. In production it loads:

- **Vercel Analytics** and **Vercel Speed Insights**, for page views and loading performance.
- **PostHog** (EU region), for product events such as which starter prompt was clicked. Autocapture is off, so it records only the events the code names explicitly, and it builds a person profile only for an identified user, which in practice means only the site's owner.
- **Google Analytics 4**, for page views.
- **Sentry**, for errors. The server-side setup sends default personal information alongside an error, which can include an IP address and request details, because a bug report without the request is usually not actionable.

None of this is used for advertising, none of it is sold, and there is no cross-site tracking or ad network on this site. Analytics and Sentry are skipped entirely outside production, so nothing is recorded while the site is being developed.

## Cookies

- `lucien-conversation`: the signed conversation and session id described above. Functional, and the chat does not work without it.
- Analytics cookies set by Google Analytics and PostHog.
- Authentication cookies, which only ever exist for the site's owner. Login is restricted to an allowlist of one, so there is no visitor account to create and no visitor password stored anywhere.

## Hosting and processors

The site runs on Vercel, behind Cloudflare, with data in Convex. The assistant uses OpenAI, product analytics use PostHog, and error monitoring uses Sentry. Resend sends the owner's own login emails and nothing else: the site never emails a visitor, because there is no visitor account and no mailing list. Each of these is a processor acting on instruction, and each has its own privacy policy. Data may be processed in the United States as well as the EU and the UK, depending on the provider.

## Your data, and getting rid of it

Email [lucienkgeorge@gmail.com](mailto:lucienkgeorge@gmail.com) to ask what is stored about you, to have a conversation deleted, or to have a contact message deleted. Say roughly when you used the site so the right thread can be found. There is no form and no ticket queue: it is one person reading email, and requests get handled.

Chat conversations are kept while they are useful for improving the assistant. Nothing here is retained for advertising, and nothing is retained to build a profile of you.

## Changes

If what the site collects changes, this page changes with it, in the same commit. Its history is public in the repository behind [github.com/luciengeorge](https://github.com/luciengeorge), so you can see exactly what changed and when.
