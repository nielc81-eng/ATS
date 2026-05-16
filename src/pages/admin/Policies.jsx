import React, { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useAdminData } from "../../context/AdminDataContext";

const STORAGE_KEY = "admin_recruitment_policy_v1";

const defaultFitScoreWeights = {
  technicalSkills: 40,
  relevantExperience: 25,
  educationalBackground: 15,
  roleAlignment: 10,
  softSkills: 10,
};

const defaultPolicy = {
  aiRankingMode: "SemanticWeightedRanking",
  requireRequisitionAlignment: true,
  complianceGateDays: 7,
  auditReportCadence: "Weekly",
  fitScoreWeights: defaultFitScoreWeights,
};

function clampWeight(value, fallback) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function readPolicy() {
  if (typeof window === "undefined") return defaultPolicy;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPolicy;
    const parsed = JSON.parse(raw);
    const storedWeights =
      parsed?.fitScoreWeights && typeof parsed.fitScoreWeights === "object"
        ? parsed.fitScoreWeights
        : null;
    const fitScoreWeights = {
      technicalSkills: clampWeight(
        storedWeights?.technicalSkills,
        defaultFitScoreWeights.technicalSkills
      ),
      relevantExperience: clampWeight(
        storedWeights?.relevantExperience,
        defaultFitScoreWeights.relevantExperience
      ),
      educationalBackground: clampWeight(
        storedWeights?.educationalBackground,
        defaultFitScoreWeights.educationalBackground
      ),
      roleAlignment: clampWeight(
        storedWeights?.roleAlignment,
        defaultFitScoreWeights.roleAlignment
      ),
      softSkills: clampWeight(storedWeights?.softSkills, defaultFitScoreWeights.softSkills),
    };
    return {
      aiRankingMode:
        typeof parsed?.aiRankingMode === "string"
          ? parsed.aiRankingMode
          : defaultPolicy.aiRankingMode,
      requireRequisitionAlignment:
        typeof parsed?.requireRequisitionAlignment === "boolean"
          ? parsed.requireRequisitionAlignment
          : defaultPolicy.requireRequisitionAlignment,
      complianceGateDays:
        typeof parsed?.complianceGateDays === "number" && Number.isFinite(parsed.complianceGateDays)
          ? Math.max(1, Math.min(30, Math.round(parsed.complianceGateDays)))
          : defaultPolicy.complianceGateDays,
      auditReportCadence:
        typeof parsed?.auditReportCadence === "string"
          ? parsed.auditReportCadence
          : defaultPolicy.auditReportCadence,
      fitScoreWeights,
    };
  } catch {
    return defaultPolicy;
  }
}

