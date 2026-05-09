import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import TagInput from "../../components/recruiter/TagInput";
import { useRecruitmentData } from "../../context/RecruitmentDataContext";

const initialForm = {
  title: "",
  department: "",
  description: "",
};

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function countSkillGaps(job) {
  return Math.max(0, job.mustHaveSkills.length - job.niceToHaveSkills.length);
}

export default function RecruiterJobs() {
  const [form, setForm] = useState(initialForm);
  const [mustHaveSkills, setMustHaveSkills] = useState([]);
  const [niceToHaveSkills, setNiceToHaveSkills] = useState([]);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const { jobs, addJob } = useRecruitmentData();

  const totals = useMemo(
    () => ({
      jobs: jobs.length,
      applicants: jobs.reduce((sum, job) => sum + job.applicants, 0),
    }),
    [jobs]
  );

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setNotice("");
  };

  const validate = () => {
    const next = {};

    if (!form.title.trim()) next.title = "Job title is required.";
    if (!form.department.trim()) next.department = "Department is required.";
    if (!form.description.trim()) next.description = "Job description is required.";
    if (mustHaveSkills.length === 0) {
      next.mustHaveSkills = "Add at least one must-have skill.";
    }

    return next;
  };

  const handleCreateJob = (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const nextJob = addJob({
      title: form.title,
      department: form.department,
      description: form.description,
      mustHaveSkills,
      niceToHaveSkills,
    });

    setForm(initialForm);
    setMustHaveSkills([]);
    setNiceToHaveSkills([]);
    setErrors({});
    setNotice(`Job requisition ${nextJob.id} created.`);
  };

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">Recruiter Portal</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Job Requisitions
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Create semantic job requirements and manage active postings in one
          workspace.
        </p>
      </section>

      <section className="surface-card p-6 sm:p-8">
        <div className="mb-5 flex flex-wrap gap-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
              Active Jobs
            </p>
            <p className="text-lg font-semibold text-slate-900">{totals.jobs}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
              Total Applicants
            </p>
            <p className="text-lg font-semibold text-slate-900">
              {totals.applicants}
            </p>
          </div>
        </div>

        <form className="space-y-5" onSubmit={handleCreateJob} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Job Title
              </label>
              <input
                id="title"
                name="title"
                value={form.title}
                onChange={handleInputChange}
                placeholder="Frontend Engineer"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
              {errors.title ? (
                <p className="mt-1 text-xs text-red-600">{errors.title}</p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="department"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Department
              </label>
              <input
                id="department"
                name="department"
                value={form.department}
                onChange={handleInputChange}
                placeholder="Engineering"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
              {errors.department ? (
                <p className="mt-1 text-xs text-red-600">{errors.department}</p>
              ) : null}
            </div>
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Job Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={5}
              value={form.description}
              onChange={handleInputChange}
              placeholder="Describe responsibilities, impact, and required domain experience."
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
            {errors.description ? (
              <p className="mt-1 text-xs text-red-600">{errors.description}</p>
            ) : null}
          </div>

          <TagInput
            id="must-have-skills"
            label="Must-Have Skills"
            placeholder="Type a skill and press Enter or comma"
            helperText="Required: add at least one skill."
            tags={mustHaveSkills}
            onChange={(next) => {
              setMustHaveSkills(next);
              setErrors((prev) => ({ ...prev, mustHaveSkills: "" }));
            }}
          />
          {errors.mustHaveSkills ? (
            <p className="-mt-3 text-xs text-red-600">{errors.mustHaveSkills}</p>
          ) : null}

          <TagInput
            id="nice-to-have-skills"
            label="Nice-to-Have Skills"
            placeholder="Type a skill and press Enter or comma"
            helperText="Optional skills that improve ranking quality."
            tags={niceToHaveSkills}
            onChange={setNiceToHaveSkills}
          />

          <button
            type="submit"
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Create Job Requisition
          </button>
        </form>

        {notice ? (
          <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {notice}
          </div>
        ) : null}
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Active Jobs</h2>
          <p className="mt-1 text-sm text-slate-600">
            Track requisitions, applicant volume, and candidate review entry points.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">Job</th>
                <th className="px-6 py-3 font-medium">Applicants</th>
                <th className="px-6 py-3 font-medium">Date Posted</th>
                <th className="px-6 py-3 font-medium">Skill Delta</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-t border-slate-100">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{job.title}</p>
                    <p className="text-xs text-slate-500">
                      {job.department} - {job.id}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{job.applicants}</td>
                  <td className="px-6 py-4 text-slate-700">
                    {formatDate(job.postedOn)}
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {countSkillGaps(job)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/recruiter/screening?job=${encodeURIComponent(job.id)}`}
                        className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                      >
                        View Candidates
                      </Link>
                      <Link
                        to={`/recruiter/analytics?job=${encodeURIComponent(job.id)}`}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                      >
                        Analytics
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
