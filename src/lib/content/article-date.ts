const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatArticleDate(isoDate: string): string {
  if (!ISO_DATE.test(isoDate)) return isoDate;
  const parsed = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return FORMATTER.format(parsed);
}
