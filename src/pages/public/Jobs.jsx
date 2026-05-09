import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useRecruitmentData } from "../../context/RecruitmentDataContext";

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
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const isCandidate = isAuthenticated && session?.role === "Candidate";
  const isRecruiter = isAuthenticated && session?.role === "Recruiter";

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
  }, [department, jobs, search, sortBy]);

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
              Recruiter Dashboard
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
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="jobs-search" className="mb-2 block text-sm font-medium text-slate-700">
              Search
            </label>
            <input
              id="jobs-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
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
              onChange={(event) => setDepartment(event.target.value)}
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
              onChange={(event) => setSortBy(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleJobs.length > 0 ? (
          visibleJobs.map((job) => (
            <article key={job.id} className="surface-card p-5">
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
    </div>
  );
}
