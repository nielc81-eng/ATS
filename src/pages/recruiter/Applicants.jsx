import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageFrame } from "../../components/layout/ShellPrimitives";
import { useRecruitmentData } from "../../context/RecruitmentDataContext";
import { getApplicationStatusLabel } from "../../lib/applicationStatuses";

const PAGE_SIZE = 10;

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function toDateValue(value) {
  const parsed = Date.parse(value || "");
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default function RecruiterApplicants() {
  const { jobId = "" } = useParams();
  const { jobs, getApplicationsForJob, getCategoryApplicantCounts, getApplicantsByCategory } =
    useRecruitmentData();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);

  const categoryCounts = useMemo(() => getCategoryApplicantCounts(), [getCategoryApplicantCounts]);
  const categories = useMemo(
    () => ["All", ...categoryCounts.map((item) => item.category)],
    [categoryCounts]
  );

  const scopedApplications = useMemo(() => {
    if (jobId) return getApplicationsForJob(jobId);
    if (category !== "All") return getApplicantsByCategory(category);
    return jobs.flatMap((job) => getApplicationsForJob(job.id));
  }, [category, getApplicantsByCategory, getApplicationsForJob, jobId, jobs]);

  const statusOptions = useMemo(
    () => ["All", ...new Set(scopedApplications.map((item) => item.status).filter(Boolean))],
    [scopedApplications]
  );

  const filtered = useMemo(() => {
    const query = normalize(search);
    return scopedApplications
      .filter((item) => (status === "All" ? true : item.status === status))
      .filter((item) => {
        if (!query) return true;
        return [item.id, item.candidateName, item.jobId, item.jobTitle, item.status]
          .some((value) => normalize(value).includes(query));
      })
      .sort((left, right) => toDateValue(right.updatedOn || right.appliedOn) - toDateValue(left.updatedOn || left.appliedOn));
  }, [scopedApplications, search, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <PageFrame size="wide">
      <div className="space-y-6">
        <section className="surface-card p-6 sm:p-8">
          <p className="section-heading">Talent Acquisition Portal</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Applicants
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Dedicated applicant workspace with search, filtering, and pagination.
          </p>
        </section>

        <section className="surface-card p-6">
          <div className="grid gap-3 md:grid-cols-4">
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search applicant, job, or status"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              {statusOptions.map((item) => (
                <option key={item} value={item}>
                  {getApplicationStatusLabel(item) || item}
                </option>
              ))}
            </select>
            {!jobId ? (
              <select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  setPage(1);
                }}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Scoped to job: {jobId}
              </div>
            )}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {filtered.length} result(s)
            </div>
          </div>
        </section>

        <section className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[70rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Applicant</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Application ID</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Job</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Status</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Updated</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900">
                      {item.candidateName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">{item.id}</td>
                    <td className="px-6 py-4 text-slate-700">{item.jobTitle}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-700">
                      {getApplicationStatusLabel(item.status)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                      {item.updatedOn || item.appliedOn || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/recruiter/jobs/${encodeURIComponent(item.jobId)}/screening`}
                        className="inline-flex whitespace-nowrap rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400"
                      >
                        Open Job Screening
                      </Link>
                    </td>
                  </tr>
                ))}
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                      No applicants matched the selected filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
            <p className="text-xs text-slate-500">
              Page {safePage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={safePage <= 1}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                disabled={safePage >= totalPages}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>
    </PageFrame>
  );
}
