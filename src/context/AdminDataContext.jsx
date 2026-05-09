import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ADMIN_AUDIT_STORAGE_KEY,
  ensureAdminMockData,
  getAdminAuditEvents,
  getAdminUsers,
  recordAdminAuditEvent,
  updateAdminUserRole,
} from "../lib/adminMockData";
import { ACCOUNTS_STORAGE_KEY } from "../lib/mockAuthStore";

const AdminDataContext = createContext(null);

export function AdminDataProvider({ children }) {
  const [users, setUsers] = useState(() => getAdminUsers());
  const [auditEvents, setAuditEvents] = useState(() => getAdminAuditEvents());

  const sync = useCallback(() => {
    ensureAdminMockData();
    setUsers(getAdminUsers());
    setAuditEvents(getAdminAuditEvents());
  }, []);

  useEffect(() => {
    sync();

    const handleStorage = (event) => {
      if (event.key === ACCOUNTS_STORAGE_KEY || event.key === ADMIN_AUDIT_STORAGE_KEY) {
        sync();
      }
    };

    window.addEventListener("storage", handleStorage);
    const timer = window.setInterval(sync, 3000);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.clearInterval(timer);
    };
  }, [sync]);

  const updateUserRole = useCallback(
    (email, role) => {
      const result = updateAdminUserRole(email, role);
      if (!result.ok) return result;
      sync();
      return result;
    },
    [sync]
  );

  const addAuditEvent = useCallback(
    (payload) => {
      const entry = recordAdminAuditEvent(payload);
      sync();
      return entry;
    },
    [sync]
  );

  const value = useMemo(
    () => ({
      users,
      auditEvents,
      updateUserRole,
      addAuditEvent,
      refreshAdminData: sync,
    }),
    [users, auditEvents, updateUserRole, addAuditEvent, sync]
  );

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData() {
  const context = useContext(AdminDataContext);

  if (!context) {
    throw new Error("useAdminData must be used within an AdminDataProvider");
  }

  return context;
}
