import { CANONICAL_NAME, NAME_MISSPELLINGS } from "#/lib/name-misspellings";
import { structuredData } from "#/lib/structured-data";
import { describe, expect, it } from "vitest";

interface PersonNode {
  "@type": string;
  name: string;
  alternateName?: string[];
}

function isPersonNode(value: unknown): value is PersonNode {
  return typeof value === "object" && value !== null && "@type" in value && value["@type"] === "Person";
}

function personNode(): PersonNode {
  const node = structuredData["@graph"].find((entry) => isPersonNode(entry));
  if (!isPersonNode(node)) {
    throw new Error("No Person node in the structured data graph");
  }
  return node;
}

describe("Person structured data", () => {
  it("carries the canonical spelling as the name", () => {
    expect(personNode().name).toBe(CANONICAL_NAME);
  });

  /*
   * A misspelling is not an alias. alternateName asserts the person is also
   * known by that name, and "Lucien Georges" takes an s the name does not.
   * The search coverage for these queries comes from prose that names the
   * correct spelling, never from claiming the wrong one as a name.
   */
  it("never claims a misspelling as an alternateName", () => {
    const { alternateName } = personNode();
    for (const misspelling of NAME_MISSPELLINGS) {
      expect(alternateName ?? []).not.toContain(misspelling);
    }
  });

  it("answers the spelling question in the FAQ, where the correct spelling is stated", () => {
    const serialized = JSON.stringify(structuredData);
    expect(serialized).toContain("no s");
    for (const misspelling of NAME_MISSPELLINGS) {
      expect(serialized).toContain(misspelling);
    }
  });
});

interface OrganizationNode {
  "@type": string;
  "@id": string;
  name: string;
  url: string;
  contactPoint?: { "@type": string; contactType?: string; email?: string; url?: string };
  address?: { "@type": string; addressLocality?: string; addressCountry?: string };
}

function isOrganizationNode(value: unknown): value is OrganizationNode {
  return typeof value === "object" && value !== null && "@type" in value && value["@type"] === "Organization";
}

function organizationNode(): OrganizationNode {
  const node = structuredData["@graph"].find((entry) => isOrganizationNode(entry));
  if (!isOrganizationNode(node)) {
    throw new Error("No Organization node in the structured data graph");
  }
  return node;
}

describe("Organization structured data", () => {
  it("publishes an Organization node for the site, identified by @id", () => {
    const organization = organizationNode();
    expect(organization["@id"]).toBe("https://www.luciengeorge.com/#organization");
    expect(organization.name).toBe(CANONICAL_NAME);
    expect(organization.url).toBe("https://www.luciengeorge.com");
  });

  it("carries a contactPoint with a contactType and a reachable email", () => {
    const { contactPoint } = organizationNode();
    expect(contactPoint?.["@type"]).toBe("ContactPoint");
    expect(contactPoint?.contactType).toBeTruthy();
    expect(contactPoint?.email).toBe("lucienkgeorge@gmail.com");
    expect(contactPoint?.url).toBe("https://www.luciengeorge.com/contact");
  });

  it("carries a PostalAddress", () => {
    const { address } = organizationNode();
    expect(address?.["@type"]).toBe("PostalAddress");
    expect(address?.addressLocality).toBe("London");
    expect(address?.addressCountry).toBe("GB");
  });

  /*
   * The audit reads the first Organization in the graph. Fyxer is an employer,
   * not the publisher of this site, and inventing an address or a phone number
   * for someone else's company is not an option, so the site's own node comes
   * first.
   */
  it("puts the site's own Organization ahead of any employer Organization", () => {
    const serialized = JSON.stringify(structuredData);
    expect(serialized.indexOf('"@id":"https://www.luciengeorge.com/#organization"')).toBeLessThan(
      serialized.indexOf('"name":"Fyxer"'),
    );
    expect(structuredData["@graph"][0]).toBe(organizationNode());
  });

  it("keeps the Person node complete, so the identity signal that already passes does not regress", () => {
    const person = JSON.parse(JSON.stringify(personNode()));
    expect(person["@id"]).toBe("https://www.luciengeorge.com/#person");
    expect(person.url).toBe("https://www.luciengeorge.com");
    expect(person.jobTitle).toBe("Senior Product Engineer");
    expect(person.description).toBeTruthy();
    expect(person.sameAs.length).toBeGreaterThan(1);
    expect(person.worksFor.name).toBe("Fyxer");
  });

  it("also gives the Person a contactPoint, so either node answers a contact query", () => {
    const person = JSON.parse(JSON.stringify(personNode()));
    expect(person.contactPoint?.["@type"]).toBe("ContactPoint");
    expect(person.contactPoint?.email).toBe("lucienkgeorge@gmail.com");
  });
});
