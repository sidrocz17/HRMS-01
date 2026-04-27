const STATUS_CODE_ONLY_REGEX = /^\s*(?:error\s*)?\d{3}\s*:?\s*/i;
const AXIOS_STATUS_REGEX =
  /^\s*request failed with status code \d{3}\s*:?\s*/i;

export const sanitizeErrorMessage = (
  message,
  fallback = "Something went wrong.",
) => {
  if (typeof message !== "string") return fallback;

  const normalized = message
    .replace(AXIOS_STATUS_REGEX, "")
    .replace(STATUS_CODE_ONLY_REGEX, "")
    .trim();

  return normalized || fallback;
};

export const extractApiErrorMessage = (
  error,
  fallback = "Something went wrong.",
) => {
  const candidates = [
    error?.response?.data?.message,
    error?.response?.data?.error,
    error?.message,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return sanitizeErrorMessage(candidate, fallback);
    }
  }

  return fallback;
};
