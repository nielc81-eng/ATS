export const APPLICATION_STATUS = {
  Submitted: "Submitted",
  PooledForFutureOpportunities: "PooledForFutureOpportunities",
  InterviewInitial: "InterviewInitial",
  InterviewFinal: "InterviewFinal",
  PostHireDocsSubmitted: "PostHireDocsSubmitted",
  HiredOnboarding: "HiredOnboarding",
  BackoutArchived: "BackoutArchived",
  Shortlisted: "Shortlisted",
  Interview: "Interview",
  Offer: "Offer",
  Hired: "Hired",
  Rejected: "Rejected",
};

export const APPLICATION_STATUSES = Object.values(APPLICATION_STATUS);

export const APPLICATION_STATUS_LABELS = {
  [APPLICATION_STATUS.Submitted]: "Submitted",
  [APPLICATION_STATUS.PooledForFutureOpportunities]: "Pooled for Future Opportunities",
  [APPLICATION_STATUS.InterviewInitial]: "Interview Phase - Initial",
  [APPLICATION_STATUS.InterviewFinal]: "Interview Phase - Final",
  [APPLICATION_STATUS.PostHireDocsSubmitted]: "Post-Hire Documents Submitted",
  [APPLICATION_STATUS.HiredOnboarding]: "Hired / Onboarding",
  [APPLICATION_STATUS.BackoutArchived]: "Backout - Discard/Archive",
  [APPLICATION_STATUS.Shortlisted]: "Shortlisted",
  [APPLICATION_STATUS.Interview]: "Interview",
  [APPLICATION_STATUS.Offer]: "Offer",
  [APPLICATION_STATUS.Hired]: "Hired",
  [APPLICATION_STATUS.Rejected]: "Rejected",
};

export function getApplicationStatusLabel(status) {
  return APPLICATION_STATUS_LABELS[status] ?? status ?? "Submitted";
}

export const PIPELINE_SHORTLIST_STATUSES = new Set([
  APPLICATION_STATUS.Shortlisted,
  APPLICATION_STATUS.Interview,
  APPLICATION_STATUS.InterviewInitial,
  APPLICATION_STATUS.InterviewFinal,
  APPLICATION_STATUS.Offer,
  APPLICATION_STATUS.PostHireDocsSubmitted,
  APPLICATION_STATUS.Hired,
  APPLICATION_STATUS.HiredOnboarding,
]);

export const INTERVIEW_GATE_PASS_STATUS = APPLICATION_STATUS.HiredOnboarding;
export const INTERVIEW_GATE_FAIL_STATUS = APPLICATION_STATUS.BackoutArchived;

