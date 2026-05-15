import test from "node:test";
import assert from "node:assert/strict";
import {
  deriveApplicantsByCategory,
  deriveCategoryApplicantCounts,
} from "../src/lib/recruitmentCategoryApplicants.js";

const jobs = [
  { id: "REQ-1", title: "Frontend Engineer", department: "Engineering" },
  { id: "REQ-2", title: "Backend Engineer", department: "Engineering" },
  { id: "REQ-3", title: "Technical Recruiter", department: "People Operations" },
];

const applications = [
  {
    id: "APP-1",
    jobId: "REQ-1",
    jobTitle: "Frontend Engineer",
    candidateName: "Ana Cruz",
    status: "Submitted",
    appliedOn: "2026-05-10T10:00:00.000Z",
    updatedOn: "2026-05-10T10:00:00.000Z",
  },
  {
    id: "APP-2",
    jobId: "REQ-2",
    jobTitle: "Backend Engineer",
    candidateName: "Ben Reyes",
    status: "Shortlisted",
    appliedOn: "2026-05-11T10:00:00.000Z",
    updatedOn: "2026-05-12T10:00:00.000Z",
  },
  {
    id: "APP-3",
    jobId: "REQ-3",
    jobTitle: "Technical Recruiter",
    candidateName: "Cara Lim",
    status: "Interview",
    appliedOn: "2026-05-09T10:00:00.000Z",
    updatedOn: "2026-05-13T10:00:00.000Z",
  },
  {
    id: "APP-4",
    jobId: "REQ-UNKNOWN",
    candidateName: "Dane Go",
    status: "Submitted",
    appliedOn: "2026-05-08T10:00:00.000Z",
    updatedOn: "2026-05-08T10:00:00.000Z",
  },
];

test("deriveCategoryApplicantCounts aggregates by department category", () => {
  const counts = deriveCategoryApplicantCounts(jobs, applications);

  assert.deepEqual(counts, [
    { category: "Engineering", applicants: 2 },
    { category: "General", applicants: 1 },
    { category: "People Operations", applicants: 1 },
  ]);
});

test("deriveApplicantsByCategory returns only matching category applicants", () => {
  const engineeringApplicants = deriveApplicantsByCategory(jobs, applications, "Engineering");

  assert.equal(engineeringApplicants.length, 2);
  assert.deepEqual(
    engineeringApplicants.map((item) => item.applicationId),
    ["APP-2", "APP-1"]
  );
  assert.ok(engineeringApplicants.every((item) => item.jobId === "REQ-1" || item.jobId === "REQ-2"));
});

test("deriveApplicantsByCategory maps unknown jobs to General", () => {
  const generalApplicants = deriveApplicantsByCategory(jobs, applications, "General");

  assert.equal(generalApplicants.length, 1);
  assert.equal(generalApplicants[0].applicationId, "APP-4");
  assert.equal(generalApplicants[0].jobTitle, "Unknown Role");
});
