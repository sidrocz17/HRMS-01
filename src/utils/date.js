export const parseApiDate = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Many backends emit ISO strings with fractional seconds > 3 digits
  // (e.g. "2026-03-30T11:26:09.955937Z"), which `Date` may fail to parse.
  const normalized = trimmed.replace(
    /(\.\d{3})\d+(?=(Z|[+-]\d{2}:\d{2})$)/,
    "$1"
  );

  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  // Fallback for "YYYY-MM-DD HH:mm:ss" shapes.
  const alt = new Date(normalized.replace(" ", "T"));
  if (!Number.isNaN(alt.getTime())) return alt;

  return null;
};

export const formatDisplayDate = (value, locale = "en-GB") => {
  const date = parseApiDate(value);
  if (!date) return "";

  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

