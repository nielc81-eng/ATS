import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageFrame } from "../../components/layout/ShellPrimitives";
import { useDigitalFiles } from "../../context/DigitalFilesContext";
import { useRecruiterDocsInbox } from "../../context/RecruiterDocsInboxContext";
import { useRecruitmentData } from "../../context/RecruitmentDataContext";
import {
  buildRecruiterJobPath,
  getMostRecentJobId,
} from "../../lib/jobNavigation";
import { get201StatusTone } from "../../lib/digitalFileStatusConfig";

function formatDate(dateString) {
  if (!dateString) return "No date";

  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function toTimeValue(dateString) {
  const parsed = Date.parse(dateString || "");
  return Number.isNaN(parsed) ? 0 : parsed;
}

function sortByDateDesc(items, dateKey) {
  return [...items].sort((left, right) => toTimeValue(right[dateKey]) - toTimeValue(left[dateKey]));
}

export default function RecruiterDashboard() {
  const { jobs } = useRecruitmentData();
  const { files, addFile } = useDigitalFiles();
  const { items, approveInboxItem, requestActionForItem, markInboxItemReviewed, refreshInbox } =
    useRecruiterDocsInbox();
  const [notice, setNotice] = useState("");
  const mostRecentJobId = useMemo(() => getMostRecentJobId(jobs), [jobs]);
  const quickActions = useMemo(
    () => [
      { label: "Manage Jobs", path: "/recruiter/jobs" },
      { label: "Run Screening", path: buildRecruiterJobPath("/recruiter/screening", mostRecentJobId) },
      { label: "Open Analytics", path: buildRecruiterJobPath("/recruiter/analytics", mostRecentJobId) },
      { label: "Compliance Gate", path: "/recruiter/compliance-gate" },
      { label: "Review 201 Files", path: "/recruiter/files" },
    ],
    [mostRecentJobId]
  );

  const recruitmentMetrics = useMemo(
    () => ({
      activeJobs: jobs.length,
      totalApplicants: jobs.reduce((sum, job) => sum + (job.applicants || 0), 0),
      shortlistedTotal: jobs.reduce(
        (sum, job) => sum + (job.analytics?.shortlisted || 0),
        0
      ),
      newestRequisitions: sortByDateDesc(jobs, "postedOn").slice(0, 5),
    }),
    [jobs]
  );

  const fileMetrics = useMemo(
    () => ({
      totalFiles: files.length,
      pendingReview: files.filter((file) => file.status === "Pending Review").length,
      needsAction: files.filter((file) => file.status === "Needs Action").length,
      recentStatusChanges: sortByDateDesc(files, "lastReviewedOn").slice(0, 5),
    }),
    [files]
  );

  const hasNoJobs = recruitmentMetrics.activeJobs === 0;
  const hasNoFiles = fileMetrics.totalFiles === 0;
  const sortedInbox = useMemo(
    () =>
      [...items].sort(
        (left, right) =>
          Date.parse(right.submittedOn || "") - Date.parse(left.submittedOn || "")
      ),
    [items]
  );

  const handleAttachMockFile = () => {
    const nextFile = addFile({
      employeeName: "New Hire",
      employeeId: `EMP-${Date.now().toString().slice(-4)}`,
      department: "HR Operations",
      notes: "Mock file attached from the recruiter dashboard.",
    });

    setNotice(`Mock file ${nextFile.id} attached and ready for review.`);
  };

  return (
    <PageFrame size="wide">
      <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">Talent Acquisition Portal</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Talent Acquisition Dashboard Metrics Hub
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Monitor requisitions, applicant flow, shortlist progress, and Digital 201 file
          readiness from one overview screen.
        </p>
      </section>

      {hasNoJobs || hasNoFiles ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
            Getting Started
          </p>
          <p className="mt-2 text-sm text-amber-900">
            {hasNoJobs && hasNoFiles
              ? "No requisitions or 201 files found yet. Create your first requisition and attach a mock file to populate this dashboard."
              : hasNoJobs
              ? "No requisitions found yet. Create your first requisition to track hiring activity."
              : "No 201 files found yet. Attach a mock file to start digital records tracking."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {hasNoJobs ? (
              <Link
                to="/recruiter/jobs"
                className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Create Requisition
              </Link>
            ) : null}
            {hasNoFiles ? (
              <button
                type="button"
                onClick={handleAttachMockFile}
                className="rounded-2xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 transition hover:border-amber-400"
              >
                Attach Mock File
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      {notice ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {notice}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Active Jobs</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{recruitmentMetrics.activeJobs}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Total Applicants</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {recruitmentMetrics.totalApplicants}
          </p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Shortlisted Total</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {recruitmentMetrics.shortlistedTotal}
          </p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Total 201 Files</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{fileMetrics.totalFiles}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Pending Review</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{fileMetrics.pendingReview}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Needs Action</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{fileMetrics.needsAction}</p>
        </article>
      </section>

      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">Quick Actions</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.path}
              to={action.path}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="surface-card p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="section-heading">Candidate Docs Inbox</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">
              New onboarding submissions
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
              Pending: {sortedInbox.filter((item) => item.status === "Submitted").length}
            </div>
            <button
              type="button"
              onClick={refreshInbox}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Refresh Inbox
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {sortedInbox.length > 0 ? (
            sortedInbox.map((item) => {
              const tone = get201StatusTone(item.status);
              return (
                <article
                  key={item.id}
                  className="rounded-3xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {item.candidateAlias || "Candidate"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.docType} - {item.fileMeta?.name || "No file name"} - Submitted{" "}
                        {formatDate(item.submittedOn)}
                      </p>
                    </div>
                    <span
                      className={[
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        tone.pill,
                      ].join(" ")}
                    >
                      {item.status}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-600">
                    {item.reviewSummary || "Awaiting recruiter review."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        approveInboxItem(item.id, "Approved by recruiter.");
                        setNotice(`Reviewed ${item.docType} for ${item.candidateAlias || "candidate"}.`);
                      }}
                      className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        requestActionForItem(
                          item.id,
                          "Please re-upload a clearer copy or missing detail."
                        );
                        setNotice(`Requested changes for ${item.docType}.`);
                      }}
                      className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:border-amber-400"
                    >
                      Needs Action
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        markInboxItemReviewed(item.id, "Marked as reviewed.");
                        setNotice(`Marked ${item.docType} as reviewed.`);
                      }}
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                    >
                      Mark Reviewed
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600 lg:col-span-2">
              No candidate submissions yet.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="surface-card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent Requisitions</h2>
            <p className="mt-1 text-sm text-slate-600">
              Top 5 by posted date.
            </p>
          </div>
          <div className="p-6">
            {recruitmentMetrics.newestRequisitions.length > 0 ? (
              <ul className="space-y-3">
                {recruitmentMetrics.newestRequisitions.map((job) => (
                  <li
                    key={job.id}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-slate-900">{job.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {job.department} - {job.id} - Posted {formatDate(job.postedOn)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                No requisitions yet.{" "}
                <Link to="/recruiter/jobs" className="font-semibold text-blue-700 hover:text-blue-800">
                  Create your first requisition.
                </Link>
              </div>
            )}
          </div>
        </article>

        <article className="surface-card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent 201 File Activity</h2>
            <p className="mt-1 text-sm text-slate-600">
              Top 5 status changes by last reviewed date.
            </p>
          </div>
          <div className="p-6">
            {fileMetrics.recentStatusChanges.length > 0 ? (
              <ul className="space-y-3">
                {fileMetrics.recentStatusChanges.map((file) => (
                  <li
                    key={file.id}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {file.employeeName} ({file.employeeId})
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {file.id} - {file.status} - Reviewed {formatDate(file.lastReviewedOn)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                No 201 files yet. Attach a mock file to populate this feed.
              </div>
            )}
          </div>
        </article>
      </section>
      </div>
    </PageFrame>
  );
}

