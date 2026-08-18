const DEFAULT_DESTINATION = "/academia/mi-academia";

export function safeInternalRedirect(value: string | null | undefined, fallback = DEFAULT_DESTINATION) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  try {
    const parsed = new URL(value, "https://cis.local");
    if (parsed.origin !== "https://cis.local") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
