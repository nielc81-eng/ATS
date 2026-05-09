import {
  get201StatusTone,
  recruiter201Statuses,
} from "./digitalFileStatusConfig";

export const digitalFileStatuses = recruiter201Statuses;

export const digitalFilesSeed = [
  {
    id: "201-1001",
    employeeName: "Mia Reyes",
    employeeId: "EMP-1001",
    department: "Engineering",
    fileName: "201-Mia-Reyes.pdf",
    fileType: "PDF",
    status: "Pending Review",
    uploadedOn: "2026-05-01",
    lastReviewedOn: "2026-05-01",
    reviewer: "HR Ops",
    size: "2.4 MB",
    tags: ["Onboarding", "Tax", "ID"],
    documents: [
      "Government ID",
      "Employment Contract",
      "Tax Form 2316",
      "Emergency Contact Sheet",
    ],
    notes: "Awaiting final employment verification.",
    reviewSummary: "All core onboarding records are present, pending final approval.",
  },
  {
    id: "201-1002",
    employeeName: "Noah Santos",
    employeeId: "EMP-1002",
    department: "People Operations",
    fileName: "201-Noah-Santos.pdf",
    fileType: "PDF",
    status: "Approved",
    uploadedOn: "2026-04-29",
    lastReviewedOn: "2026-05-02",
    reviewer: "A. Cruz",
    size: "3.1 MB",
    tags: ["Compliance", "Payroll", "Contract"],
    documents: [
      "Signed Contract",
      "Payroll Authorization",
      "SSS/Tax Info",
      "Emergency Contact Sheet",
    ],
    notes: "Complete and verified.",
    reviewSummary: "File set is complete and ready for retention.",
  },
  {
    id: "201-1003",
    employeeName: "Leah Cruz",
    employeeId: "EMP-1003",
    department: "Design",
    fileName: "201-Leah-Cruz.pdf",
    fileType: "PDF",
    status: "Needs Action",
    uploadedOn: "2026-05-02",
    lastReviewedOn: "2026-05-04",
    reviewer: "Records Team",
    size: "1.9 MB",
    tags: ["Missing Doc", "ID", "Audit"],
    documents: [
      "Government ID",
      "Employment Contract",
      "Missing Tax Form",
      "Emergency Contact Sheet",
    ],
    notes: "Tax form is missing from the file set.",
    reviewSummary: "One compliance document is missing and requires follow-up.",
  },
  {
    id: "201-1004",
    employeeName: "Avery Lim",
    employeeId: "EMP-1004",
    department: "Finance",
    fileName: "201-Avery-Lim.pdf",
    fileType: "PDF",
    status: "Archived",
    uploadedOn: "2026-03-18",
    lastReviewedOn: "2026-04-20",
    reviewer: "Records Team",
    size: "2.0 MB",
    tags: ["Archived", "Retention"],
    documents: [
      "Employment Contract",
      "Exit Clearance",
      "Retention Notice",
    ],
    notes: "Archived after offboarding completion.",
    reviewSummary: "Historical employee file retained for audit reference.",
  },
];

export function cloneDigitalFile(file) {
  return {
    ...file,
    tags: [...file.tags],
    documents: [...file.documents],
  };
}

export function createDigitalFile(payload = {}) {
  const now = new Date().toISOString().slice(0, 10);
  const employeeName = String(payload.employeeName || "New Employee").trim();
  const employeeId = String(payload.employeeId || `EMP-${Date.now().toString().slice(-4)}`).trim();
  const department = String(payload.department || "HR").trim();

  return {
    id: `201-${Date.now().toString().slice(-6)}`,
    employeeName,
    employeeId,
    department,
    fileName: `${employeeName.replace(/\s+/g, "-")}-201.pdf`,
    fileType: "PDF",
    status: "Pending Review",
    uploadedOn: now,
    lastReviewedOn: now,
    reviewer: "Records Queue",
    size: "2.6 MB",
    tags: ["201 File", "Pending Review"],
    documents: [
      "Government ID",
      "Employment Contract",
      "Tax Form",
      "Emergency Contact Sheet",
    ],
    notes: String(payload.notes || "Mock file attached from the file vault.").trim(),
    reviewSummary: "New file attached and waiting for HR review.",
  };
}

export function getDigitalFileStatusTone(status) {
  return get201StatusTone(status);
}
