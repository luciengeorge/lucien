This is a personal site with an AI assistant on it, not a product with accounts. Nobody signs up, nothing is sold, and there is no advertising or cross-site tracking anywhere on it. What follows is the whole picture.

## What the chat stores

The assistant on the homepage ("Poof") keeps your conversation so it can answer follow-up questions and survive a page reload: your messages and its replies, stored in a database, with timestamps and which model answered. A signed, HTTP-only cookie holds nothing but an opaque conversation id, so a browser gets handed back its own thread and nobody else's. Your messages go to OpenAI to generate each reply; under its API terms it does not use them to train its models.

Do not type anything into the chat you would not want stored or read. Treat it as a message to a stranger's website, because that is what it is: Lucien can read the conversations, and does read them to find where the assistant answers badly. If you use the assistant to send him a message, that message and any contact detail you give it are posted to a private Slack channel so it reaches him.

## Analytics and errors

The site measures traffic, not people. In production only: Vercel Analytics and Speed Insights for page views and performance, PostHog for a short list of events the code names explicitly, and Sentry for errors. PostHog runs in cookieless mode, storing nothing in your browser. Sentry's server setup sends default personal information with an error, which can include an IP address, because a bug report without the request is not actionable.

## Cookies

Four at most, none for advertising or tracking, and every one of them HTTP-only:

- The conversation id above, without which the chat does not work.
- A one-shot cookie that carries a status message across a page load, so an action can report its own result. It holds the message and nothing else.
- `cf_clearance`, set by Cloudflare, which sits in front of this site. It records that your browser passed a bot check, so you are not challenged on every page. Cloudflare sets it, not this site.
- Sign-in cookies, which only ever exist for the site's owner: sign-in is an allowlist of one, so there is no visitor account and no visitor password anywhere.

That is the complete list. All four are strictly necessary, which is why the site has no cookie banner.

## Legal basis and processors

The lawful basis is legitimate interests: running a personal site, answering questions about its owner, keeping it working, and knowing roughly how it is used. Nothing here feeds an automated decision about you.

Processors, each acting on instruction and each with its own privacy policy: **Vercel** (hosting), **Cloudflare** (network), **Convex** (database), **OpenAI** (replies), **PostHog** (analytics, EU region), **Sentry** (errors), **Slack** (contact messages), and **Resend**, which sends the owner's sign-in emails and nothing else. Data may be processed in the United States as well as the EU and UK, depending on the provider.

## Retention, your rights, complaints

Conversations are kept while they are useful for improving the assistant. There is no automatic expiry today, so one stays until it is deleted on request or stops being useful.

Email [lucienkgeorge@gmail.com](mailto:lucienkgeorge@gmail.com) to ask what is stored about you, get a copy, or have a conversation or contact message deleted. Say roughly when you used the site so the right thread can be found. No form, no ticket queue: one person reading email.

In the UK and EU you can also complain to a data protection regulator. In the UK that is the Information Commissioner's Office, [ico.org.uk](https://ico.org.uk).
