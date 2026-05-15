import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ACCOUNTS_STORAGE_KEY,
  ensureDemoAccounts,
  getAccountByEmail,
  getAccounts,
} from "../lib/mockAuthStore";

const STORAGE_KEY = "ai_resume_screening_session";
const allowedRoles = new Set([
  "Candidate",
  "Recruiter",
  "DeploymentManager",
  "Administrator",
]);

const AuthContext = createContext(null);

function readStoredSession() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    if (!allowedRoles.has(parsed.role)) {
      return null;
    }

    if (typeof parsed.token !== "string" || !parsed.token.trim()) {
      return null;
    }

    return {
      token: parsed.token.trim(),
      role: parsed.role,
      name: typeof parsed.name === "string" ? parsed.name : "",
      email: typeof parsed.email === "string" ? parsed.email.trim().toLowerCase() : "",
    };
  } catch {
    return null;
  }
}

function persistSession(session) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function resolveSessionAccount(session) {
  const email = String(session?.email || "").trim().toLowerCase();
  if (email) {
    return getAccountByEmail(email);
  }

  const name = String(session?.name || "").trim().toLowerCase();
  if (!name) return null;

  const matches = getAccounts().filter(
    (account) =>
      account.role === session?.role &&
      String(account.name || "").trim().toLowerCase() === name
  );

  return matches.length === 1 ? matches[0] : null;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readStoredSession());

  const login = useCallback((nextSession) => {
    const role = allowedRoles.has(nextSession?.role)
      ? nextSession.role
      : "Candidate";

    const normalized = {
      token:
        typeof nextSession?.token === "string" && nextSession.token.trim()
          ? nextSession.token.trim()
          : `demo-${Date.now()}`,
      role,
      name:
        typeof nextSession?.name === "string" && nextSession.name.trim()
          ? nextSession.name.trim()
          : role,
      email:
        typeof nextSession?.email === "string" && nextSession.email.trim()
          ? nextSession.email.trim().toLowerCase()
          : "",
    };

    setSession(normalized);
    persistSession(normalized);
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    ensureDemoAccounts();
  }, []);

  useEffect(() => {
    if (!session?.token) return undefined;

    const syncSessionStatus = () => {
      const account = resolveSessionAccount(session);
      const isArchived = account?.status === "Archived";
      const roleMismatch = account?.role && account.role !== session.role;

      if (!account || isArchived || roleMismatch) {
        logout();
        return;
      }

      const nextName = typeof account?.name === "string" ? account.name.trim() : "";
      if (nextName && nextName !== session.name) {
        const nextSession = { ...session, name: nextName };
        setSession(nextSession);
        persistSession(nextSession);
      }
    };

    syncSessionStatus();

    const handleStorage = (event) => {
      if (event.key === ACCOUNTS_STORAGE_KEY) {
        syncSessionStatus();
      }
    };

    window.addEventListener("storage", handleStorage);
    const timer = window.setInterval(syncSessionStatus, 3000);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.clearInterval(timer);
    };
  }, [session, logout]);

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session?.token),
      login,
      logout,
    }),
    [session, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
