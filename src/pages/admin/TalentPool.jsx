import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTalentPool } from "../../context/TalentPoolContext";
import { candidateAvailabilityStates, vacancyStates } from "../../lib/talentPoolSchemas";

function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDate(value) {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminTalentPoolSettings() {
  const {
    pools,
    vacancies,
    matchingSettings,
    recruiterPermissions,
    analytics,
    setMatchingSettings,
    upsertPool,
    upsertVacancy,
    setRecruiterAccess,
  } = useTalentPool();
  const [notice, setNotice] = useState("");
  const [settingsForm, setSettingsForm] = useState({
    threshold: matchingSettings.threshold,
    skillWeight: matchingSettings.skillWeight,
    confidenceWeight: matchingSettings.confidenceWeight,
  });
  const [poolForm, setPoolForm] = useState({
    name: "",
    department: "",
    tags: "",
    description: "",
  });
  const [vacancyForm, setVacancyForm] = useState({
    title: "",
    poolId: pools[0]?.id || "",
    department: pools[0]?.department || "",
    skills: "",
    location: "Remote",
    availability: "Immediate",
    state: "Open",
  });

  const recruiterRows = useMemo(
    () =>
      Object.entries(recruiterPermissions)
        .map(([email, permission]) => ({
          email,
          permission,
        }))
        .sort((left, right) => left.email.localeCompare(right.email)),
    [recruiterPermissions]
  );

  const handleSaveSettings = (event) => {
    event.preventDefault();
    const result = setMatchingSettings({
      threshold: Number(settingsForm.threshold),
      skillWeight: Number(settingsForm.skillWeight),
      confidenceWeight: Number(settingsForm.confidenceWeight),
    });
    if (!result.ok) {
      setNotice(result.message);
      return;
    }
    setSettingsForm({
      threshold: result.settings.threshold,
      skillWeight: result.settings.skillWeight,
      confidenceWeight: result.settings.confidenceWeight,
    });
    setNotice("Global AI matching settings updated.");
  };

  const handleCreatePool = (event) => {
    event.preventDefault();
    const result = upsertPool({
      name: poolForm.name,
      department: poolForm.department,
      tags: splitCsv(poolForm.tags),
      description: poolForm.description,
    });
    if (!result.ok) {
      setNotice(result.message);
      return;
    }
    setPoolForm({ name: "", department: "", tags: "", description: "" });
    setNotice(`Pool ${result.pool.name} saved.`);
  };

  const handleCreateVacancy = (event) => {
    event.preventDefault();
    const selectedPool = pools.find((pool) => pool.id === vacancyForm.poolId);
    const result = upsertVacancy({
      ...vacancyForm,
      department: vacancyForm.department || selectedPool?.department || "General",
      skills: splitCsv(vacancyForm.skills),
    });
    if (!result.ok) {
      setNotice(result.message);
      return;
    }
    setVacancyForm((prev) => ({
      ...prev,
      title: "",
      skills: "",
      poolId: pools[0]?.id || "",
      department: pools[0]?.department || "",
    }));
    setNotice(`Vacancy ${result.vacancy.title} saved.`);
  };

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">Administrator</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Talent Pool Settings
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Control global matching thresholds, skill weighting, recruiter access, and
          the shared vacancy catalog.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to="/admin/talent-pool/analytics"
            className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Open Talent Pool Analytics
          </Link>
        </div>
      </section>

      {notice ? (
        <section className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {notice}
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Pools</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{analytics.totalPools}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Candidates</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{analytics.totalCandidates}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Open Vacancies</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{analytics.openVacancies}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Avg Top Match</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{analytics.averageTopMatchScore}%</p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="surface-card p-6">
          <h2 className="text-lg font-semibold text-slate-950">AI Matching Controls</h2>
          <p className="mt-1 text-sm text-slate-600">
            Global thresholds and score weighting apply to every pool recommendation.
          </p>
          <form className="mt-5 space-y-4" onSubmit={handleSaveSettings}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Match Threshold (%)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={settingsForm.threshold}
                onChange={(event) =>
                  setSettingsForm((prev) => ({ ...prev, threshold: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Skill Weight
                </label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={settingsForm.skillWeight}
                  onChange={(event) =>
                    setSettingsForm((prev) => ({ ...prev, skillWeight: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Confidence Weight
                </label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={settingsForm.confidenceWeight}
                  onChange={(event) =>
                    setSettingsForm((prev) => ({
                      ...prev,
                      confidenceWeight: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <button
              type="submit"
              className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Save Matching Settings
            </button>
          </form>
        </article>

        <article className="surface-card p-6">
          <h2 className="text-lg font-semibold text-slate-950">Add Talent Pool</h2>
          <form className="mt-5 space-y-4" onSubmit={handleCreatePool}>
            <input
              value={poolForm.name}
              onChange={(event) => setPoolForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Pool name"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
            <input
              value={poolForm.department}
              onChange={(event) =>
                setPoolForm((prev) => ({ ...prev, department: event.target.value }))
              }
              placeholder="Department"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
            <input
              value={poolForm.tags}
              onChange={(event) => setPoolForm((prev) => ({ ...prev, tags: event.target.value }))}
              placeholder="Tags (comma separated)"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
            <textarea
              rows={3}
              value={poolForm.description}
              onChange={(event) =>
                setPoolForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Description"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="submit"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Save Pool
            </button>
          </form>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="surface-card p-6">
          <h2 className="text-lg font-semibold text-slate-950">Pool Directory</h2>
          <div className="mt-4 space-y-3">
            {pools.map((pool) => (
              <article key={pool.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">{pool.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {pool.id} • {pool.department}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {pool.tags.length > 0 ? (
                    pool.tags.map((tag) => (
                      <span
                        key={`${pool.id}-${tag}`}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">No tags set.</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="surface-card p-6">
          <h2 className="text-lg font-semibold text-slate-950">Add Vacancy</h2>
          <form className="mt-5 space-y-4" onSubmit={handleCreateVacancy}>
            <input
              value={vacancyForm.title}
              onChange={(event) =>
                setVacancyForm((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="Vacancy title"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
            <select
              value={vacancyForm.poolId}
              onChange={(event) => {
                const nextPool = pools.find((pool) => pool.id === event.target.value);
                setVacancyForm((prev) => ({
                  ...prev,
                  poolId: event.target.value,
                  department: nextPool?.department || prev.department,
                }));
              }}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              {pools.map((pool) => (
                <option key={pool.id} value={pool.id}>
                  {pool.name} ({pool.id})
                </option>
              ))}
            </select>
            <input
              value={vacancyForm.department}
              onChange={(event) =>
                setVacancyForm((prev) => ({ ...prev, department: event.target.value }))
              }
              placeholder="Department"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
            <input
              value={vacancyForm.skills}
              onChange={(event) =>
                setVacancyForm((prev) => ({ ...prev, skills: event.target.value }))
              }
              placeholder="Skills (comma separated)"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <input
                value={vacancyForm.location}
                onChange={(event) =>
                  setVacancyForm((prev) => ({ ...prev, location: event.target.value }))
                }
                placeholder="Location"
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
              <select
                value={vacancyForm.availability}
                onChange={(event) =>
                  setVacancyForm((prev) => ({ ...prev, availability: event.target.value }))
                }
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                {candidateAvailabilityStates.map((availability) => (
                  <option key={availability} value={availability}>
                    {availability}
                  </option>
                ))}
              </select>
              <select
                value={vacancyForm.state}
                onChange={(event) =>
                  setVacancyForm((prev) => ({ ...prev, state: event.target.value }))
                }
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                {vacancyStates.map((stateValue) => (
                  <option key={stateValue} value={stateValue}>
                    {stateValue}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Save Vacancy
            </button>
          </form>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="surface-card p-6">
          <h2 className="text-lg font-semibold text-slate-950">Vacancy Directory</h2>
          <div className="mt-4 space-y-3">
            {vacancies.map((vacancy) => (
              <article
                key={vacancy.id}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{vacancy.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {vacancy.id} • {vacancy.department} • {vacancy.state}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">
                    Created {formatDate(vacancy.createdOn)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {vacancy.skills.map((skill) => (
                    <span
                      key={`${vacancy.id}-${skill}`}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="surface-card p-6">
          <h2 className="text-lg font-semibold text-slate-950">Recruiter Access Controls</h2>
          <p className="mt-1 text-sm text-slate-600">
            Assign pool and department access for recruiter operations.
          </p>
          <div className="mt-4 space-y-4">
            {recruiterRows.length > 0 ? (
              recruiterRows.map(({ email, permission }) => (
                <RecruiterPermissionCard
                  key={email}
                  email={email}
                  pools={pools}
                  permission={permission}
                  onSave={(nextPermission) => {
                    const result = setRecruiterAccess(email, nextPermission);
                    setNotice(
                      result.ok
                        ? `Access updated for ${email}.`
                        : result.message || "Unable to update recruiter access."
                    );
                  }}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                No recruiter accounts detected yet.
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

function RecruiterPermissionCard({ email, pools, permission, onSave }) {
  const [draft, setDraft] = useState({
    poolIds: permission.poolIds,
    departments: permission.departments.join(", "),
  });

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-900">{email}</p>
      <div className="mt-3 space-y-3">
        <div className="flex flex-wrap gap-2">
          {pools.map((pool) => {
            const active = draft.poolIds.includes(pool.id);
            return (
              <button
                key={`${email}-${pool.id}`}
                type="button"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    poolIds: active
                      ? prev.poolIds.filter((poolId) => poolId !== pool.id)
                      : [...prev.poolIds, pool.id],
                  }))
                }
                className={[
                  "rounded-full px-3 py-1 text-xs font-semibold transition",
                  active
                    ? "bg-slate-950 text-white"
                    : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400",
                ].join(" ")}
              >
                {pool.id}
              </button>
            );
          })}
        </div>
        <input
          value={draft.departments}
          onChange={(event) =>
            setDraft((prev) => ({ ...prev, departments: event.target.value }))
          }
          placeholder="Departments (comma separated)"
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />
        <button
          type="button"
          onClick={() =>
            onSave({
              poolIds: draft.poolIds,
              departments: splitCsv(draft.departments),
            })
          }
          className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
        >
          Save Access
        </button>
      </div>
    </article>
  );
}
