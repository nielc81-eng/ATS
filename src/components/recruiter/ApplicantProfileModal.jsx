import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, MoreHorizontal, X } from "lucide-react";
import { getApplicationStatusLabel } from "../../lib/applicationStatuses";
import {
  getCandidateProfileStorageKey,
  readCandidateProfileState,
  readStoredResumeProfile,
} from "../../lib/candidateProfileStorage";

function formatDateRange(startDate, endDate, current) {
  const start = String(startDate || "").trim();
  const end = String(endDate || "").trim();
  if (!start && !end) return "";
  if (current) return `${start || "?"} – Present`;
  if (!start) return end;
  if (!end) return start;
  return `${start} – ${end}`;
}

function getStoredProfileFlag(email) {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(window.localStorage.getItem(getCandidateProfileStorageKey(email)));
  } catch {
    return false;
  }
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-2xl px-4 py-2 text-sm font-semibold transition",
        active
          ? "bg-slate-950 text-white"
          : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function ApplicantProfileModal({
  applicationsOnPage,
  initialApplicationId,
  onClose,
}) {
  const rows = Array.isArray(applicationsOnPage) ? applicationsOnPage : [];
  const [activeApplicationId, setActiveApplicationId] = useState(initialApplicationId || "");
  const [activeTab, setActiveTab] = useState("Overview");

  useEffect(() => {
    setActiveApplicationId(initialApplicationId || "");
    setActiveTab("Overview");
  }, [initialApplicationId]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const activeIndex = useMemo(
    () => rows.findIndex((row) => String(row?.id || row?.applicationId || "") === String(activeApplicationId || "")),
    [activeApplicationId, rows]
  );

  const application = useMemo(() => {
    if (activeIndex >= 0) return rows[activeIndex] ?? null;
    return rows.find((row) => String(row?.id || row?.applicationId || "") === String(initialApplicationId || "")) ?? null;
  }, [activeIndex, initialApplicationId, rows]);

  const canPrev = activeIndex > 0;
  const canNext = activeIndex >= 0 && activeIndex < rows.length - 1;

  const candidateEmail = normalizeEmail(application?.candidateEmail || "");
  const candidateName = String(application?.candidateName || "Candidate");
  const statusLabel = getApplicationStatusLabel(application?.status || "Submitted") || application?.status || "Submitted";

  const resumeProfile = useMemo(() => {
    if (!candidateEmail) return null;
    return readStoredResumeProfile(candidateEmail);
  }, [candidateEmail]);

  const profileState = useMemo(() => {
    if (!candidateEmail) return null;
    const sessionStub = { name: candidateName, email: candidateEmail };
    return readCandidateProfileState(candidateEmail, sessionStub, resumeProfile);
  }, [candidateEmail, candidateName, resumeProfile]);

  const hasStoredProfile = useMemo(() => {
    if (!candidateEmail) return false;
    return getStoredProfileFlag(candidateEmail);
  }, [candidateEmail]);

  if (!application) return null;

  const profile = profileState?.profile || null;
  const personal = profile?.personalDetails || {};
  const skills = Array.isArray(profile?.skills) ? profile.skills : [];
  const workExperience = Array.isArray(profile?.workExperience) ? profile.workExperience : [];
  const education = Array.isArray(profile?.education) ? profile.education : [];
  const assets = Array.isArray(profile?.assets) ? profile.assets : [];

  const locationParts = [personal.city, personal.province].map((v) => String(v || "").trim()).filter(Boolean);
  const locationLabel = locationParts.length ? locationParts.join(", ") : "";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close applicant profile"
        className="absolute inset-0 bg-slate-950/50"
        onClick={() => onClose?.()}
      />

      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-col max-h-[92vh] overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_120px_rgba(15,23,42,0.25)]">
        <header className="flex-none border-b border-slate-200 px-6 py-5 sm:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">View Candidate</p>
              <h2 className="mt-2 truncate text-2xl font-semibold text-slate-950">{candidateName}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span className="truncate">{candidateEmail || "No email on file"}</span>
                <span className="text-slate-300">•</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {statusLabel}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!canPrev) return;
                  const nextRow = rows[activeIndex - 1];
                  setActiveApplicationId(String(nextRow?.id || nextRow?.applicationId || ""));
                  setActiveTab("Overview");
                }}
                disabled={!canPrev}
                className={[
                  "inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition",
                  canPrev
                    ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    : "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed",
                ].join(" ")}
              >
                <ChevronLeft size={16} />
                Prev
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!canNext) return;
                  const nextRow = rows[activeIndex + 1];
                  setActiveApplicationId(String(nextRow?.id || nextRow?.applicationId || ""));
                  setActiveTab("Overview");
                }}
                disabled={!canNext}
                className={[
                  "inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition",
                  canNext
                    ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    : "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed",
                ].join(" ")}
              >
                Next
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => onClose?.()}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <TabButton active={activeTab === "Overview"} onClick={() => setActiveTab("Overview")}>
              Overview
            </TabButton>
            <TabButton active={activeTab === "Resume"} onClick={() => setActiveTab("Resume")}>
              Resume
            </TabButton>
            <TabButton active={activeTab === "Gallery"} onClick={() => setActiveTab("Gallery")}>
              Gallery
            </TabButton>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {!hasStoredProfile ? (
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-700 sm:px-8">
              No saved candidate profile yet. This view will populate after the candidate completes their profile or uploads a resume.
            </div>
          ) : null}

          {activeTab === "Overview" ? (
            <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[1.15fr_0.85fr]">
              <section className="space-y-5">
                <article className="rounded-3xl border border-slate-200 p-5">
                  <p className="text-sm font-semibold text-slate-900">Personal Details</p>
                  <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Location</p>
                      <p className="mt-1 font-semibold text-slate-900">{locationLabel || "—"}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Mobile</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {String(personal.mobileNumber || "").trim() || "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 sm:col-span-2">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Address</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {String(personal.address || "").trim() || "—"}
                      </p>
                    </div>
                  </div>
                </article>

                <article className="rounded-3xl border border-slate-200 p-5">
                  <p className="text-sm font-semibold text-slate-900">Skills</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(skills.length ? skills : resumeProfile?.skills || []).slice(0, 18).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                      >
                        {skill}
                      </span>
                    ))}
                    {(skills.length ? skills : resumeProfile?.skills || []).length === 0 ? (
                      <p className="text-sm text-slate-600">No skills recorded yet.</p>
                    ) : null}
                  </div>
                </article>
              </section>

              <aside className="space-y-5">
                <article className="rounded-3xl border border-slate-200 p-5">
                  <p className="text-sm font-semibold text-slate-900">Work Experience</p>
                  <div className="mt-4 space-y-3">
                    {workExperience.filter((item) => item.company || item.title).slice(0, 4).map((item) => (
                      <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-900">
                          {String(item.title || "").trim() || "Role"}{" "}
                          {item.company ? (
                            <span className="font-medium text-slate-600">• {item.company}</span>
                          ) : null}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          {formatDateRange(item.startDate, item.endDate, item.current) || "—"}
                          {item.location ? ` • ${item.location}` : ""}
                        </p>
                        {item.summary ? (
                          <p className="mt-3 text-sm text-slate-700">{item.summary}</p>
                        ) : null}
                      </div>
                    ))}
                    {workExperience.filter((item) => item.company || item.title).length === 0 ? (
                      <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        No work experience recorded yet.
                      </p>
                    ) : null}
                  </div>
                </article>

                <article className="rounded-3xl border border-slate-200 p-5">
                  <p className="text-sm font-semibold text-slate-900">Education</p>
                  <div className="mt-4 space-y-3">
                    {education.filter((item) => item.school || item.degree || item.fieldOfStudy).slice(0, 4).map((item) => (
                      <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-900">
                          {String(item.degree || "").trim() || "Credential"}
                          {item.fieldOfStudy ? (
                            <span className="font-medium text-slate-600"> • {item.fieldOfStudy}</span>
                          ) : null}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          {String(item.school || "").trim() || "—"}
                          {formatDateRange(item.startDate, item.endDate, false)
                            ? ` • ${formatDateRange(item.startDate, item.endDate, false)}`
                            : ""}
                        </p>
                        {item.notes ? (
                          <p className="mt-3 text-sm text-slate-700">{item.notes}</p>
                        ) : null}
                      </div>
                    ))}
                    {education.filter((item) => item.school || item.degree || item.fieldOfStudy).length === 0 ? (
                      <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        No education entries recorded yet.
                      </p>
                    ) : null}
                  </div>
                </article>
              </aside>
            </div>
          ) : null}

          {activeTab === "Resume" ? (
            <div className="space-y-6 px-6 py-6 sm:px-8">
              <article className="rounded-3xl border border-slate-200 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Resume Baseline</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {resumeProfile?.fileName || "No resume uploaded"}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    <MoreHorizontal size={14} />
                    Extracted
                  </span>
                </div>

                {resumeProfile ? (
                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-3xl bg-slate-50 p-5">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Summary</p>
                      <p className="mt-3 text-sm leading-6 text-slate-700">
                        {resumeProfile.summary || "No extracted summary yet."}
                      </p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-5">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Skills</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {resumeProfile.skills.length > 0 ? (
                          resumeProfile.skills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <p className="text-sm text-slate-600">No skills extracted yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                    No resume baseline found for this candidate email.
                  </div>
                )}
              </article>

              {resumeProfile?.experienceBullets?.length ? (
                <article className="rounded-3xl border border-slate-200 p-5">
                  <p className="text-sm font-semibold text-slate-900">Extracted Experience</p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-700">
                    {resumeProfile.experienceBullets.slice(0, 10).map((item, index) => (
                      <li key={`${index}-${item}`} className="rounded-2xl bg-slate-50 px-4 py-3">
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              ) : null}

              {resumeProfile?.educationBullets?.length ? (
                <article className="rounded-3xl border border-slate-200 p-5">
                  <p className="text-sm font-semibold text-slate-900">Extracted Education</p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-700">
                    {resumeProfile.educationBullets.slice(0, 10).map((item, index) => (
                      <li key={`${index}-${item}`} className="rounded-2xl bg-slate-50 px-4 py-3">
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              ) : null}
            </div>
          ) : null}

          {activeTab === "Gallery" ? (
            <div className="space-y-6 px-6 py-6 sm:px-8">
              <article className="rounded-3xl border border-slate-200 p-5">
                <p className="text-sm font-semibold text-slate-900">Assets</p>
                <p className="mt-1 text-sm text-slate-600">
                  Candidate-provided attachments and portfolio items.
                </p>

                {assets.length > 0 ? (
                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {assets.map((asset) => (
                      <div key={asset.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        {asset.dataUrl ? (
                          <img
                            src={asset.dataUrl}
                            alt={asset.label || "Asset preview"}
                            className="h-36 w-full rounded-2xl object-cover bg-white"
                          />
                        ) : (
                          <div className="flex h-36 w-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
                            No preview
                          </div>
                        )}
                        <p className="mt-3 text-sm font-semibold text-slate-900">
                          {asset.label || "Untitled asset"}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">{asset.fileName || "—"}</p>
                        {asset.notes ? (
                          <p className="mt-3 text-sm text-slate-700">{asset.notes}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                    No gallery items uploaded yet.
                  </div>
                )}
              </article>
            </div>
          ) : null}
        </div>
      </section>
    </div>,
    document.body
  );
}

