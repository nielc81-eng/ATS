import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { recordAdminAuditEvent } from "../lib/adminMockData";
import {
  cloneRecruitmentJob,
  createRecruitmentJob,
  recruitmentJobSeeds,
  toAnalyticsJob,
  toScreeningJob,
} from "../lib/recruitmentMockData";

const RecruitmentDataContext = createContext(null);
const JOBS_STORAGE_KEY = "recruitment_jobs_state_v1";
const APPLICATIONS_STORAGE_KEY = "candidate_applications_by_email_v1";
const APPLICATION_STATUSES = [
  "Submitted",
  "Shortlisted",
  "Interview",
  "Offer",
  "Hired",
  "Rejected",
];
const SHORTLIST_STATUSES = new Set(["Shortlisted", "Interview", "Offer", "Hired"]);
const TIMELINE_ROLES = new Set(["Recruiter", "Candidate", "System"]);

function toDateValue(value) {
  const parsed = Date.parse(value || "");
  return Number.isNaN(parsed) ? 0 : parsed;
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeSkill(value) {
  return String(value || "").trim();
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function isApplicationStatus(value) {
  return APPLICATION_STATUSES.includes(value);
}

function normalizeIsoDate(value, fallback = new Date().toISOString()) {
  const parsed = Date.parse(value || "");
  return Number.isNaN(parsed) ? fallback : new Date(parsed).toISOString();
}

function normalizeTimelineEntry(rawEntry = {}) {
  return {
    at: normalizeIsoDate(rawEntry.at),
    byRole: TIMELINE_ROLES.has(rawEntry.byRole) ? rawEntry.byRole : "System",
    toStatus: isApplicationStatus(rawEntry.toStatus) ? rawEntry.toStatus : "Submitted",
    note: String(rawEntry.note || "").trim(),
  };
}

function normalizeJob(rawJob = {}) {
  return {
    id: String(rawJob.id || `REQ-${Date.now().toString().slice(-6)}`),
    title: String(rawJob.title || "Untitled Role"),
    department: String(rawJob.department || "General"),
    description: String(rawJob.description || ""),
    mustHaveSkills: ensureArray(rawJob.mustHaveSkills).map(normalizeSkill).filter(Boolean),
    niceToHaveSkills: ensureArray(rawJob.niceToHaveSkills).map(normalizeSkill).filter(Boolean),
    applicants:
      typeof rawJob.applicants === "number" && Number.isFinite(rawJob.applicants)
        ? rawJob.applicants
        : 0,
    postedOn:
      typeof rawJob.postedOn === "string" && rawJob.postedOn.trim()
        ? rawJob.postedOn
        : new Date().toISOString().slice(0, 10),
    analytics: {
      shortlisted:
        typeof rawJob.analytics?.shortlisted === "number" &&
        Number.isFinite(rawJob.analytics.shortlisted)
          ? rawJob.analytics.shortlisted
          : 0,
      timeToFillDays:
        typeof rawJob.analytics?.timeToFillDays === "number" &&
        Number.isFinite(rawJob.analytics.timeToFillDays)
          ? rawJob.analytics.timeToFillDays
          : 0,
      screeningDays:
        typeof rawJob.analytics?.screeningDays === "number" &&
        Number.isFinite(rawJob.analytics.screeningDays)
          ? rawJob.analytics.screeningDays
          : 0,
      interviewDays:
        typeof rawJob.analytics?.interviewDays === "number" &&
        Number.isFinite(rawJob.analytics.interviewDays)
          ? rawJob.analytics.interviewDays
          : 0,
      offerDays:
        typeof rawJob.analytics?.offerDays === "number" &&
        Number.isFinite(rawJob.analytics.offerDays)
          ? rawJob.analytics.offerDays
          : 0,
      reportRows: ensureArray(rawJob.analytics?.reportRows).map((row) => ({
        stage: String(row?.stage || ""),
        candidates:
          typeof row?.candidates === "number" && Number.isFinite(row.candidates)
            ? row.candidates
            : 0,
        avgMatch: String(row?.avgMatch || "0%"),
        cycleDay: String(row?.cycleDay || ""),
        note: String(row?.note || ""),
      })),
    },
    candidates: ensureArray(rawJob.candidates).map((candidate, index) => ({
      ...candidate,
      alias: String(candidate?.alias || "Candidate"),
      applicantId: String(candidate?.applicantId || `Applicant #${Date.now().toString().slice(-4)}`),
      score:
        typeof candidate?.score === "number" && Number.isFinite(candidate.score)
          ? candidate.score
          : 65,
      yearsExperience:
        typeof candidate?.yearsExperience === "number" &&
        Number.isFinite(candidate.yearsExperience)
          ? candidate.yearsExperience
          : 2,
      skills: ensureArray(candidate?.skills).map(normalizeSkill).filter(Boolean),
      matchSignals: ensureArray(candidate?.matchSignals)
        .map((item) => String(item || "").trim())
        .filter(Boolean),
      justification: String(candidate?.justification || ""),
      applicationId:
        typeof candidate?.applicationId === "string" && candidate.applicationId.trim()
          ? candidate.applicationId
          : createSeedApplicationId(rawJob.id, index),
    })),
  };
}

function readStoredJobs() {
  if (typeof window === "undefined") {
    return recruitmentJobSeeds.map(cloneRecruitmentJob);
  }

  try {
    const raw = window.localStorage.getItem(JOBS_STORAGE_KEY);
    if (!raw) return recruitmentJobSeeds.map(cloneRecruitmentJob);

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return recruitmentJobSeeds.map(cloneRecruitmentJob);
    }

    return parsed.map(normalizeJob);
  } catch {
    return recruitmentJobSeeds.map(cloneRecruitmentJob);
  }
}

function normalizeApplication(rawApplication = {}, fallbackEmail = "") {
  const candidateEmail = normalizeEmail(rawApplication.candidateEmail || fallbackEmail);
  const appliedOn = normalizeIsoDate(rawApplication.appliedOn);
  const updatedOn = normalizeIsoDate(rawApplication.updatedOn, appliedOn);
  const rawTimeline = ensureArray(rawApplication.timeline)
    .map(normalizeTimelineEntry)
    .sort((left, right) => toDateValue(left.at) - toDateValue(right.at));

  let status = isApplicationStatus(rawApplication.status) ? rawApplication.status : "";
  if (rawApplication.status === "Withdrawn") {
    status = "Rejected";
  }
  if (!status) {
    status = rawTimeline.at(-1)?.toStatus || "Submitted";
  }

  const timeline = [...rawTimeline];
  const initialNote =
    rawApplication.status === "Withdrawn"
      ? "Candidate withdrew the application."
      : status === "Submitted"
        ? "Application submitted."
        : "Application status migrated.";
  const initialRole =
    rawApplication.status === "Withdrawn" || status === "Submitted" ? "Candidate" : "System";

  if (timeline.length === 0) {
    timeline.push({
      at: appliedOn,
      byRole: initialRole,
      toStatus: status,
      note: initialNote,
    });
  } else if (timeline.at(-1)?.toStatus !== status) {
    timeline.push({
      at: updatedOn,
      byRole: rawApplication.status === "Withdrawn" ? "Candidate" : "System",
      toStatus: status,
      note:
        rawApplication.status === "Withdrawn"
          ? "Candidate withdrew the application."
          : "Application status migrated.",
    });
  }

  return {
    id: String(rawApplication.id || `APP-${Date.now().toString(36)}`),
    jobId: String(rawApplication.jobId || ""),
    jobTitle: String(rawApplication.jobTitle || "Unknown Role"),
    candidateEmail,
    candidateName: String(rawApplication.candidateName || "Candidate"),
    status,
    appliedOn,
    updatedOn: timeline.at(-1)?.at || updatedOn || appliedOn,
    timeline,
    screeningCandidateApplicationId:
      typeof rawApplication.screeningCandidateApplicationId === "string"
        ? rawApplication.screeningCandidateApplicationId
        : "",
  };
}

function readStoredApplications(jobs = recruitmentJobSeeds.map(cloneRecruitmentJob)) {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(APPLICATIONS_STORAGE_KEY);
    if (!raw) return buildSeedApplications(jobs);

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return buildSeedApplications(jobs);
    }

    const normalized = Object.entries(parsed).reduce((acc, [email, applications]) => {
      const normalizedEmail = normalizeEmail(email);
      if (!normalizedEmail) return acc;

      acc[normalizedEmail] = ensureArray(applications)
        .map((application) => normalizeApplication(application, normalizedEmail))
        .filter((application) => application.jobId);

      return acc;
    }, {});

    return Object.keys(normalized).length > 0
      ? normalized
      : buildSeedApplications(jobs);
  } catch {
    return buildSeedApplications(jobs);
  }
}

