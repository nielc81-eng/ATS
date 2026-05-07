import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "ai_resume_screening_session";

const AuthContext = createContext(null);

function readStoredSession() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    if (parsed.role !== "Candidate" && parsed.role !== "Recruiter") {
      return null;
    }

    if (typeof parsed.token !== "string" || !parsed.token.trim()) {
      return null;
    }

    return {
      token: parsed.token.trim(),
      role: parsed.role,
      name: typeof parsed.name === "string" ? parsed.name : "",
    };
  } catch {
    return null;
  }
}

function persistSession(session) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readStoredSession());

  const login = useCallback((nextSession) => {
    const normalized = {
      token:
        typeof nextSession?.token === "string" && nextSession.token.trim()
          ? nextSession.token.trim()
          : `demo-${Date.now()}`,
      role: nextSession?.role === "Recruiter" ? "Recruiter" : "Candidate",
      name:
        typeof nextSession?.name === "string" && nextSession.name.trim()
          ? nextSession.name.trim()
          : nextSession?.role === "Recruiter"
            ? "Recruiter"
            : "Candidate",
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
