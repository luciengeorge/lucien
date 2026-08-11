export const CANONICAL_NAME = "Lucien George";

/*
 * Wrong spellings the site already earns impressions for, from the Search
 * Console export of 2026-08-11 (last three months, web): "lucien georges" (7
 * impressions, average position 8.7), "lucian george" (11, 14.4), "george
 * lucien" (1, 6.0). Google was matching all three to the entity with zero
 * occurrences of any of them anywhere in this repo.
 *
 * These are misspellings, not aliases, so they must NOT go in
 * Person.alternateName: that field asserts the item is also known by the name,
 * and the name takes no s. They belong in text that says outright which
 * spelling is correct, which is both truthful and the thing a search engine
 * needs in order to reconcile the query with the entity. Not hidden text
 * either: that is a spam violation, and being visible costs nothing here.
 *
 * The correction itself lives in content/bio.md, which /about renders and the
 * .md mirrors and RAG index read, plus a FAQ entry in the structured data.
 * This list exists so a test can assert both surfaces cover every spelling.
 */
export const NAME_MISSPELLINGS = ["Lucien Georges", "Lucian George", "George Lucien"] as const;
