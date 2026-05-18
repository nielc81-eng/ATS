function normalizeText(value) {
  return String(value || "").trim();
}

export function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function slugify(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function hashText(value) {
  let hash = 2166136261;
  const text = String(value || "");
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash +=
      (hash << 1) +
      (hash << 4) +
      (hash << 7) +
      (hash << 8) +
      (hash << 24);
  }
  return (hash >>> 0).toString(36);
}

export function createPersonKey({ email = "", legacyId = "", fallbackName = "" } = {}) {
  const normalizedEmail = normalizeEmail(email);
  if (normalizedEmail) {
    return `email:${normalizedEmail}`;
  }

  const normalizedLegacyId = normalizeText(legacyId);
  if (normalizedLegacyId) {
    return `legacy:${slugify(normalizedLegacyId) || hashText(normalizedLegacyId)}`;
  }

  const normalizedFallback = normalizeText(fallbackName);
  if (normalizedFallback) {
    return `name:${slugify(normalizedFallback) || hashText(normalizedFallback)}`;
  }

  return `anonymous:${hashText("anonymous")}`;
}

export function buildCanonicalPersonRef({
  email = "",
  name = "",
  legacyId = "",
  role = "",
} = {}) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedLegacyId = normalizeText(legacyId);
  return {
    personKey: createPersonKey({
      email: normalizedEmail,
      legacyId: normalizedLegacyId,
      fallbackName: name,
    }),
    email: normalizedEmail,
    name: normalizeText(name),
    role: normalizeText(role),
    legacyIds: normalizedLegacyId ? [normalizedLegacyId] : [],
  };
}
