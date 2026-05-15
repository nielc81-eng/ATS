import React, { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useAdminData } from "../../context/AdminDataContext";

const STORAGE_KEY = "admin_recruitment_policy_v1";

const defaultPolicy = {
  aiRankingMode: "SemanticWeightedRanking",
  requireRequisitionAlignment: true,
  complianceGateDays: 7,
  auditReportCadence: "Weekly",
};

function readPolicy() {
  if (typeof window === "undefined") return defaultPolicy;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPolicy;
    const parsed = JSON.parse(raw);
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

  const summary = useMemo(
    () =>
      [
        `AI ranking mode: ${policy.aiRankingMode}`,
        `Requisition alignment required: ${policy.requireRequisitionAlignment ? "Yes" : "No"}`,
        `Compliance gate window: ${policy.complianceGateDays} days`,
        `Audit report cadence: ${policy.auditReportCadence}`,
      ].join(" | "),
    [policy]
  );

  const savePolicy = () => {
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

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          {summary}
        </div>

        <button
          type="button"
          onClick={savePolicy}
          className="mt-5 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Save Policies
        </button>
      </section>
    </div>
  );
}

