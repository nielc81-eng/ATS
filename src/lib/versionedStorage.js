function readRaw(key) {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key, value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value);
}

function parseJson(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function createVersionedStorageAdapter({
  key,
  version,
  seed,
  migrate,
}) {
  function read() {
    if (typeof window === "undefined") {
      return typeof seed === "function" ? seed() : seed;
    }

    const raw = readRaw(key);
    const parsed = parseJson(raw);

    if (!parsed) {
      return typeof seed === "function" ? seed() : seed;
    }

    const hasEnvelope =
      parsed && typeof parsed === "object" && !Array.isArray(parsed) && "schemaVersion" in parsed;

    if (hasEnvelope) {
      const storedVersion = Number(parsed.schemaVersion) || 1;
      const data = "data" in parsed ? parsed.data : null;
      if (storedVersion === version) {
        return data;
      }
      const migrated = typeof migrate === "function" ? migrate(data, storedVersion) : data;
      write({ schemaVersion: version, data: migrated });
      return migrated;
    }

    const migratedLegacy =
      typeof migrate === "function" ? migrate(parsed, 0) : parsed;
    write({ schemaVersion: version, data: migratedLegacy });
    return migratedLegacy;
  }

  function write(envelope) {
    writeRaw(key, JSON.stringify(envelope));
  }

  function save(data) {
    write({ schemaVersion: version, data });
  }

  return { key, version, read, save };
}