function buildSeedApplications(jobs) {
  return jobs.reduce((acc, job) => {
    ensureArray(job.candidates).forEach((candidate, index) => {
      const candidateEmail = createSeedEmail(job, candidate, index);
      const applicationId = createSeedApplicationId(job.id, index);
      const now = new Date().toISOString();
      const application = {
        id: applicationId,
        jobId: job.id,
        jobTitle: job.title,
        candidateEmail,
        candidateName: String(candidate?.alias || candidate?.nameHint || "Candidate"),
        status: "Submitted",
        appliedOn: now,
        updatedOn: now,
        timeline: [createSubmittedTimelineEntry(now)],
        screeningCandidateApplicationId: applicationId,
      };

      const existing = acc[candidateEmail] || [];
      acc[candidateEmail] = [...existing, application];
    });

    return acc;
  }, {});
}

function persistJobs(jobs) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
}

function persistApplications(applicationsByEmail) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    APPLICATIONS_STORAGE_KEY,
    JSON.stringify(applicationsByEmail)
  );
}

function createApplicationId() {
  return `APP-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createApplicantId() {
  return `Applicant #${Date.now().toString().slice(-4)}`;
}

function createSeedApplicationId(jobId, index) {
  const normalizedJobId = String(jobId || "JOB")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `APP-${normalizedJobId || "JOB"}-${index + 1}`;
}

