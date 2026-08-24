import { CANONICAL_NAME } from "#/lib/name-misspellings";
import { SOCIAL_LINKS } from "#/lib/social-links";

const SITE_URL = "https://www.luciengeorge.com";
const OG_IMAGE_URL = `${SITE_URL}/cover.png`;
const CONTACT_EMAIL = "lucienkgeorge@gmail.com";
const DESCRIPTION =
  "Senior Product Engineer at Fyxer. Explore Lucien George's work, projects, and interests via Poof, his AI portfolio assistant.";

export const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    /*
     * The publisher of this site, as an entity distinct from the person: an
     * audit (and a search engine) looks for Organization when it wants an
     * address and a way to make contact, and answering that with the employer
     * nested under `worksFor` would mean inventing Fyxer's postal address.
     */
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: CANONICAL_NAME,
      alternateName: "luciengeorge.com",
      description:
        "The personal site of Lucien George, Senior Product Engineer at Fyxer: his work history, writing, and an AI assistant that answers questions about them.",
      url: SITE_URL,
      logo: `${SITE_URL}/initials.svg`,
      image: OG_IMAGE_URL,
      email: CONTACT_EMAIL,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "professional enquiries",
        email: CONTACT_EMAIL,
        url: `${SITE_URL}/contact`,
        availableLanguage: ["English", "French", "Arabic"],
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: "London",
        addressRegion: "England",
        addressCountry: "GB",
      },
      areaServed: { "@type": "Place", name: "Worldwide" },
      founder: { "@id": `${SITE_URL}/#person` },
      sameAs: SOCIAL_LINKS.map((link) => link.href),
    },
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: CANONICAL_NAME,
      givenName: "Lucien",
      familyName: "George",
      jobTitle: "Senior Product Engineer",
      description:
        "Senior Product Engineer at Fyxer. Builds products end-to-end, teaches, races karts, and runs ultras in London. Originally from Beirut, Lebanon.",
      image: OG_IMAGE_URL,
      url: SITE_URL,
      email: CONTACT_EMAIL,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "professional enquiries",
        email: CONTACT_EMAIL,
        url: `${SITE_URL}/contact`,
        availableLanguage: ["English", "French", "Arabic"],
      },
      sameAs: SOCIAL_LINKS.map((link) => link.href),
      address: { "@type": "PostalAddress", addressLocality: "London", addressCountry: "GB" },
      birthPlace: { "@type": "Place", name: "Beirut, Lebanon" },
      nationality: { "@type": "Country", name: "Lebanon" },
      knowsLanguage: ["English", "French", "Arabic"],
      knowsAbout: [
        "TypeScript",
        "JavaScript",
        "React",
        "TanStack",
        "Tailwind CSS",
        "Convex",
        "AI applications",
        "RAG",
        "Ruby on Rails",
        "Python",
        "Electron",
        "Native iOS",
        "Native Android",
        "React Native",
      ],
      alumniOf: [
        { "@type": "EducationalOrganization", name: "McGill University" },
        { "@type": "EducationalOrganization", name: "Le Wagon" },
        { "@type": "EducationalOrganization", name: "Harvard Business School" },
        { "@type": "EducationalOrganization", name: "University of New South Wales" },
      ],
      worksFor: { "@type": "Organization", name: "Fyxer", url: "https://www.fyxer.com" },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      description: DESCRIPTION,
      image: OG_IMAGE_URL,
      name: "Lucien George",
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#person` },
      inLanguage: "en-GB",
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "Who is Lucien George?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Lucien George is a Senior Product Engineer at Fyxer, based in London and originally from Beirut, Lebanon. He builds products end-to-end and previously worked at Shopify, Le Wagon, and co-founded Localista, Skyla, and Impact Lebanon.",
          },
        },
        {
          "@type": "Question",
          name: "Is it Lucien George or Lucien Georges?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The name is Lucien George, no s. It gets written Lucien Georges or Lucian George often enough that both turn up in search, and George Lucien reverses it, but all three are wrong: it is Lucien George.",
          },
        },
        {
          "@type": "Question",
          name: "What does Lucien do at Fyxer?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Lucien is a Senior Product Engineer leading development of Fyxer's notetaker product - a native macOS and Windows desktop app (Electron) that records meetings in the background without a bot. The product reached 1,000 weekly active users within months of launch.",
          },
        },
        {
          "@type": "Question",
          name: "Where is Lucien based?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Lucien is based in London, UK. He grew up in Beirut, Lebanon, and lived in Montreal, Canada while studying software engineering at McGill University.",
          },
        },
        {
          "@type": "Question",
          name: "What is Lucien's tech stack?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Lucien's primary stack is TypeScript and React with the TanStack ecosystem (Start, Router, Query, Form), Tailwind CSS, shadcn/ui, and Convex on the backend. He has deep experience with Ruby on Rails, Python, Electron, and native mobile (Swift/Kotlin/React Native).",
          },
        },
        {
          "@type": "Question",
          name: "Where did Lucien study?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Lucien holds a Bachelor of Engineering in Software Engineering from McGill University (2013–2018), with an exchange semester at UNSW Sydney. He also attended Le Wagon London (Batch #190, 2018) and Harvard Business School's Families in Business program (2022).",
          },
        },
        {
          "@type": "Question",
          name: "What languages does Lucien speak?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Lucien speaks English, French, and Arabic fluently.",
          },
        },
      ],
    },
  ],
};
