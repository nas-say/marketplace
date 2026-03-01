const SOCIAL_HANDLE_MAX_LENGTH = 39;

function hasScheme(value: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(value);
}

export function normalizeWebsiteUrl(input: string): { value: string; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) return { value: "" };

  const withScheme = hasScheme(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withScheme);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { value: "", error: "Website must use https:// or http://." };
    }
    if (!parsed.hostname) {
      return { value: "", error: "Website must include a valid domain." };
    }
    return { value: parsed.toString() };
  } catch {
    return { value: "", error: "Website must be a valid URL (for example: https://example.com)." };
  }
}

export function toSafeWebsiteUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  const normalized = normalizeWebsiteUrl(input);
  return normalized.error ? null : normalized.value;
}

export function normalizeTwitterHandle(input: string): { value: string; error?: string } {
  const value = input.replace(/^@+/, "").trim();
  if (!value) return { value: "" };
  if (!/^[A-Za-z0-9_]{1,15}$/.test(value)) {
    return { value: "", error: "Twitter handle must be 1-15 characters with letters, numbers, or underscores." };
  }
  return { value };
}

export function normalizeGithubHandle(input: string): { value: string; error?: string } {
  const value = input.replace(/^@+/, "").trim();
  if (!value) return { value: "" };
  if (value.length > SOCIAL_HANDLE_MAX_LENGTH) {
    return { value: "", error: "GitHub username is too long." };
  }
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(value)) {
    return { value: "", error: "GitHub username can use letters, numbers, and single hyphens (not at ends)." };
  }
  return { value };
}
