export const semanticDemand = [
  { skill: "React.js", count: 18 },
  { skill: "TypeScript", count: 16 },
  { skill: "Sourcing", count: 14 },
  { skill: "Accessibility", count: 12 },
  { skill: "ATS Workflow", count: 11 },
  { skill: "REST APIs", count: 10 },
  { skill: "Stakeholder Management", count: 9 },
  { skill: "Reporting", count: 8 },
];

export const recruitmentJobSeeds = [
  {
    id: "REQ-4021",
    title: "Frontend Engineer",
    department: "Engineering",
    description: "Own recruiter-facing UX for screening and reporting modules.",
    mustHaveSkills: ["React.js", "TypeScript", "REST APIs"],
    niceToHaveSkills: ["Recharts", "Accessibility"],
    applicants: 42,
    postedOn: "2026-04-28",
    analytics: {
      shortlisted: 9,
      timeToFillDays: 18,
      screeningDays: 3,
      interviewDays: 10,
      offerDays: 5,
      reportRows: [
        {
          stage: "Application intake",
          candidates: 42,
          avgMatch: "61%",
          cycleDay: "Day 0-1",
          note: "Resume parsing completed.",
        },
        {
          stage: "AI review",
          candidates: 14,
          avgMatch: "84%",
          cycleDay: "Day 2-3",
          note: "Applicants ranked semantically by role-fit signals.",
        },
        {
          stage: "Hiring manager review",
          candidates: 8,
          avgMatch: "87%",
          cycleDay: "Day 4-6",
          note: "Shortlist reviewed against requirements.",
        },
        {
          stage: "Interview loop",
          candidates: 4,
          avgMatch: "90%",
          cycleDay: "Day 7-13",
          note: "Technical panel scheduled.",
        },
        {
          stage: "Offer stage",
          candidates: 1,
          avgMatch: "94%",
          cycleDay: "Day 18",
          note: "Offer issued and awaiting acceptance.",
        },
      ],
    },
    candidates: [
      {
        alias: "Candidate A",
        applicantId: "Applicant #402",
        score: 92,
        yearsExperience: 5,
        skills: ["React.js", "TypeScript", "Tailwind CSS", "Jest"],
        matchSignals: [
          "Strong React.js history mapped directly to the frontend requirement.",
          "TypeScript experience reduced delivery risk for the dashboard layer.",
          "Accessibility awareness supports inclusive and usable UI standards.",
        ],
        justification:
          "React.js experience matched with the Frontend Engineer requirement, and the candidate's component-driven work aligns with your need for scalable UI delivery.",
      },
      {
        alias: "Candidate B",
        applicantId: "Applicant #417",
        score: 76,
        yearsExperience: 4,
        skills: ["Vue", "JavaScript", "REST APIs", "CSS Modules"],
        matchSignals: [
          "Frontend development background is relevant, but React exposure is lighter.",
          "API integration experience supports the product workflow requirement.",
          "Solid UI delivery signals with moderate framework overlap.",
        ],
        justification:
          "This profile shows strong frontend fundamentals and API integration, but the framework match is partial because the role prioritizes React.js-specific delivery.",
      },
      {
        alias: "Candidate C",
        applicantId: "Applicant #438",
        score: 58,
        yearsExperience: 3,
        skills: ["HTML", "CSS", "Figma Handoff", "Webpack"],
        matchSignals: [
          "Design handoff experience is useful for UI collaboration.",
          "Core web skills are present, though advanced React depth is limited.",
          "Score remains mid-range due to partial semantic overlap.",
        ],
        justification:
          "The candidate demonstrates usable frontend exposure, but the semantic match is lower because the role asks for deeper React and TypeScript experience.",
      },
    ],
  },
  {
    id: "REQ-4022",
    title: "Technical Recruiter",
    department: "People Operations",
    description: "Drive end-to-end hiring for product and engineering roles.",
    mustHaveSkills: ["Sourcing", "Interview Coordination", "ATS Workflow"],
    niceToHaveSkills: ["HRIS", "Employer Branding"],
    applicants: 28,
    postedOn: "2026-05-01",
    analytics: {
      shortlisted: 7,
      timeToFillDays: 14,
      screeningDays: 2,
      interviewDays: 8,
      offerDays: 4,
      reportRows: [
        {
          stage: "Application intake",
          candidates: 28,
          avgMatch: "58%",
          cycleDay: "Day 0",
          note: "Inbound pipeline collected.",
        },
        {
          stage: "AI review",
          candidates: 10,
          avgMatch: "79%",
          cycleDay: "Day 1-2",
          note: "Sourcing and ATS signals extracted.",
        },
        {
          stage: "Hiring manager review",
          candidates: 6,
          avgMatch: "83%",
          cycleDay: "Day 3-5",
          note: "Workflow alignment validated.",
        },
        {
          stage: "Interview loop",
          candidates: 3,
          avgMatch: "86%",
          cycleDay: "Day 6-10",
          note: "Stakeholder interviews completed.",
        },
        {
          stage: "Offer stage",
          candidates: 1,
          avgMatch: "91%",
          cycleDay: "Day 14",
          note: "Offer drafted for final approval.",
        },
      ],
    },
    candidates: [
      {
        alias: "Candidate D",
        applicantId: "Applicant #512",
        score: 88,
        yearsExperience: 6,
        skills: ["Sourcing", "Interview Coordination", "ATS", "Stakeholder Management"],
        matchSignals: [
          "Direct sourcing experience aligns with recruiter responsibilities.",
          "ATS workflow knowledge supports the hiring operations stack.",
          "Stakeholder coordination strongly matches the role profile.",
        ],
        justification:
          "Sourcing and coordination history matched the Technical Recruiter requirement, especially around structured hiring workflows and ATS usage.",
      },
      {
        alias: "Candidate E",
        applicantId: "Applicant #525",
        score: 67,
        yearsExperience: 4,
        skills: ["Recruiting", "Scheduling", "Candidate Outreach", "Reporting"],
        matchSignals: [
          "Recruiting workflow experience is relevant.",
          "Reporting and outreach map well to the role's operational layer.",
          "No explicit ATS signal lowers the semantic confidence score.",
        ],
        justification:
          "The profile fits recruiting operations well, though the system ranked it lower because the ATS and structured interviewing signals are weaker.",
      },
      {
        alias: "Candidate F",
        applicantId: "Applicant #547",
        score: 49,
        yearsExperience: 2,
        skills: ["Customer Support", "Communication", "Scheduling"],
        matchSignals: [
          "Communication skills are useful, but not strongly semantic for recruiting.",
          "Limited sourcing or interview operations evidence was found.",
          "The score remains below the shortlist threshold.",
        ],
        justification:
          "This profile only partially overlaps with the role because the extracted experience does not strongly support recruiter-specific semantic requirements.",
      },
    ],
  },
];

