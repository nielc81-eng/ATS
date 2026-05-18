import React, { useEffect, useMemo, useState } from "react";
import {
  readInternalMobilityRecords,
  saveDeploymentManagerRating,
} from "../../lib/internalMobilityStore";

function toNumber(value, fallback = 3) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(5, Math.max(1, parsed));
}

export default function DeploymentManagerInternalMobility() {
  const [records, setRecords] = useState(() => readInternalMobilityRecords());
  const [notice, setNotice] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [deploymentStatus, setDeploymentStatus] = useState("Finished");
  const [overall, setOverall] = useState(3);
  const [performance, setPerformance] = useState(3);
  const [teamwork, setTeamwork] = useState(3);
  const [communication, setCommunication] = useState(3);
  const [reliability, setReliability] = useState(3);
  const [notesInput, setNotesInput] = useState("");

  const candidates = useMemo(
    () =>
      records
        .filter((record) => ["Deployed", "Finished"].includes(record.deploymentStatus))
        .sort((left, right) => left.applicantName.localeCompare(right.applicantName)),
    [records]
  );

  const selectedRecord = useMemo(
    () => candidates.find((candidate) => candidate.id === selectedId) || candidates[0] || null,
    [candidates, selectedId]
  );

  useEffect(() => {
    if (!selectedRecord) return;
    setSelectedId(selectedRecord.id);
    setDeploymentStatus(selectedRecord.deploymentStatus || "Finished");
    setOverall(toNumber(selectedRecord.internalRating?.overall, 3));
    setPerformance(toNumber(selectedRecord.internalRating?.dimensions?.performance, 3));
    setTeamwork(toNumber(selectedRecord.internalRating?.dimensions?.teamwork, 3));
    setCommunication(toNumber(selectedRecord.internalRating?.dimensions?.communication, 3));
    setReliability(toNumber(selectedRecord.internalRating?.dimensions?.reliability, 3));
    setNotesInput((selectedRecord.internalRating?.notes || []).join("\n"));
  }, [selectedRecord?.id]);

  const handleSave = () => {
    if (!selectedRecord) {
      setNotice("Select a deployment record first.");
      return;
    }

    const result = saveDeploymentManagerRating(
      {
        id: selectedRecord.id,
        deploymentStatus,
        overall: toNumber(overall, 3),
        dimensions: {
          performance: toNumber(performance, 3),
          teamwork: toNumber(teamwork, 3),
          communication: toNumber(communication, 3),
          reliability: toNumber(reliability, 3),
        },
        notes: notesInput
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
      },
      "Deployment Manager"
    );

    if (!result.ok) {
      setNotice(result.message || "Unable to submit internal rating.");
      return;
    }

    setRecords(result.records);
    setNotice(`Saved internal rating for ${result.record.applicantName}.`);
  };

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">Deployment Manager</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Internal Mobility Validation
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Validate post-deployment outcomes and submit standardized internal ratings for redeployment
          weighting.
        </p>
      </section>

      {notice ? (
        <section className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
          {notice}
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="surface-card p-6">
          <p className="section-heading">Eligible Records</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-950">Deployed and finished</h2>
          <div className="mt-4 grid gap-2">
            {candidates.map((candidate) => (
              <button
                key={candidate.id}
                type="button"
                onClick={() => setSelectedId(candidate.id)}
                className={[
                  "rounded-2xl border px-4 py-3 text-left transition",
                  selectedRecord?.id === candidate.id
                    ? "border-slate-900 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
                ].join(" ")}
              >
                <p className="text-sm font-semibold">{candidate.applicantName}</p>
                <p className="mt-1 text-xs opacity-80">Status: {candidate.deploymentStatus}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="surface-card p-6">
          <p className="section-heading">Rating Submission</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-950">
            {selectedRecord ? selectedRecord.applicantName : "No record selected"}
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-slate-700">
              Deployment status
              <select
                value={deploymentStatus}
                onChange={(event) => setDeploymentStatus(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                <option value="Deployed">Deployed</option>
                <option value="Finished">Finished</option>
              </select>
            </label>
            <label className="text-sm text-slate-700">
              Overall (1-5)
              <input
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={overall}
                onChange={(event) => setOverall(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="text-sm text-slate-700">
              Performance
              <input
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={performance}
                onChange={(event) => setPerformance(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="text-sm text-slate-700">
              Teamwork
              <input
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={teamwork}
                onChange={(event) => setTeamwork(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="text-sm text-slate-700">
              Communication
              <input
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={communication}
                onChange={(event) => setCommunication(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="text-sm text-slate-700">
              Reliability
              <input
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={reliability}
                onChange={(event) => setReliability(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          <label className="mt-3 block text-sm text-slate-700">
            Internal notes (one note per line)
            <textarea
              rows={4}
              value={notesInput}
              onChange={(event) => setNotesInput(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              placeholder="Delivered on schedule..."
            />
          </label>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Save Internal Rating
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

