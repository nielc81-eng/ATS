import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  cloneRecruitmentJob,
  createRecruitmentJob,
  recruitmentJobSeeds,
  toAnalyticsJob,
  toScreeningJob,
} from "../lib/recruitmentMockData";

const RecruitmentDataContext = createContext(null);

export function RecruitmentDataProvider({ children }) {
  const [jobs, setJobs] = useState(() => recruitmentJobSeeds.map(cloneRecruitmentJob));

  const addJob = useCallback((payload) => {
    const nextJob = createRecruitmentJob(payload);
    setJobs((prev) => [nextJob, ...prev]);
    return nextJob;
  }, []);

  const getCandidatesForJob = useCallback(
    (jobId) => jobs.find((job) => job.id === jobId)?.candidates ?? [],
    [jobs]
  );

  const screeningJobs = useMemo(() => jobs.map(toScreeningJob), [jobs]);
  const analyticsJobs = useMemo(() => jobs.map(toAnalyticsJob), [jobs]);

  const value = useMemo(
    () => ({
      jobs,
      screeningJobs,
      analyticsJobs,
      addJob,
      getCandidatesForJob,
    }),
    [jobs, screeningJobs, analyticsJobs, addJob, getCandidatesForJob]
  );

  return (
    <RecruitmentDataContext.Provider value={value}>
      {children}
    </RecruitmentDataContext.Provider>
  );
}

export function useRecruitmentData() {
  const context = useContext(RecruitmentDataContext);

  if (!context) {
    throw new Error("useRecruitmentData must be used within a RecruitmentDataProvider");
  }

  return context;
}

