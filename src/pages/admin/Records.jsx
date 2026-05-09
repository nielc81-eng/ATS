import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useCandidate201Files } from "../../context/Candidate201FilesContext";
import { useDigitalFiles } from "../../context/DigitalFilesContext";
import { useRecruiterDocsInbox } from "../../context/RecruiterDocsInboxContext";
import { useRecruitmentData } from "../../context/RecruitmentDataContext";

function formatNumber(value) {
  return new Intl.NumberFormat().format(value);
}

export default function AdminRecords() {
  const { jobs } = useRecruitmentData();
  const { files } = useDigitalFiles();
  const { items } = useRecruiterDocsInbox();
  const { docs } = useCandidate201Files();

  const stats = useMemo(
    () => ({
      jobs: jobs.length,
      applicants: jobs.reduce((sum, job) => sum + (job.applicants || 0), 0),
      files: files.length,
      needsAction: files.filter((file) => file.status === "Needs Action").length,
      inbox: items.length,
      pending: items.filter((item) => item.status === "Submitted").length,
      docs: docs.length,
      submitted: docs.filter((doc) => doc.status === "Submitted").length,
    }),
    [jobs, files, items, docs]
  );

  const topJobs = jobs.slice(0, 3);
  const topFiles = files.slice(0, 3);
  const topInbox = items.slice(0, 4);

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">Record access</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Recruiter and candidate records
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          This view gives administrators a fast read on both sides of the hiring
          workflow without exposing public registration or candidate-private tools.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Jobs", value: stats.jobs, note: `${formatNumber(stats.applicants)} applicants` },
          { label: "201 files", value: stats.files, note: `${formatNumber(stats.needsAction)} need action` },
          { label: "Inbox items", value: stats.inbox, note: `${formatNumber(stats.pending)} pending review` },
          { label: "Candidate docs", value: stats.docs, note: `${formatNumber(stats.submitted)} submitted` },
        ].map((item) => (
          <article key={item.label} className="surface-card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{formatNumber(item.value)}</p>
            <p className="mt-2 text-sm text-slate-600">{item.note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="surface-card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-950">Recruiter records</h2>
            <p className="mt-1 text-sm text-slate-600">Jobs and file vault overview.</p>
          </div>
          <div className="p-6 space-y-4">
            {topJobs.length > 0 ? (
              topJobs.map((job) => (
                <div key={job.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-sm font-semibold text-slate-950">{job.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {job.department} - {job.id}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">{job.description}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                No recruiter jobs available.
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <Link to="/recruiter/dashboard" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
                Open recruiter dashboard
              </Link>
              <p className="mt-2 text-sm text-slate-600">
                Follow this link to move directly into the recruiter experience.
              </p>
            </div>
          </div>
        </article>

        <article className="surface-card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-950">Candidate records</h2>
            <p className="mt-1 text-sm text-slate-600">Inbox and onboarding document activity.</p>
          </div>
          <div className="p-6 space-y-4">
            {topInbox.length > 0 ? (
              topInbox.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-sm font-semibold text-slate-950">{item.candidateAlias}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.docType} - {item.status}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">{item.reviewSummary}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                No candidate inbox items available.
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <Link to="/candidate/dashboard" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
                Open candidate dashboard
              </Link>
              <p className="mt-2 text-sm text-slate-600">
                Use this route to jump into the candidate self-service workspace.
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-950">201 file vault snapshot</h2>
          <p className="mt-1 text-sm text-slate-600">Top files from the recruiter-side archive.</p>
        </div>
        <div className="grid gap-4 p-6 lg:grid-cols-3">
          {topFiles.length > 0 ? (
            topFiles.map((file) => (
              <article key={file.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-950">{file.employeeName}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {file.employeeId} - {file.department}
                </p>
                <p className="mt-3 text-sm text-slate-600">{file.reviewSummary}</p>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              No file vault records available.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
