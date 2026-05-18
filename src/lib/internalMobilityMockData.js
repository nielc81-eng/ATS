/**
 * Internal Mobility & Redeployment Weighting — Mock applicants dataset
 *
 * This is intentionally frontend-only mock data for prototyping.
 * Key behavior we want to simulate:
 * - Only applicants with deploymentStatus === "Finished" are eligible for internal mobility weighting.
 * - internalRating is a 1–5 scale and is meant to "weight" the AI match rather than purely resume/skills.
 */

export const internalMobilityApplicantsSeed = [
  {
    id: "IM-APPLICANT-1001",
    applicantName: "Alyssa Reyes",
    skills: ["React.js", "TypeScript", "Tailwind CSS", "Jest"],
    deploymentStatus: "Finished",
    internalRating: {
      overall: 4.7,
      scale: 5,
      // Ratings per dimension are also 1–5. These make it easier to test prompt behavior.
      dimensions: {
        performance: 4.8,
        teamwork: 4.6,
        communication: 4.5,
        reliability: 4.9,
      },
      notes: [
        "Consistently delivered ahead of sprint commitments.",
        "Proactively unblocked teammates during production incidents.",
      ],
    },
  },
  {
    id: "IM-APPLICANT-1002",
    applicantName: "Demo Candidate",
    ownerEmail: "candidate@demo.com",
    skills: ["Node.js", "REST APIs", "PostgreSQL", "Docker"],
    deploymentStatus: "Deployed",
    internalRating: {
      overall: 4.1,
      scale: 5,
      dimensions: {
        performance: 4.2,
        teamwork: 4.0,
        communication: 3.9,
        reliability: 4.3,
      },
      notes: ["Active deployment — rating is preliminary and still in progress."],
    },
  },
  {
    id: "IM-APPLICANT-1003",
    applicantName: "Janelle Cruz",
    skills: ["Customer Support", "Zendesk", "Documentation", "Reporting"],
    deploymentStatus: "Finished",
    internalRating: {
      overall: 3.4,
      scale: 5,
      dimensions: {
        performance: 3.2,
        teamwork: 3.7,
        communication: 3.9,
        reliability: 3.0,
      },
      notes: [
        "Strong customer empathy and clear communication.",
        "Needs tighter follow-through on time-sensitive escalations.",
      ],
    },
  },
  {
    id: "IM-APPLICANT-1004",
    applicantName: "Kenji Nakamura",
    skills: ["Sourcing", "ATS Workflow", "Interview Coordination", "Stakeholder Management"],
    deploymentStatus: "Finished",
    internalRating: {
      overall: 5.0,
      scale: 5,
      dimensions: {
        performance: 5.0,
        teamwork: 4.9,
        communication: 4.9,
        reliability: 5.0,
      },
      notes: [
        "Exceptional stakeholder management; hiring managers requested redeployment.",
        "Zero process misses across the contract term.",
      ],
    },
  },
  {
    id: "IM-APPLICANT-1005",
    applicantName: "Paolo Dizon",
    skills: ["QA Testing", "Cypress", "Bug Triage", "SQL"],
    deploymentStatus: "Finished",
    internalRating: {
      overall: 2.1,
      scale: 5,
      dimensions: {
        performance: 2.0,
        teamwork: 2.4,
        communication: 2.3,
        reliability: 1.8,
      },
      notes: [
        "Quality output was inconsistent; needed repeated rework on test cases.",
        "Attendance issues impacted sprint predictability.",
      ],
    },
  },
  {
    id: "IM-APPLICANT-1006",
    applicantName: "Sofia Lim",
    skills: ["Data Analysis", "Excel", "Power BI", "Reporting"],
    deploymentStatus: "Finished",
    internalRating: {
      overall: 4.2,
      scale: 5,
      dimensions: {
        performance: 4.1,
        teamwork: 4.3,
        communication: 4.0,
        reliability: 4.5,
      },
      notes: [
        "Reliable and consistent delivery of weekly dashboards.",
        "Improved reporting accuracy by tightening definitions and QA checks.",
      ],
    },
  },
  {
    id: "IM-APPLICANT-1007",
    applicantName: "Diana Flores",
    skills: ["Figma", "UX Research", "Accessibility", "Design Systems"],
    deploymentStatus: "Offboarded",
    internalRating: {
      overall: 3.9,
      scale: 5,
      dimensions: {
        performance: 3.8,
        teamwork: 4.1,
        communication: 4.0,
        reliability: 3.7,
      },
      notes: ["Contract ended early due to project cancellation; performance remained solid."],
    },
  },
  {
    id: "IM-APPLICANT-1008",
    applicantName: "Rafael Gomez",
    skills: ["React.js", "JavaScript", "REST APIs", "CSS Modules", "Accessibility"],
    deploymentStatus: "Finished",
    internalRating: {
      overall: 3.0,
      scale: 5,
      dimensions: {
        performance: 3.1,
        teamwork: 3.3,
        communication: 2.8,
        reliability: 2.9,
      },
      notes: [
        "Steady output, but required more guidance on prioritization.",
        "Communication clarity improved toward end of contract.",
      ],
    },
  },
];
