export function coercePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export function clampInt(value, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

export function paginate(items, { page, pageSize } = {}) {
  const safeItems = Array.isArray(items) ? items : [];
  const totalItems = safeItems.length;

  const safePageSize = coercePositiveInt(pageSize, 1);
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const safePage = clampInt(coercePositiveInt(page, 1), 1, totalPages);

  const startIndex = (safePage - 1) * safePageSize;
  const endIndex = Math.min(totalItems, startIndex + safePageSize);

  return {
    totalItems,
    totalPages,
    page: safePage,
    pageSize: safePageSize,
    startIndex,
    endIndex,
    pageItems: safeItems.slice(startIndex, endIndex),
  };
}