function createSeedEmail(job, candidate, index) {
  const jobSlug = String(job?.id || "job")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const candidateSlug = String(candidate?.alias || candidate?.nameHint || "candidate")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${candidateSlug || "candidate"}.${index + 1}.${jobSlug || "job"}@seed.local`;
}

function createSubmittedTimelineEntry(timestamp) {
  const now = normalizeIsoDate(timestamp);
  return {
    at: now,
    byRole: "System",
    toStatus: "Submitted",
    note: "Application submitted.",
  };
}

function indexToAlias(index) {
  let value = index;
  let label = "";

  while (value >= 0) {
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26) - 1;
  }

  return label;
}

function clampScore(value) {
  return Math.max(45, Math.min(98, value));
}

function isShortlistedStatus(status) {
  return SHORTLIST_STATUSES.has(status);
}

function findApplicationLocation(applicationsByEmail, applicationId) {
  const normalizedApplicationId = String(applicationId || "").trim();
  if (!normalizedApplicationId) return null;

  for (const [email, applications] of Object.entries(applicationsByEmail)) {
    const index = applications.findIndex((application) => application.id === normalizedApplicationId);
    if (index >= 0) {
      return {
        email,
        application: applications[index],
        index,
      };
    }
  }

  return null;
}

function buildScreeningCandidate(job, applicationId, name, resumeProfile) {
  const mustHaveSkills = ensureArray(job.mustHaveSkills)
    .map((skill) => String(skill || "").trim())
    .filter(Boolean);
  const resumeSkills = ensureArray(resumeProfile?.skills)
    .map((skill) => String(skill || "").trim())
    .filter(Boolean);

  const resumeSkillSet = new Set(resumeSkills.map((skill) => skill.toLowerCase()));
  const overlapCount = mustHaveSkills.filter((skill) =>
    resumeSkillSet.has(skill.toLowerCase())
  ).length;

  const matchRatio = mustHaveSkills.length > 0 ? overlapCount / mustHaveSkills.length : 0;

  const score =
    resumeSkills.length > 0
      ? clampScore(Math.round(56 + matchRatio * 36 + Math.min(8, resumeSkills.length)))
      : 68;

  const yearsExperience =
    typeof resumeProfile?.yearsExperience === "number" &&
    Number.isFinite(resumeProfile.yearsExperience) &&
    resumeProfile.yearsExperience > 0
      ? Math.min(20, Math.round(resumeProfile.yearsExperience))
      : Math.max(2, Math.min(8, overlapCount + 2));

  const displayedSkills =
    resumeSkills.length > 0
      ? resumeSkills.slice(0, 6)
      : mustHaveSkills.slice(0, 3).concat(["Collaboration", "Communication"]);

  const matchSignals =
    overlapCount > 0
      ? [
          `${overlapCount} must-have skills overlap with this job requisition.`,
          "Resume profile indicates role-relevant experience and transferable delivery capability.",
          "Semantic score reflects core skill alignment and onboarding readiness.",
        ]
      : [
          "No parsed resume profile was found, so a neutral baseline score was assigned.",
          "Candidate can improve ranking by uploading a resume and reapplying in a future phase.",
          "Initial screening keeps this profile visible for recruiter follow-up.",
        ];

  const justification =
    overlapCount > 0
      ? `Candidate profile matched ${overlapCount} out of ${mustHaveSkills.length} must-have skills for this role.`
      : "Candidate was submitted without a parsed resume profile, so default semantic signals were used.";

  return {
    applicationId,
    alias: `Candidate ${indexToAlias(ensureArray(job.candidates).length)}`,
    applicantId: createApplicantId(),
    score,
    yearsExperience,
    skills: displayedSkills,
    matchSignals,
    justification,
    nameHint: String(name || "Candidate"),
  };
}

export function RecruitmentDataProvider({ children }) {
  const { session } = useAuth();
  const [jobs, setJobs] = useState(() => readStoredJobs());
  const [applicationsByEmail, setApplicationsByEmail] = useState(() =>
    readStoredApplications(jobs)
  );

  useEffect(() => {
    persistJobs(jobs);
  }, [jobs]);

  useEffect(() => {
    persistApplications(applicationsByEmail);
  }, [applicationsByEmail]);

  const addJob = useCallback((payload) => {
    const nextJob = createRecruitmentJob(payload);
    setJobs((prev) => [normalizeJob(nextJob), ...prev]);
    return nextJob;
  }, []);

  const getCandidatesForJob = useCallback(
    (jobId) => jobs.find((job) => job.id === jobId)?.candidates ?? [],
    [jobs]
  );

  const hasApplied = useCallback(
    (jobId, email) => {
      const normalizedEmail = normalizeEmail(email);
      if (!normalizedEmail) return false;

      return (applicationsByEmail[normalizedEmail] || []).some(
        (application) => application.jobId === jobId
      );
    },
    [applicationsByEmail]
  );

  const getApplicationsForJob = useCallback(
    (jobId) => {
      if (!jobId) return [];

      return Object.values(applicationsByEmail)
        .flat()
        .filter((application) => application.jobId === jobId)
        .sort((left, right) => toDateValue(right.updatedOn) - toDateValue(left.updatedOn));
    },
    [applicationsByEmail]
  );

  const getApplicationsForCandidate = useCallback(
    (email) => {
      const normalizedEmail = normalizeEmail(email);
      if (!normalizedEmail) return [];

      return [...(applicationsByEmail[normalizedEmail] || [])].sort(
        (left, right) => toDateValue(right.updatedOn) - toDateValue(left.updatedOn)
      );
    },
    [applicationsByEmail]
  );

  const getApplicationByCandidateAndJob = useCallback(
    (email, jobId) => {
      const normalizedEmail = normalizeEmail(email);
      if (!normalizedEmail || !jobId) return null;

      return (
        applicationsByEmail[normalizedEmail]?.find((application) => application.jobId === jobId) ??
        null
      );
    },
    [applicationsByEmail]
  );

  const applyToJob = useCallback(
    (jobId, payload = {}) => {
      const normalizedEmail = normalizeEmail(payload.email);
      if (!normalizedEmail) {
        return { ok: false, code: "MISSING_EMAIL", message: "Candidate email is required." };
      }

      const targetJob = jobs.find((job) => job.id === jobId);
      if (!targetJob) {
        return { ok: false, code: "JOB_NOT_FOUND", message: "Job not found." };
      }

      if (hasApplied(jobId, normalizedEmail)) {
        return {
          ok: false,
          code: "DUPLICATE_APPLICATION",
          message: "You already applied to this role.",
        };
      }

      const applicationId = createApplicationId();
      const appliedOn = new Date().toISOString();
      const application = {
        id: applicationId,
        jobId,
        jobTitle: targetJob.title,
        candidateEmail: normalizedEmail,
        candidateName: String(payload.name || "Candidate"),
        status: "Submitted",
        appliedOn,
        updatedOn: appliedOn,
        timeline: [createSubmittedTimelineEntry(appliedOn)],
        screeningCandidateApplicationId: applicationId,
      };

      setApplicationsByEmail((prev) => {
        const existing = prev[normalizedEmail] || [];
        return {
          ...prev,
          [normalizedEmail]: [...existing, application],
        };
      });

      setJobs((prev) =>
        prev.map((job) => {
          if (job.id !== jobId) return job;

          const nextCandidate = buildScreeningCandidate(
            job,
            applicationId,
            payload.name,
            payload.resumeProfile
          );

          return {
            ...job,
            applicants: Math.max(0, (job.applicants || 0) + 1),
            candidates: [...job.candidates, nextCandidate],
          };
        })
      );

      return { ok: true, application };
    },
    [hasApplied, jobs]
  );

  const updateApplicationStatus = useCallback(
    (applicationId, nextStatus, note = "") => {
      const normalizedApplicationId = String(applicationId || "").trim();
      const normalizedStatus = String(nextStatus || "").trim();
      const trimmedNote = String(note || "").trim();

      if (!normalizedApplicationId) {
        return { ok: false, code: "MISSING_APPLICATION_ID", message: "Application id is required." };
      }

      if (!isApplicationStatus(normalizedStatus)) {
        return { ok: false, code: "INVALID_STATUS", message: "Unsupported application status." };
      }

      if (normalizedStatus === "Rejected" && !trimmedNote) {
        return { ok: false, code: "NOTE_REQUIRED", message: "A note is required when rejecting an application." };
      }

      const location = findApplicationLocation(applicationsByEmail, normalizedApplicationId);
      if (!location) {
        return { ok: false, code: "NOT_FOUND", message: "Application not found." };
      }

      if (location.application.status === normalizedStatus) {
        return { ok: true, application: location.application };
      }

      const now = new Date().toISOString();
      const updatedApplication = {
        ...location.application,
        status: normalizedStatus,
        updatedOn: now,
        timeline: [
          ...ensureArray(location.application.timeline).map(normalizeTimelineEntry),
          {
            at: now,
            byRole: "Recruiter",
            toStatus: normalizedStatus,
            note: trimmedNote,
          },
        ],
      };

      setApplicationsByEmail((prev) => ({
        ...prev,
        [location.email]: (prev[location.email] || []).map((application) =>
          application.id === normalizedApplicationId ? updatedApplication : application
        ),
      }));

      const actor = session?.name || session?.email || "Recruiter";
      const detailParts = [
        `${updatedApplication.candidateName} (${updatedApplication.id}) moved from ${location.application.status} to ${normalizedStatus}.`,
      ];
      if (trimmedNote) {
        detailParts.push(`Note: ${trimmedNote}`);
      }
      recordAdminAuditEvent({
        actor,
        action: "Updated application status",
        target: updatedApplication.id,
        category: "applications",
        detail: detailParts.join(" "),
      });

      return { ok: true, application: updatedApplication };
    },
    [applicationsByEmail, session]
  );

  const withdrawApplication = useCallback(
    (applicationId) =>
      updateApplicationStatus(
        applicationId,
        "Rejected",
        "Candidate withdrew the application."
      ),
    [updateApplicationStatus]
  );

  const getJobById = useCallback(
    (jobId) => jobs.find((job) => job.id === jobId) ?? null,
    [jobs]
  );

  const screeningJobs = useMemo(() => jobs.map(toScreeningJob), [jobs]);
  const analyticsJobs = useMemo(() => {
    const allApplications = Object.values(applicationsByEmail).flat();

    return jobs.map((job) => {
      const jobApplications = allApplications.filter((application) => application.jobId === job.id);
      const shortlisted = jobApplications.filter((application) =>
        isShortlistedStatus(application.status)
      ).length;

      return {
        ...toAnalyticsJob(job),
        applicants: jobApplications.length,
        shortlisted,
      };
    });
  }, [applicationsByEmail, jobs]);

  const value = useMemo(
    () => ({
      jobs,
      screeningJobs,
      analyticsJobs,
      applicationsByEmail,
      addJob,
      getJobById,
      getCandidatesForJob,
      applyToJob,
      hasApplied,
      getApplicationsForJob,
      getApplicationsForCandidate,
      getApplicationByCandidateAndJob,
      updateApplicationStatus,
      withdrawApplication,
    }),
    [
      jobs,
      screeningJobs,
      analyticsJobs,
      applicationsByEmail,
      addJob,
      getJobById,
      getCandidatesForJob,
      applyToJob,
      hasApplied,
      getApplicationsForJob,
      getApplicationsForCandidate,
      getApplicationByCandidateAndJob,
      updateApplicationStatus,
      withdrawApplication,
    ]
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
