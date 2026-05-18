import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSavedJobs } from "../../context/SavedJobsContext";
import { useRecruitmentData } from "../../context/RecruitmentDataContext";
import Pagination from "../../components/ui/Pagination";
import { paginate } from "../../lib/pagination";
import { usePaginationSearchParams } from "../../lib/usePaginationSearchParams";

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function sortJobs(items, sortBy) {
  const next = [...items];

  if (sortBy === "oldest") {
    return next.sort((left, right) => Date.parse(left.postedOn) - Date.parse(right.postedOn));
  }

  return next.sort((left, right) => Date.parse(right.postedOn) - Date.parse(left.postedOn));
}

export default function PublicJobsBoard() {
  const { session, isAuthenticated } = useAuth();
  const { jobs } = useRecruitmentData();
  const { savedJobIds, isSaved, toggleSaved } = useSavedJobs();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const { page, pageSize, setPage, setPageSize, resetPage } = usePaginationSearchParams({
    defaultPageSize: 12,
  });
  const isCandidate = isAuthenticated && session?.role === "Candidate";
  const isRecruiter = isAuthenticated && session?.role === "Recruiter";

  const activeTab = useMemo(() => {
    const raw = String(searchParams.get("tab") || "").trim().toLowerCase();
    return raw === "saved" ? "saved" : "explore";
  }, [searchParams]);

  const savedJobIdSet = useMemo(() => new Set(savedJobIds), [savedJobIds]);

  const setTab = (nextTab) => {
    const normalized = nextTab === "saved" ? "saved" : "explore";
    const nextParams = new URLSearchParams(searchParams);
    if (normalized === "saved") {
      nextParams.set("tab", "saved");
    } else {
      nextParams.delete("tab");
    }
    nextParams.delete("page");
    setSearchParams(nextParams, { replace: true });
  };

  const departments = useMemo(() => {
    return [
      "All",
      ...new Set(
        jobs
          .map((job) => String(job.department || "").trim())
          .filter(Boolean)
      ),
    ];
  }, [jobs]);

  const visibleJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = jobs.filter((job) => {
      if (activeTab === "saved" && !savedJobIdSet.has(job.id)) {
        return false;
      }

      const departmentMatch = department === "All" ? true : job.department === department;
      if (!departmentMatch) return false;

      if (!query) return true;

      return [
        job.id,
        job.title,
        job.department,
        job.description,
        ...(job.mustHaveSkills || []),
        ...(job.niceToHaveSkills || []),
      ].some((value) => String(value || "").toLowerCase().includes(query));
    });

    return sortJobs(filtered, sortBy);
  }, [activeTab, department, jobs, savedJobIdSet, search, sortBy]);

  const pagination = useMemo(
    () => paginate(visibleJobs, { page, pageSize }),
    [page, pageSize, visibleJobs]
  );

  useEffect(() => {
    if (pagination.page !== page) {
      setPage(pagination.page);
    }
  }, [page, pagination.page, setPage]);

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">Public Job Board</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Browse Open Roles
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Explore active requisitions posted by recruiters. Sign in as a candidate to apply.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            to="/jobs"
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            Browse Jobs
          </Link>
          {isCandidate ? (
            <>
              <Link
                to="/candidate/dashboard"
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                Dashboard
              </Link>
              <Link
                to="/candidate/applications"
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                My Applications
              </Link>
            </>
          ) : null}
          {isRecruiter ? (
            <Link
              to="/recruiter/dashboard"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Talent Acquisition Dashboard
            </Link>
          ) : null}
          {!isAuthenticated ? (
            <>
              <Link
                to="/login"
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                Register
              </Link>
            </>
          ) : null}
        </div>
      </section>

      <section className="surface-card p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setTab("explore")}
              className={
                activeTab === "explore"
                  ? "rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm"
                  : "rounded-2xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
              }
            >
              Explore Jobs
            </button>
            <button
              type="button"
              onClick={() => setTab("saved")}
              className={
                activeTab === "saved"
                  ? "rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm"
                  : "rounded-2xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
              }
            >
              Saved Jobs
            </button>
          </div>

          {activeTab === "saved" ? (
            <p className="text-sm text-slate-500">{savedJobIds.length} saved</p>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="jobs-search" className="mb-2 block text-sm font-medium text-slate-700">
              Search
            </label>
            <input
              id="jobs-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                resetPage();
              }}
              placeholder="Title, skills, ID"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label htmlFor="jobs-department" className="mb-2 block text-sm font-medium text-slate-700">
              Department
            </label>
            <select
              id="jobs-department"
              value={department}
              onChange={(event) => {
                setDepartment(event.target.value);
                resetPage();
              }}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              {departments.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="jobs-sort" className="mb-2 block text-sm font-medium text-slate-700">
              Sort
            </label>
            <select
              id="jobs-sort"
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value);
                resetPage();
              }}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {activeTab === "saved" && savedJobIds.length === 0 ? (
          <div className="surface-card px-6 py-10 text-sm text-slate-600 md:col-span-2 xl:col-span-3">
            <p className="font-medium text-slate-900">No saved jobs yet.</p>
            <p className="mt-2">
              Tap the heart icon on a job to save it for later.
            </p>
            <button
              type="button"
              onClick={() => setTab("explore")}
              className="mt-4 inline-flex rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Browse Jobs
            </button>
          </div>
        ) : pagination.pageItems.length > 0 ? (
          pagination.pageItems.map((job) => (
            <article key={job.id} className="surface-card relative p-5">
              <button
                type="button"
                onClick={() => toggleSaved(job.id)}
                aria-label={isSaved(job.id) ? "Unsave job" : "Save job"}
                className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-slate-700"
              >
                <Heart
                  className={
                    isSaved(job.id)
                      ? "h-5 w-5 fill-rose-600 text-rose-600"
                      : "h-5 w-5"
                  }
                />
              </button>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{job.id}</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-950">{job.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{job.department}</p>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                {job.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {(job.mustHaveSkills || []).slice(0, 3).map((skill) => (
                  <span
                    key={`${job.id}-${skill}`}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
                <span>Posted {formatDate(job.postedOn)}</span>
                <span>{job.applicants} applicants</span>
              </div>

              <Link
                to={`/jobs/${encodeURIComponent(job.id)}`}
                className="mt-4 inline-flex rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                View Details
              </Link>
            </article>
          ))
        ) : (
          <div className="surface-card px-6 py-10 text-sm text-slate-600 md:col-span-2 xl:col-span-3">
            No jobs matched your filters.
          </div>
        )}
      </section>

      <section className="surface-card overflow-hidden">
        <Pagination
          label="Jobs"
          page={pagination.page}
          totalPages={pagination.totalPages}
          pageSize={pagination.pageSize}
          totalItems={pagination.totalItems}
          onPrev={() => setPage(pagination.page - 1)}
          onNext={() => setPage(pagination.page + 1)}
          onPageChange={(next) => setPage(next)}
          pageSizeOptions={[12, 24, 48]}
          onPageSizeChange={(next) => setPageSize(next)}
        />
      </section>
    </div>
  );
}
