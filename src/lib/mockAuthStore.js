export const ACCOUNTS_STORAGE_KEY = "ai_resume_screening_accounts";
const allowedRoles = new Set([
  "Candidate",
  "Recruiter",
  "DeploymentManager",
  "Administrator",
]);
const allowedStatuses = new Set(["Active", "Archived"]);
const lockedAdminEmail = "admin@demo.com";

const demoAccounts = [
  {
    name: "Demo Candidate",
    email: "candidate@demo.com",
    password: "Demo123!",
    role: "Candidate",
    status: "Active",
    archivedAt: "",
    archivedBy: "",
    archiveReason: "",
  },
  {
    name: "Demo Recruiter",
    email: "recruiter@demo.com",
    password: "Demo123!",
    role: "Recruiter",
    status: "Active",
    archivedAt: "",
    archivedBy: "",
    archiveReason: "",
  },
  {
    name: "Platform Administrator",
    email: "admin@demo.com",
    password: "Demo123!",
    role: "Administrator",
    status: "Active",
    archivedAt: "",
    archivedBy: "",
    archiveReason: "",
  },
  {
    name: "Deployment Manager",
    email: "deployment@demo.com",
    password: "Demo123!",
    role: "DeploymentManager",
    status: "Active",
    archivedAt: "",
    archivedBy: "",
    archiveReason: "",
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

function normalizeStatus(value) {
  return allowedStatuses.has(value) ? value : "Active";
}

function normalizeAccount(account) {
  if (!account || typeof account !== "object") return null;

  const email = normalizeEmail(account.email);
  const password = typeof account.password === "string" ? account.password : "";
  const role = allowedRoles.has(account.role) ? account.role : "Candidate";
  const status = normalizeStatus(account.status);

  if (!email || !password) return null;

  return {
    name: String(account.name || "").trim(),
    email,
    password,
    role,
    status,
    archivedAt:
      status === "Archived" && typeof account.archivedAt === "string"
        ? account.archivedAt
        : "",
    archivedBy:
      status === "Archived" && typeof account.archivedBy === "string"
        ? account.archivedBy
        : "",
    archiveReason:
      status === "Archived" && typeof account.archiveReason === "string"
        ? account.archiveReason
        : "",
  };
}

function mergeDemoAccounts(accounts) {
  const normalizedAccounts = accounts.map(normalizeAccount).filter(Boolean);
  const next = [...normalizedAccounts];

  demoAccounts.forEach((demoAccount) => {
    const normalizedDemo = normalizeAccount(demoAccount);
    if (!normalizedDemo) return;

    const email = normalizeEmail(demoAccount.email);
    const index = next.findIndex((account) => normalizeEmail(account.email) === email);

    if (index === -1) {
      next.push(normalizedDemo);
      return;
    }

    next[index] = {
      ...next[index],
      role: next[index].role || normalizedDemo.role,
      status: next[index].status || "Active",
    };
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
  return readRawAccounts().map(normalizeAccount).filter(Boolean);
}

export function getActiveAccounts() {
  return getAccounts().filter((account) => account.status !== "Archived");
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
      message: "Public registration is limited to candidate and talent acquisition accounts.",
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

  const next = [
    ...accounts,
    {
      name,
      email,
      password,
      role,
      status: "Active",
      archivedAt: "",
      archivedBy: "",
      archiveReason: "",
    },
  ];
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

export function updateAccountProfile(email, payload) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return { ok: false, message: "A valid account email is required." };
  }

  const nextName = String(payload?.name || "").trim();
  const nextPassword = typeof payload?.password === "string" ? payload.password : "";

  if (!nextName) {
    return { ok: false, message: "Name is required." };
  }

  if (nextPassword && nextPassword.length < 8) {
    return { ok: false, message: "Password must be at least 8 characters." };
  }

  const accounts = readRawAccounts().map(normalizeAccount).filter(Boolean);
  let found = false;

  const next = accounts.map((account) => {
    if (normalizeEmail(account.email) !== normalizedEmail) {
      return account;
    }

    found = true;

    return {
      ...account,
      name: nextName,
      password: nextPassword ? nextPassword : account.password,
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

function updateAccountStatus(email, status, options = {}) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return { ok: false, message: "A valid account email is required." };
  }

  if (!allowedStatuses.has(status)) {
    return { ok: false, message: "Unsupported account status update requested." };
  }

  if (normalizedEmail === lockedAdminEmail && status === "Archived") {
    return { ok: false, message: "The seeded administrator account cannot be archived." };
  }

  const accounts = readRawAccounts().map(normalizeAccount).filter(Boolean);
  let found = false;

  const next = accounts.map((account) => {
    if (normalizeEmail(account.email) !== normalizedEmail) {
      return account;
    }

    found = true;

    if (status === "Archived") {
      return {
        ...account,
        status: "Archived",
        archivedAt: new Date().toISOString(),
        archivedBy: String(options.archivedBy || "Administrator").trim(),
        archiveReason: String(options.archiveReason || "").trim(),
      };
    }

    return {
      ...account,
      status: "Active",
      archivedAt: "",
      archivedBy: "",
      archiveReason: "",
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

export function archiveAccount(email, options = {}) {
  return updateAccountStatus(email, "Archived", options);
}

export function restoreAccount(email) {
  return updateAccountStatus(email, "Active");
}
