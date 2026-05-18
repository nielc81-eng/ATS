import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical } from "lucide-react";
import { PageFrame } from "../../components/layout/ShellPrimitives";
import { useRecruitmentData } from "../../context/RecruitmentDataContext";
import { getApplicationStatusLabel } from "../../lib/applicationStatuses";
import Pagination from "../../components/ui/Pagination";
import { paginate } from "../../lib/pagination";
import { usePaginationSearchParams } from "../../lib/usePaginationSearchParams";
import ApplicantProfileModal from "../../components/recruiter/ApplicantProfileModal";

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
  const [openMenuApplicationId, setOpenMenuApplicationId] = useState(null);
  const [profileApplicationId, setProfileApplicationId] = useState(null);
  const { page, pageSize, setPage, resetPage } = usePaginationSearchParams({
    defaultPageSize: 10,
  });

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

  const pagination = useMemo(
    () => paginate(filtered, { page, pageSize }),
    [filtered, page, pageSize]
  );

  useEffect(() => {
    if (pagination.page !== page) {
      setPage(pagination.page);
    }
  }, [page, pagination.page, setPage]);

  useEffect(() => {
    if (!openMenuApplicationId) return undefined;

    const handlePointerDown = (event) => {
      const target = event.target;
      if (!target || typeof target.closest !== "function") {
        setOpenMenuApplicationId(null);
        return;
      }

      const withinMenu = target.closest(`[data-applicant-actions="${openMenuApplicationId}"]`);
      if (withinMenu) return;
      setOpenMenuApplicationId(null);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [openMenuApplicationId]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpenMenuApplicationId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
                resetPage();
              }}
              placeholder="Search applicant, job, or status"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                resetPage();
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
                  resetPage();
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
              <AnimatePresence mode="wait">
                <motion.tbody
                  key={`${status}-${category}-${search}-${pagination.page}-${pagination.pageSize}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {pagination.pageItems.map((item) => (
                    <tr key={item.id || item.applicationId} className="border-t border-slate-100">
                      <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900">
                        {item.candidateName}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                        {item.id || item.applicationId}
                      </td>
                      <td className="px-6 py-4 text-slate-700">{item.jobTitle}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-700">
                        {getApplicationStatusLabel(item.status)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                        {item.updatedOn || item.appliedOn || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className="relative inline-flex"
                          data-applicant-actions={String(item.id || item.applicationId || "")}
                        >
                          <button
                            type="button"
                            aria-haspopup="menu"
                            aria-expanded={openMenuApplicationId === (item.id || item.applicationId)}
                            onClick={() =>
                              setOpenMenuApplicationId((prev) =>
                                prev === (item.id || item.applicationId)
                                  ? null
                                  : item.id || item.applicationId
                              )
                            }
                            className={[
                              "inline-flex items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold transition",
                              openMenuApplicationId === (item.id || item.applicationId)
                                ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                                : "border-slate-300 bg-white text-slate-700 hover:border-slate-400",
                            ].join(" ")}
                          >
                            <MoreVertical size={16} />
                          </button>

                          {openMenuApplicationId === (item.id || item.applicationId) ? (
                            <div
                              role="menu"
                              aria-label="Applicant actions"
                              className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.12)]"
                            >
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setProfileApplicationId(item.id || item.applicationId);
                                  setOpenMenuApplicationId(null);
                                }}
                                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                              >
                                View Profile
                                <span className="text-slate-400">›</span>
                              </button>
                              <div className="h-px bg-slate-100" />
                              <Link
                                role="menuitem"
                                to={`/recruiter/jobs/${encodeURIComponent(item.jobId)}/screening`}
                                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                                onClick={() => setOpenMenuApplicationId(null)}
                              >
                                Open Job Screening
                                <span className="text-slate-400">›</span>
                              </Link>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pagination.pageItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                        No applicants matched the selected filters.
                      </td>
                    </tr>
                  ) : null}
                </motion.tbody>
              </AnimatePresence>
            </table>
          </div>

          <Pagination
            label="Applicants"
            page={pagination.page}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            onPrev={() => setPage(pagination.page - 1)}
            onNext={() => setPage(pagination.page + 1)}
            onPageChange={(next) => setPage(next)}
          />
        </section>

        {profileApplicationId ? (
          <ApplicantProfileModal
            applicationsOnPage={pagination.pageItems}
            initialApplicationId={profileApplicationId}
            onClose={() => setProfileApplicationId(null)}
          />
        ) : null}
      </div>
    </PageFrame>
  );
}
