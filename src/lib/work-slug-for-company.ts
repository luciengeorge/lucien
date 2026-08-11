import { WORK_META } from "#/lib/content/work-meta";

function normalise(company: string): string {
  return company.trim().toLowerCase();
}

export function workSlugForCompany(company: string): string | undefined {
  const needle = normalise(company);
  if (!needle) return undefined;

  return WORK_META.find(
    (entry) =>
      normalise(entry.company) === needle || (entry.resumeCompanies ?? []).some((alias) => normalise(alias) === needle),
  )?.slug;
}
