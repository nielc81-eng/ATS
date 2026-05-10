import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import {
  addTalentToPool,
  archiveTalentRecord,
  assignTalentToTarget,
  DEPLOYMENT_ASSIGNMENTS_STORAGE_KEY,
  getDeploymentAssignments,
  getTalentAssignmentsForTalent,
  getTalentPoolRecords,
  releaseTalentFromAssignment,
  TALENT_POOL_STORAGE_KEY,
  updateTalentRecord,
  updateTalentStatus,
} from "../lib/adminWorkforceMockData";

const AdminWorkforceContext = createContext(null);

export function AdminWorkforceProvider({ children }) {
  const { session } = useAuth();
  const [talentPool, setTalentPool] = useState(() => getTalentPoolRecords());
  const [assignments, setAssignments] = useState(() => getDeploymentAssignments());

  const sync = useCallback(() => {
    setTalentPool(getTalentPoolRecords());
    setAssignments(getDeploymentAssignments());
  }, []);

  useEffect(() => {
    sync();

    const handleStorage = (event) => {
      if (
        event.key === TALENT_POOL_STORAGE_KEY ||
        event.key === DEPLOYMENT_ASSIGNMENTS_STORAGE_KEY
      ) {
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

  const actor = session?.name || session?.email || "Administrator";

  const addToPool = useCallback(
    (source, payload = {}) => {
      const result = addTalentToPool(source, payload, actor);
      if (result.ok) sync();
      return result;
    },
    [actor, sync]
  );

  const editTalent = useCallback(
    (talentId, payload = {}) => {
      const result = updateTalentRecord(talentId, payload, actor);
      if (result.ok) sync();
      return result;
    },
    [actor, sync]
  );

  const setTalentStatus = useCallback(
    (talentId, status, note = "") => {
      const result = updateTalentStatus(talentId, status, actor, note);
      if (result.ok) sync();
      return result;
    },
    [actor, sync]
  );

  const assignTalent = useCallback(
    (talentId, payload = {}) => {
      const result = assignTalentToTarget(talentId, payload, actor);
      if (result.ok) sync();
      return result;
    },
    [actor, sync]
  );

  const releaseTalent = useCallback(
    (talentId, note = "") => {
      const result = releaseTalentFromAssignment(talentId, actor, note);
      if (result.ok) sync();
      return result;
    },
    [actor, sync]
  );

  const archiveTalent = useCallback(
    (talentId, reason = "") => {
      const result = archiveTalentRecord(talentId, actor, reason);
      if (result.ok) sync();
      return result;
    },
    [actor, sync]
  );

  const getAssignmentsForTalent = useCallback(
    (talentId) => getTalentAssignmentsForTalent(talentId),
    []
  );

  const getActiveAssignmentForTalent = useCallback(
    (talentId) => assignments.find((assignment) => assignment.talentId === talentId && assignment.status === "Active") ?? null,
    [assignments]
  );

  const value = useMemo(
    () => ({
      talentPool,
      assignments,
      addToPool,
      editTalent,
      setTalentStatus,
      assignTalent,
      releaseTalent,
      archiveTalent,
      getAssignmentsForTalent,
      getActiveAssignmentForTalent,
      refreshWorkforceData: sync,
    }),
    [
      talentPool,
      assignments,
      addToPool,
      editTalent,
      setTalentStatus,
      assignTalent,
      releaseTalent,
      archiveTalent,
      getAssignmentsForTalent,
      getActiveAssignmentForTalent,
      sync,
    ]
  );

  return <AdminWorkforceContext.Provider value={value}>{children}</AdminWorkforceContext.Provider>;
}

export function useAdminWorkforce() {
  const context = useContext(AdminWorkforceContext);

  if (!context) {
    throw new Error("useAdminWorkforce must be used within an AdminWorkforceProvider");
  }

  return context;
}
