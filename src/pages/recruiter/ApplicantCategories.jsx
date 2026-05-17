import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageFrame } from "../../components/layout/ShellPrimitives";
import { useRecruitmentData } from "../../context/RecruitmentDataContext";

function formatDate(dateString) {
  if (!dateString) return "No date";
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function RecruiterApplicantCategories() {
  const [selectedCategory, setSelectedCategory] = useState("All categories");
  const { getCategoryApplicantCounts, getApplicantsByCategory } = useRecruitmentData();

  const categoryCounts = useMemo(() => getCategoryApplicantCounts(), [getCategoryApplicantCounts]);
  const categories = useMemo(
    () => ["All categories", ...categoryCounts.map((item) => item.category)],
    [categoryCounts]
  );

  const selectedCategoryApplicants = useMemo(() => {
    if (selectedCategory === "All categories") {
      return categoryCounts
        .flatMap((item) => getApplicantsByCategory(item.category))
        .sort((left, right) => new Date(right.updatedOn) - new Date(left.updatedOn));
    }
    return getApplicantsByCategory(selectedCategory);
  }, [categoryCounts, getApplicantsByCategory, selectedCategory]);

  useEffect(() => {
    if (selectedCategory !== "All categories" && !categories.includes(selectedCategory)) {
      setSelectedCategory("All categories");
      return;
    }
    if (selectedCategory === "All categories" && categoryCounts.length > 0) {
      setSelectedCategory(categoryCounts[0].category);
    }
  }, [categories, categoryCounts, selectedCategory]);

  return (
    <PageFrame size="wide">
      <div className="space-y-6">
        <section className="surface-card p-6 sm:p-8">
          <p className="section-heading">Talent Acquisition Portal</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Applicant Categories
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            Review department-level applicant volume and drill down into every active application.
          </p>
        </section>

        <section className="surface-card p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="section-heading">Editorial Operations Board</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">
                Category Applicant Visibility
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Track live applicant volume by department and review every active application in one
                drill-down panel.
              </p>
            </div>
            <div className="min-w-[220px]">
              <label
                htmlFor="category-filter"
                className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
              >
                Department Category
              </label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {categoryCounts.length > 0 ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {categoryCounts.map((item) => {
                const isActive = selectedCategory === item.category;
                return (
                  <button
                    key={item.category}
                    type="button"
                    onClick={() => setSelectedCategory(item.category)}
                    className={[
                      "rounded-2xl border px-4 py-4 text-left transition",
                      isActive
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300 hover:bg-white",
                    ].join(" ")}
                  >
                    <p
                      className={[
                        "text-xs uppercase tracking-[0.14em]",
                        isActive ? "text-slate-300" : "text-slate-500",
                      ].join(" ")}
                    >
                      {item.category}
                    </p>
                    <p className="mt-2 text-2xl font-semibold">{item.applicants}</p>
                    <p className={["mt-1 text-xs", isActive ? "text-slate-300" : "text-slate-500"].join(" ")}>
                      Active applications
                    </p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-4 text-sm text-slate-600">
              No applicant data yet. Candidate applications will appear here once submissions are
              received.
            </div>
          )}

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Applied Applicants</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {selectedCategory === "All categories" ? "All categories" : selectedCategory}
              </p>
            </div>
            {selectedCategoryApplicants.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-white text-xs uppercase tracking-[0.12em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Applicant</th>
                      <th className="px-4 py-3 font-medium">Application ID</th>
                      <th className="px-4 py-3 font-medium">Job</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Applied</th>
                      <th className="px-4 py-3 font-medium">Updated</th>
                    </tr>
                  </thead>
                  <AnimatePresence mode="wait">
                    <motion.tbody
                      key={selectedCategory}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {selectedCategoryApplicants.map((applicant) => (
                        <tr key={applicant.applicationId} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-medium text-slate-900">{applicant.candidateName}</td>
                        <td className="px-4 py-3 text-slate-600">{applicant.applicationId}</td>
                        <td className="px-4 py-3 text-slate-700">
                          {applicant.jobTitle}
                          <p className="text-xs text-slate-500">{applicant.jobId}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{applicant.status}</td>
                        <td className="px-4 py-3 text-slate-700">{formatDate(applicant.appliedOn)}</td>
                        <td className="px-4 py-3 text-slate-700">{formatDate(applicant.updatedOn)}</td>
                      </tr>
                    ))}
                  </motion.tbody>
                  </AnimatePresence>
                </table>
              </div>
            ) : (
              <div className="px-5 py-4 text-sm text-slate-600">
                No applicants found for this department category yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </PageFrame>
  );
}
