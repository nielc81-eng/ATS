export const ACCOUNTS_STORAGE_KEY = "ai_resume_screening_accounts";
const allowedRoles = new Set(["Candidate", "Recruiter", "Administrator"]);

const demoAccounts = [
  {
    name: "Demo Candidate",
    email: "candidate@demo.com",
    password: "Demo123!",
    role: "Candidate",
  },
  {
    name: "Demo Recruiter",
    email: "recruiter@demo.com",
    password: "Demo123!",
    role: "Recruiter",
  },
  {
    name: "Platform Administrator",
    email: "admin@demo.com",
    password: "Demo123!",
    role: "Administrator",
  },
];

function readRawAccounts() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function mergeDemoAccounts(accounts) {
  const next = [...accounts];

  demoAccounts.forEach((demoAccount) => {
    const email = normalizeEmail(demoAccount.email);
    const exists = next.some((account) => normalizeEmail(account.email) === email);

    if (!exists) {
      next.push(demoAccount);
    }
  });

  return next;
}

function writeRawAccounts(accounts) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
}

export function ensureDemoAccounts() {
  const accounts = readRawAccounts();
  const next = mergeDemoAccounts(accounts);

  if (next.length !== accounts.length) {
    writeRawAccounts(next);
  } else if (accounts.length === 0) {
    writeRawAccounts(demoAccounts);
  }
}

export function getAccounts() {
  return readRawAccounts().filter(
    (account) =>
      account &&
      typeof account.email === "string" &&
      typeof account.password === "string" &&
      allowedRoles.has(account.role)
  );
}

export function getAccountByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;
  return (
    getAccounts().find(
      (account) => normalizeEmail(account.email) === normalizedEmail
    ) ?? null
  );
}

export function createAccount(payload) {
  const name = String(payload?.name || "").trim();
  const email = normalizeEmail(payload?.email);
  const password = String(payload?.password || "");
  const role = payload?.role;

  if (!name || !email || !password) {
    return { ok: false, message: "Please complete all required fields." };
  }

  if (role !== "Candidate" && role !== "Recruiter") {
    return {
      ok: false,
      message: "Public registration is limited to candidate and recruiter accounts.",
    };
  }

  const accounts = getAccounts();
  const exists = accounts.some(
    (account) => normalizeEmail(account.email) === email
  );

  if (exists) {
    return {
      ok: false,
      message: "An account with this email already exists. Please log in.",
    };
  }

  const next = [...accounts, { name, email, password, role }];
  writeRawAccounts(next);

  return {
    ok: true,
    account: { name, email, role },
  };
}

export function updateAccountRole(email, role) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return { ok: false, message: "A valid account email is required." };
  }

  if (!allowedRoles.has(role)) {
    return { ok: false, message: "Unsupported role update requested." };
  }

  const accounts = readRawAccounts();
  let found = false;

  const next = accounts.map((account) => {
    if (normalizeEmail(account.email) !== normalizedEmail) {
      return account;
    }

    found = true;
    return {
      ...account,
      role,
    };
  });

  if (!found) {
    return { ok: false, message: "Account not found." };
  }

  writeRawAccounts(next);

  const updated = next.find((account) => normalizeEmail(account.email) === normalizedEmail);

  return {
    ok: true,
    account: updated ? { ...updated } : null,
  };
}
