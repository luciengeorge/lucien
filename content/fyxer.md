Lucien has worked at Fyxer as a Senior Product Engineer since September 2025.

He joined to build the notetaker: a native macOS and Windows desktop application (built with Electron) that records meetings in the background without requiring a notetaker bot to join the call. It was built after 48% of users expressed the desire to record meetings without a bot present. He led it alongside another developer named Serafin, a two-person team that operates like the CEOs of this feature within the larger Fyxer product. The app grew to 1,000 weekly active users and nearly 10,000 call recordings within months of launch. He also built Fyxer's AI-powered meeting chat interface, a data-heavy, real-time UI that lets users query and extract structured information from their meetings like decisions, action items, and summaries.

In April 2026 he moved onto Fyxer's B2B and Enterprise product. He still maintains the native notetaker app, but most of his time now goes on making sure Fyxer has what it takes to close enterprise deals: building the features large organisations treat as table stakes before they will buy.

That work has included:

- **Microsoft Marketplace.** A transactable listing and the fulfilment behind it, so an enterprise can buy Fyxer through the Microsoft billing relationship it already has. This covers seat enforcement, subscription state, and reconciling purchases that stall part-way through.
- **ROI dashboards.** Reporting that shows an organisation what it is actually getting back from the product, released to enterprise customers and extended with all-time reporting and historical backfill.
- **Outlook classic support.** Staged support for the older Outlook rendering engine, which meant rebuilding how Fyxer composes its emails and adding a blocking lint gate in CI so templates cannot silently regress.
- **Email signature handling.** Preserving rich pasted signatures instead of flattening them to images, syncing the most recent signature, and stopping AI signature extraction from picking up quoted reply chains.
- **SCIM provisioning.** Bringing Fyxer's SCIM 2.0 endpoint into line with RFC 7644 so enterprise identity providers can provision and deprovision users automatically. Microsoft Entra ID was sending standard, spec-compliant requests the endpoint could not handle, and the same users failed on every sync cycle. The fix meant supporting the whole PATCH operation set instead of a single case, and correcting error shapes, resource metadata and content types until the endpoint passed Microsoft's SCIM validator cleanly.
- **Managed settings.** Organisation-level configuration an administrator sets on behalf of their users, including custom brand fonts.
- **Enterprise onboarding and identity.** Fixing dead ends for SSO and SAML users, correcting invite and sign-up routing, and hardening sign-in.

Alongside the feature work, a large share of his time goes on the reliability of the recording and transcription pipeline: recovery paths for recordings and transcripts that get stuck, scheduled jobs that detect and repair stale state, and cutting error-reporting noise so that real failures stay visible.

His day-to-day includes user behavior analysis, user research, data analysis, long-term and short-term roadmaps, and building the product end-to-end.