export function cloneRecruitmentJob(job) {
  return {
    ...job,
    mustHaveSkills: [...job.mustHaveSkills],
    niceToHaveSkills: [...job.niceToHaveSkills],
    analytics: {
      ...job.analytics,
      reportRows: job.analytics.reportRows.map((row) => ({ ...row })),
    },
    candidates: job.candidates.map((candidate) => ({
      ...candidate,
      skills: [...candidate.skills],
      matchSignals: [...candidate.matchSignals],
    })),
  };
}

export function createRecruitmentJob(payload) {
  const now = new Date().toISOString().slice(0, 10);

  return {
    id: `REQ-${Date.now().toString().slice(-6)}`,
    title: String(payload?.title || "").trim(),
    department: String(payload?.department || "").trim(),
    description: String(payload?.description || "").trim(),
    mustHaveSkills: Array.isArray(payload?.mustHaveSkills)
      ? [...payload.mustHaveSkills]
      : [],
    niceToHaveSkills: Array.isArray(payload?.niceToHaveSkills)
      ? [...payload.niceToHaveSkills]
      : [],
    applicants: 0,
    postedOn: now,
    analytics: {
      shortlisted: 0,
      timeToFillDays: 0,
      screeningDays: 0,
      interviewDays: 0,
      offerDays: 0,
      reportRows: [],
    },
    candidates: [],
  };
}

export function toScreeningJob(job) {
  return {
    id: job.id,
    title: job.title,
    department: job.department,
    focus: job.mustHaveSkills.slice(0, 3),
  };
}

export function toAnalyticsJob(job) {
  return {
    id: job.id,
    title: job.title,
    department: job.department,
    applicants: job.applicants,
    shortlisted: job.analytics.shortlisted,
    timeToFillDays: job.analytics.timeToFillDays,
    screeningDays: job.analytics.screeningDays,
    interviewDays: job.analytics.interviewDays,
    offerDays: job.analytics.offerDays,
    reportRows: job.analytics.reportRows,
  };
}
