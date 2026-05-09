export const candidate201Statuses = [
  "Missing",
  "Submitted",
  "Approved",
  "Needs Action",
];

export const recruiter201Statuses = [
  "Pending Review",
  "Approved",
  "Needs Action",
  "Archived",
];

const STATUS_TONE_MAP = {
  Missing: {
    pill: "bg-slate-200 text-slate-700",
    card: "border-slate-200 bg-slate-50",
    text: "text-slate-700",
  },
  Submitted: {
    pill: "bg-blue-600 text-white",
    card: "border-blue-200 bg-blue-50",
    text: "text-blue-700",
  },
  "Pending Review": {
    pill: "bg-blue-600 text-white",
    card: "border-blue-200 bg-blue-50",
    text: "text-blue-700",
  },
  Approved: {
    pill: "bg-emerald-600 text-white",
    card: "border-emerald-200 bg-emerald-50",
    text: "text-emerald-700",
  },
  "Needs Action": {
    pill: "bg-amber-500 text-white",
    card: "border-amber-200 bg-amber-50",
    text: "text-amber-800",
  },
  Archived: {
    pill: "bg-slate-700 text-white",
    card: "border-slate-200 bg-slate-50",
    text: "text-slate-700",
  },
};

export function get201StatusTone(status) {
  return STATUS_TONE_MAP[status] || STATUS_TONE_MAP.Submitted;
}
