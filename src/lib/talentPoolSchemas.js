export const TALENT_POOL_STORAGE_KEY = "talent_pool_module_state_v1";

export const talentPoolStatuses = [
  "New",
  "Shortlisted",
  "Ready",
  "Placed",
  "Archived",
];

export const candidateAvailabilityStates = [
  "Immediate",
  "2 Weeks",
  "1 Month",
  "Unavailable",
];

export const vacancyStates = ["Open", "Paused", "Closed"];

export const defaultMatchingSettings = {
  threshold: 65,
  skillWeight: 0.7,
  confidenceWeight: 0.3,
};

export const seededPools = [
  {
    id: "POOL-ENG",
    name: "Engineering Talent Pool",
    department: "Engineering",
    tags: ["React.js", "TypeScript", "Node.js"],
    description: "Shared bench for product and platform engineering hiring.",
  },
  {
    id: "POOL-OPS",
    name: "People Operations Pool",
    department: "People Operations",
    tags: ["Sourcing", "Recruiting", "Coordination"],
    description: "Recruiting and HR operations talent bench.",
  },
];

export const seededVacancies = [
  {
    id: "VAC-ENG-01",
    title: "Frontend Engineer",
    poolId: "POOL-ENG",
    department: "Engineering",
    skills: ["React.js", "TypeScript", "REST APIs"],
    location: "Remote",
    availability: "Immediate",
    state: "Open",
    createdOn: "2026-05-04",
  },
  {
    id: "VAC-HR-01",
    title: "Technical Recruiter",
    poolId: "POOL-OPS",
    department: "People Operations",
    skills: ["Sourcing", "ATS Workflow", "Interview Coordination"],
    location: "Hybrid",
    availability: "2 Weeks",
    state: "Open",
    createdOn: "2026-05-03",
  },
];

export const seededCandidates = [
  {
    id: "TPC-1001",
    name: "Candidate A",
    email: "candidate.a@demo.com",
    location: "Remote",
    availability: "Immediate",
    skills: ["React.js", "TypeScript", "Tailwind CSS"],
    tags: ["Frontend", "Senior"],
    poolIds: ["POOL-ENG"],
    status: "Shortlisted",
    statusHistory: [
      {
        at: "2026-05-05T10:00:00.000Z",
        status: "New",
        note: "Imported from screening shortlist.",
        by: "System",
      },
      {
        at: "2026-05-06T08:30:00.000Z",
        status: "Shortlisted",
        note: "Recruiter shortlisted after review.",
        by: "Recruiter",
      },
    ],
    source: "Application",
    sourceApplicationId: "APP-REQ-4021-1",
    confidence: 91,
    createdOn: "2026-05-05T10:00:00.000Z",
    updatedOn: "2026-05-06T08:30:00.000Z",
  },
  {
    id: "TPC-1002",
    name: "Candidate D",
    email: "candidate.d@demo.com",
    location: "Metro Manila",
    availability: "2 Weeks",
    skills: ["Sourcing", "Interview Coordination", "ATS Workflow"],
    tags: ["Recruiting", "Operations"],
    poolIds: ["POOL-OPS"],
    status: "Ready",
    statusHistory: [
      {
        at: "2026-05-04T09:15:00.000Z",
        status: "New",
        note: "Manually added by recruiter.",
        by: "Recruiter",
      },
      {
        at: "2026-05-07T11:00:00.000Z",
        status: "Ready",
        note: "Ready for active vacancy matching.",
        by: "Recruiter",
      },
    ],
    source: "Manual",
    sourceApplicationId: "",
    confidence: 86,
    createdOn: "2026-05-04T09:15:00.000Z",
    updatedOn: "2026-05-07T11:00:00.000Z",
  },
];

export const seededRecruiterPermissions = {
  "recruiter@demo.com": {
    poolIds: ["POOL-ENG", "POOL-OPS"],
    departments: ["Engineering", "People Operations"],
  },
};