function writePolicy(value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export default function AdminPolicies() {
  const { session } = useAuth();
  const { addAuditEvent } = useAdminData();
  const [policy, setPolicy] = useState(() => readPolicy());
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fitTotal = useMemo(() => {
    const weights = policy.fitScoreWeights || defaultFitScoreWeights;
    return Object.values(weights).reduce((sum, value) => sum + (Number(value) || 0), 0);
  }, [policy.fitScoreWeights]);

  const fitDelta = fitTotal - 100;
  const fitIsValid = fitTotal === 100;

  const summary = useMemo(
    () =>
      [
        `AI ranking mode: ${policy.aiRankingMode}`,
        `Requisition alignment required: ${policy.requireRequisitionAlignment ? "Yes" : "No"}`,
        `Compliance gate window: ${policy.complianceGateDays} days`,
        `Audit report cadence: ${policy.auditReportCadence}`,
        `Fit weights: ${policy.fitScoreWeights.technicalSkills}/${policy.fitScoreWeights.relevantExperience}/${policy.fitScoreWeights.educationalBackground}/${policy.fitScoreWeights.roleAlignment}/${policy.fitScoreWeights.softSkills} (total ${fitTotal})`,
      ].join(" | "),
    [fitTotal, policy]
  );

  const savePolicy = () => {
    if (!fitIsValid) {
      setNotice("");
      setErrorMessage(
        `Fit score weights must total 100%. Currently ${fitTotal}% (${fitDelta > 0 ? `over by ${fitDelta}` : `under by ${Math.abs(fitDelta)}`}).`
      );
      return;
    }

    setErrorMessage("");
    writePolicy(policy);
    addAuditEvent({
      actor: session?.name || session?.email || "Administrator",
      action: "Updated recruitment and AI policies",
      target: "policy:recruitment-ai",
      category: "system",
      detail: summary,
    });
    setNotice("Recruitment and AI policy settings saved.");
  };

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">Administrator Console</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Set Recruitment and AI Policies
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Configure ranking defaults, compliance gate rules, and reporting cadence for talent operations.
        </p>
      </section>

      {notice ? (
        <section className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
          {notice}
        </section>
      ) : null}

      {errorMessage ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorMessage}
        </section>
      ) : null}

      <section className="surface-card p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-700">
            <span className="font-medium">AI ranking mode</span>
            <select
              value={policy.aiRankingMode}
              onChange={(event) =>
                setPolicy((prev) => ({ ...prev, aiRankingMode: event.target.value }))
              }
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="SemanticWeightedRanking">Semantic Weighted Ranking</option>
              <option value="SkillPriorityRanking">Skill Priority Ranking</option>
              <option value="BalancedRanking">Balanced Ranking</option>
            </select>
          </label>

          <label className="space-y-2 text-sm text-slate-700">
            <span className="font-medium">Recruitment audit report cadence</span>
            <select
              value={policy.auditReportCadence}
              onChange={(event) =>
                setPolicy((prev) => ({ ...prev, auditReportCadence: event.target.value }))
              }
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Biweekly">Biweekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </label>

          <label className="space-y-2 text-sm text-slate-700">
            <span className="font-medium">Compliance gate window (days)</span>
            <input
              type="number"
              min={1}
              max={30}
              value={policy.complianceGateDays}
              onChange={(event) =>
                setPolicy((prev) => ({
                  ...prev,
                  complianceGateDays: Math.max(
                    1,
                    Math.min(30, Number.parseInt(event.target.value || "7", 10) || 7)
                  ),
                }))
              }
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="space-y-2 text-sm text-slate-700">
            <span className="font-medium">Requisition alignment policy</span>
            <select
              value={policy.requireRequisitionAlignment ? "required" : "optional"}
              onChange={(event) =>
                setPolicy((prev) => ({
                  ...prev,
                  requireRequisitionAlignment: event.target.value === "required",
                }))
              }
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="required">Required</option>
              <option value="optional">Optional</option>
            </select>
          </label>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Candidate Fit Score Calculation
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Set the evaluation weights used to calculate candidate fit scores. Total must equal 100%.
              </p>
            </div>
            <div
              className={[
                "rounded-2xl border px-4 py-2 text-sm font-semibold",
                fitIsValid
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800",
              ].join(" ")}
            >
              Total: {fitTotal}%
            </div>
          </div>

          {!fitIsValid ? (
            <p className="mt-3 text-sm text-red-700">
              Total must equal 100%. Currently {fitTotal}% (
              {fitDelta > 0 ? `over by ${fitDelta}` : `under by ${Math.abs(fitDelta)}`}).
            </p>
          ) : null}

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {[
              { key: "technicalSkills", label: "Technical Skills", hint: "40%" },
              { key: "relevantExperience", label: "Relevant Experience", hint: "25%" },
              { key: "educationalBackground", label: "Educational Background", hint: "15%" },
              { key: "roleAlignment", label: "Role Alignment", hint: "10%" },
              { key: "softSkills", label: "Soft Skills", hint: "10%" },
            ].map((field) => (
              <label key={field.key} className="space-y-2 text-sm text-slate-700">
                <span className="flex items-center justify-between gap-2 font-medium">
                  <span>{field.label}</span>
                  <span className="text-xs font-semibold text-slate-500">{field.hint}</span>
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={policy.fitScoreWeights[field.key]}
                  onChange={(event) => {
                    const nextValue = clampWeight(
                      Number.parseFloat(event.target.value || "0"),
                      defaultFitScoreWeights[field.key]
                    );
                    setPolicy((prev) => ({
                      ...prev,
                      fitScoreWeights: {
                        ...prev.fitScoreWeights,
                        [field.key]: nextValue,
                      },
                    }));
                  }}
                  className={[
                    "w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2",
                    fitIsValid
                      ? "border-slate-300 focus:border-blue-600 focus:ring-blue-100"
                      : "border-red-300 focus:border-red-500 focus:ring-red-100",
                  ].join(" ")}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          {summary}
        </div>

        <button
          type="button"
          onClick={savePolicy}
          disabled={!fitIsValid}
          className={[
            "mt-5 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition",
            fitIsValid ? "bg-slate-950 hover:bg-slate-800" : "cursor-not-allowed bg-slate-400",
          ].join(" ")}
        >
          Save Policies
        </button>
      </section>
    </div>
  );
}
