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
  approveDeploymentRequest,
  archiveTalentRecord,
  createDeploymentRequest,
  assignTalentToTarget,
  DEPLOYMENT_ASSIGNMENTS_STORAGE_KEY,
  DEPLOYMENT_REQUESTS_STORAGE_KEY,
  getDeploymentAssignments,
  getDeploymentRequestById,
  getDeploymentRequests,
  getDeploymentRequestsForRequester,
  getDeploymentRequestsForTalent,
  getTalentAssignmentsForTalent,
  getTalentPoolRecords,
  rejectDeploymentRequest,
  releaseTalentFromAssignment,
  TALENT_POOL_STORAGE_KEY,
  submitDeploymentRequest,
  updateTalentRecord,
  updateTalentStatus,
  updateDeploymentRequest,
  convertDeploymentRequestToAssignment,
  ensureAdminWorkforceSeedData,
} from "../lib/adminWorkforceMockData";

const AdminWorkforceContext = createContext(null);

export function AdminWorkforceProvider({ children }) {
  const { session } = useAuth();
  ensureAdminWorkforceSeedData();
  const [talentPool, setTalentPool] = useState(() => getTalentPoolRecords());
  const [assignments, setAssignments] = useState(() => getDeploymentAssignments());
  const [requests, setRequests] = useState(() => getDeploymentRequests());

  const sync = useCallback(() => {
    setTalentPool(getTalentPoolRecords());
    setAssignments(getDeploymentAssignments());
    setRequests(getDeploymentRequests());
  }, []);

  useEffect(() => {
    sync();

    const handleStorage = (event) => {
      if (
        event.key === TALENT_POOL_STORAGE_KEY ||
        event.key === DEPLOYMENT_ASSIGNMENTS_STORAGE_KEY ||
        event.key === DEPLOYMENT_REQUESTS_STORAGE_KEY
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

  const createRequest = useCallback(
    (talentId, payload = {}) => {
      const result = createDeploymentRequest(talentId, payload, actor);
      if (result.ok) sync();
      return result;
    },
    [actor, sync]
  );

  const updateRequest = useCallback(
    (requestId, payload = {}) => {
      const result = updateDeploymentRequest(requestId, payload, actor);
      if (result.ok) sync();
      return result;
    },
    [actor, sync]
  );

  const submitRequest = useCallback(
    (requestId) => {
      const result = submitDeploymentRequest(requestId, actor);
      if (result.ok) sync();
      return result;
    },
    [actor, sync]
  );

  const approveRequest = useCallback(
    (requestId, payload = {}) => {
      const result = approveDeploymentRequest(requestId, payload, actor);
      if (result.ok) sync();
      return result;
    },
    [actor, sync]
  );

  const rejectRequest = useCallback(
    (requestId, reason = "") => {
      const result = rejectDeploymentRequest(requestId, reason, actor);
      if (result.ok) sync();
      return result;
    },
    [actor, sync]
  );

  const convertRequestToAssignment = useCallback(
    (requestId, payload = {}) => {
      const result = convertDeploymentRequestToAssignment(requestId, payload, actor);
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

  const getRequestsForTalent = useCallback(
    (talentId) => getDeploymentRequestsForTalent(talentId),
    []
  );

  const getRequestsForRequester = useCallback(
    (requesterEmail) => getDeploymentRequestsForRequester(requesterEmail),
    []
  );

  const getRequestById = useCallback(
    (requestId) => getDeploymentRequestById(requestId),
    []
  );

  const value = useMemo(
    () => ({
      talentPool,
      assignments,
      requests,
      addToPool,
      editTalent,
      setTalentStatus,
      assignTalent,
      createRequest,
      updateRequest,
      submitRequest,
      approveRequest,
      rejectRequest,
      convertRequestToAssignment,
      releaseTalent,
      archiveTalent,
      getAssignmentsForTalent,
      getActiveAssignmentForTalent,
      getRequestsForTalent,
      getRequestsForRequester,
      getRequestById,
      refreshWorkforceData: sync,
    }),
    [
      talentPool,
      assignments,
      requests,
      addToPool,
      editTalent,
      setTalentStatus,
      assignTalent,
      createRequest,
      updateRequest,
      submitRequest,
      approveRequest,
      rejectRequest,
      convertRequestToAssignment,
      releaseTalent,
      archiveTalent,
      getAssignmentsForTalent,
      getActiveAssignmentForTalent,
      getRequestsForTalent,
      getRequestsForRequester,
      getRequestById,
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
