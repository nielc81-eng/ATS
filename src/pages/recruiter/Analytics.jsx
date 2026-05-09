import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import HorizontalBars from "../../components/recruiter/HorizontalBars";
import MetricCard from "../../components/recruiter/MetricCard";
import { useRecruitmentData } from "../../context/RecruitmentDataContext";
import { resolveJobId } from "../../lib/jobNavigation";
import { semanticDemand } from "../../lib/recruitmentMockData";

function formatPercent(value) {
  return `${value}%`;
}

function ComparisonChart({ job }) {
  const max = Math.max(job.applicants, job.shortlisted, 1);
  const totalWidth = job.applicants > 0 ? Math.max(10, Math.round((job.applicants / max) * 100)) : 0;
  const shortlistWidth = job.shortlisted > 0 ? Math.max(10, Math.round((job.shortlisted / max) * 100)) : 0;
  const conversion =
    job.applicants > 0 ? Math.round((job.shortlisted / job.applicants) * 100) : 0;

  return (
    <section className="surface-card p-6">
      <p className="section-heading">Applicants vs Shortlisted</p>
      <div className="mt-5 space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-900">Total Applicants</span>
            <span className="text-slate-500">{job.applicants}</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-950"
              style={{ width: `${totalWidth}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-900">Shortlisted</span>
            <span className="text-slate-500">{job.shortlisted}</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-600"
              style={{ width: `${shortlistWidth}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
            Conversion
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-950">
            {formatPercent(conversion)}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
            Screening Days
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-950">
            {job.screeningDays}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
            Offer Days
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-950">
            {job.offerDays}
          </p>
        </div>
      </div>
    </section>
  );
}

export default function RecruiterAnalytics() {
  const { analyticsJobs } = useRecruitmentData();
  const [searchParams, setSearchParams] = useSearchParams();
  const jobParam = searchParams.get("job")?.trim() ?? "";
  const [selectedJobId, setSelectedJobId] = useState(() =>
    resolveJobId(analyticsJobs, jobParam)
  );
  const [notice, setNotice] = useState("");
  const [exporting, setExporting] = useState(null);
  const exportTimerRef = useRef(null);

  const selectedJob = useMemo(
    () =>
      analyticsJobs.find((job) => job.id === selectedJobId) ??
      analyticsJobs.find((job) => job.id === resolveJobId(analyticsJobs, jobParam)) ??
      null,
    [analyticsJobs, jobParam, selectedJobId]
  );

  const summary = useMemo(() => {
    if (!selectedJob) {
      return {
        conversion: 0,
        avgPipelineDays: 0,
        shortlistedRatio: "0/0",
      };
    }

    const conversion =
      selectedJob.applicants > 0
        ? Math.round((selectedJob.shortlisted / selectedJob.applicants) * 100)
        : 0;
    const avgPipelineDays =
      selectedJob.screeningDays + selectedJob.interviewDays + selectedJob.offerDays;

    return {
      conversion,
      avgPipelineDays,
      shortlistedRatio: `${selectedJob.shortlisted}/${selectedJob.applicants}`,
    };
  }, [selectedJob]);

  useEffect(() => {
    const nextJobId = resolveJobId(analyticsJobs, jobParam);
    if (nextJobId && nextJobId !== selectedJobId) {
      setSelectedJobId(nextJobId);
    }
  }, [analyticsJobs, jobParam, selectedJobId]);

  useEffect(() => {
    if (selectedJobId && jobParam !== selectedJobId) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("job", selectedJobId);
      setSearchParams(nextParams, { replace: true });
    }
  }, [jobParam, searchParams, selectedJobId, setSearchParams]);

  useEffect(() => {
    return () => {
      if (exportTimerRef.current) {
        window.clearTimeout(exportTimerRef.current);
      }
    };
  }, []);

  const handleExport = (format) => {
    if (!selectedJob) return;

    if (exportTimerRef.current) {
      window.clearTimeout(exportTimerRef.current);
    }

    setExporting(format);
    setNotice(`Preparing ${format.toUpperCase()} export for ${selectedJob.title}...`);

    exportTimerRef.current = window.setTimeout(() => {
      setExporting(null);
      setNotice(`${format.toUpperCase()} export mocked successfully for ${selectedJob.title}.`);
      exportTimerRef.current = null;
    }, 1400);
  };

  const exportLabel = (format) =>
    exporting === format
      ? `Exporting ${format.toUpperCase()}...`
      : `Export to ${format.toUpperCase()}`;

  if (!selectedJob) {
    return (
      <section className="surface-card p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-950">
          No analytics data available.
        </h1>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">Recruiter Portal</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Analytics and Reports
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Review recruitment performance, chart applicant flow, inspect cycle
          reports, and mock export deliverables for HR leadership.
        </p>
      </section>

      <section className="surface-card p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-heading">Dashboard Scope</p>
            <label
              htmlFor="analytics-job"
              className="mt-3 block text-sm font-medium text-slate-700"
            >
              Select Job Requisition
            </label>
            <select
              id="analytics-job"
              value={selectedJobId}
              onChange={(event) => setSelectedJobId(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 sm:w-[26rem]"
            >
              {analyticsJobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} - {job.department}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleExport("pdf")}
              disabled={Boolean(exporting)}
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exportLabel("pdf")}
            </button>
            <button
              type="button"
              onClick={() => handleExport("xlsx")}
              disabled={Boolean(exporting)}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exportLabel("xlsx")}
            </button>
          </div>
        </div>

        {notice ? (
          <div
            role="status"
            aria-live="polite"
            className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800"
          >
            {notice}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Applicants"
          value={selectedJob.applicants}
          detail="Combined inbound resumes for the selected requisition."
          tone="slate"
        />
        <MetricCard
          label="Shortlisted"
          value={selectedJob.shortlisted}
          detail={`Current conversion: ${summary.shortlistedRatio}.`}
          tone="emerald"
        />
        <MetricCard
          label="Match Rate"
          value={formatPercent(summary.conversion)}
          detail="Semantic ranking output after blind screening."
          tone="blue"
        />
        <MetricCard
          label="Time to Fill"
          value={`${selectedJob.timeToFillDays} days`}
          detail="Pipeline duration from opening to offer stage."
          tone="amber"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <ComparisonChart job={selectedJob} />

        <section className="surface-card p-6">
          <p className="section-heading">Time-to-Fill Metrics</p>
          <div className="mt-5 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                Screening
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {selectedJob.screeningDays} days
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                Interview
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {selectedJob.interviewDays} days
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                Offer
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {selectedJob.offerDays} days
              </p>
            </div>
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
              Total pipeline time for this role is{" "}
              <span className="font-semibold text-slate-900">
                {summary.avgPipelineDays} days
              </span>
              .
            </div>
          </div>
        </section>
      </section>

      <HorizontalBars
        title="Top Semantic Skills in Demand"
        items={semanticDemand}
        accent="bg-slate-950"
      />

      <section className="surface-card overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="section-heading">Recruitment Cycle Report</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">
              {selectedJob.title}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Structured summary for one job requisition.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Mock export ready
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">Stage</th>
                <th className="px-6 py-3 font-medium">Candidates</th>
                <th className="px-6 py-3 font-medium">Avg Match</th>
                <th className="px-6 py-3 font-medium">Cycle Day</th>
                <th className="px-6 py-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {selectedJob.reportRows.length > 0 ? (
                selectedJob.reportRows.map((row) => (
                  <tr key={`${selectedJob.id}-${row.stage}`} className="border-t border-slate-100">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {row.stage}
                    </td>
                    <td className="px-6 py-4 text-slate-700">{row.candidates}</td>
                    <td className="px-6 py-4 text-slate-700">{row.avgMatch}</td>
                    <td className="px-6 py-4 text-slate-700">{row.cycleDay}</td>
                    <td className="px-6 py-4 text-slate-700">{row.note}</td>
                  </tr>
                ))
              ) : (
                <tr className="border-t border-slate-100">
                  <td className="px-6 py-6 text-sm text-slate-600" colSpan={5}>
                    No report rows yet for this requisition.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
