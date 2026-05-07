const ACCOUNTS_STORAGE_KEY = "ai_resume_screening_accounts";

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

function writeRawAccounts(accounts) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
}

export function ensureDemoAccounts() {
  const accounts = readRawAccounts();
  if (accounts.length > 0) return;
  writeRawAccounts(demoAccounts);
}

export function getAccounts() {
  return readRawAccounts().filter(
    (account) =>
      account &&
      typeof account.email === "string" &&
      typeof account.password === "string" &&
      (account.role === "Candidate" || account.role === "Recruiter")
  );
}

export function getAccountByEmail(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return null;
  return (
    getAccounts().find(
      (account) => String(account.email).trim().toLowerCase() === normalizedEmail
    ) ?? null
  );
}

export function createAccount(payload) {
  const name = String(payload?.name || "").trim();
  const email = String(payload?.email || "").trim().toLowerCase();
  const password = String(payload?.password || "");
  const role = payload?.role === "Recruiter" ? "Recruiter" : "Candidate";

  if (!name || !email || !password) {
    return { ok: false, message: "Please complete all required fields." };
  }

  const accounts = getAccounts();
  const exists = accounts.some(
    (account) => String(account.email).trim().toLowerCase() === email
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
