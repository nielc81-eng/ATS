import React, { useEffect, useMemo, useState } from "react";
import { PageFrame } from "../../components/layout/ShellPrimitives";
import { useAuth } from "../../context/AuthContext";
import {
  getInternalMobilityStorageKey,
  getOrCreateCandidateRecordByEmail,
  readInternalMobilityRecords,
  saveCandidateMobilityProfile,
  submitRedeploymentRequest,
} from "../../lib/internalMobilityStore";

function formatDateTime(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function preferredRoleName(session) {
  return String(session?.name || "Candidate").trim() || "Candidate";
}

export default function CandidateInternalMobility() {
  const { session } = useAuth();
  const [records, setRecords] = useState(() => readInternalMobilityRecords());
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const sessionEmail = String(session?.email || "").trim().toLowerCase();

  useEffect(() => {
    const result = getOrCreateCandidateRecordByEmail(
      sessionEmail,
      preferredRoleName(session),
      session?.name || session?.email || "Candidate"
    );
    setRecords(result.records);
  }, [session?.email, session?.name, sessionEmail]);

  useEffect(() => {
    const storageKey = getInternalMobilityStorageKey();
    const syncRecords = () => {
      const result = getOrCreateCandidateRecordByEmail(
        sessionEmail,
        preferredRoleName(session),
        session?.name || session?.email || "Candidate"
      );
      setRecords(result.records);
    };

    const onStorage = (event) => {
      if (event.key === storageKey) syncRecords();
    };
    const onFocus = () => syncRecords();

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, [session?.email, session?.name, sessionEmail]);

  const myRecord = useMemo(() => {
    if (sessionEmail) {
      const matchedByEmail = records.find((record) => String(record.ownerEmail || "").toLowerCase() === sessionEmail);
      if (matchedByEmail) return matchedByEmail;
    }
    const name = preferredRoleName(session).toLowerCase();
    return records.find((record) => String(record.applicantName || "").trim().toLowerCase() === name) || null;
  }, [records, session, sessionEmail]);

  const [skillsInput, setSkillsInput] = useState(() => (myRecord?.skills || []).join(", "));
  const [desiredRole, setDesiredRole] = useState(() => myRecord?.requestMeta?.desiredRole || "");
  const [availabilityDate, setAvailabilityDate] = useState(
    () => myRecord?.requestMeta?.availabilityDate || ""
  );
  const [locationPreference, setLocationPreference] = useState(
    () => myRecord?.requestMeta?.locationPreference || ""
  );
  const [preferredClientType, setPreferredClientType] = useState(
    () => myRecord?.requestMeta?.preferredClientType || ""
  );
  const [compensationBand, setCompensationBand] = useState(
    () => myRecord?.requestMeta?.compensationBand || ""
  );
  const [applicantNote, setApplicantNote] = useState(() => myRecord?.requestMeta?.applicantNote || "");
  const [readinessNote, setReadinessNote] = useState(() => myRecord?.readinessNote || "");

  useEffect(() => {
    setSkillsInput((myRecord?.skills || []).join(", "));
    setDesiredRole(myRecord?.requestMeta?.desiredRole || "");
    setAvailabilityDate(myRecord?.requestMeta?.availabilityDate || "");
    setLocationPreference(myRecord?.requestMeta?.locationPreference || "");
    setPreferredClientType(myRecord?.requestMeta?.preferredClientType || "");
    setCompensationBand(myRecord?.requestMeta?.compensationBand || "");
    setApplicantNote(myRecord?.requestMeta?.applicantNote || "");
    setReadinessNote(myRecord?.readinessNote || "");
  }, [myRecord?.id]);

  const contractStatus =
    myRecord?.currentContractStatus === "Finished" || myRecord?.deploymentStatus === "Finished"
      ? "Finished"
      : myRecord?.currentContractStatus || myRecord?.deploymentStatus || "Deployed";
  const contractFinished = contractStatus === "Finished";
  const alreadyRequested = myRecord?.redeploymentStatus && myRecord.redeploymentStatus !== "NotRequested";

  const ensureRecord = () => {
    const result = getOrCreateCandidateRecordByEmail(
      sessionEmail,
      preferredRoleName(session),
      session?.name || session?.email || "Candidate"
    );
    if (result.record) {
      setRecords(result.records);
      return result;
    }
    if (myRecord) return { record: myRecord, records };
    const createdProfile = saveCandidateMobilityProfile(
      {
        id: result.record?.id,
        ownerEmail: sessionEmail,
        applicantName: preferredRoleName(session),
        skills: splitCsv(skillsInput),
        readinessNote,
        deploymentStatus: "Deployed",
        currentContractStatus: "Deployed",
      },
      session?.name || session?.email || "Candidate"
    );
    setRecords(createdProfile.records);
    return createdProfile;
  };

  const handleSaveProfile = () => {
    const ensured = ensureRecord();
    const result = saveCandidateMobilityProfile(
      {
        id: ensured.record?.id || myRecord?.id,
        ownerEmail: sessionEmail,
        applicantName: preferredRoleName(session),
        skills: splitCsv(skillsInput),
        readinessNote,
        deploymentStatus: ensured.record?.deploymentStatus || myRecord?.deploymentStatus || "Deployed",
        currentContractStatus:
          ensured.record?.currentContractStatus || myRecord?.currentContractStatus || "Deployed",
      },
      session?.name || session?.email || "Candidate"
    );
    setRecords(result.records);
    setError("");
    setNotice("Redeployment profile updated.");
  };

  const handleSubmitRequest = () => {
    const existing = ensureRecord().record;
    if (!existing) return;

    const result = submitRedeploymentRequest(
      existing.id,
      {
        desiredRole,
        availabilityDate,
        locationPreference,
        preferredClientType,
        compensationBand,
        applicantNote,
        skills: splitCsv(skillsInput),
      },
      session?.name || session?.email || "Candidate"
    );

    if (!result.ok) {
      setError(result.message || "Unable to submit redeployment request.");
      setNotice("");
      return;
    }

    setRecords(result.records);
    setError("");
    setNotice("Redeployment request submitted successfully.");
  };

  const latestHistory = myRecord?.history?.at(-1);

  return (
    <PageFrame size="wide">
      <div className="space-y-6">
        <section className="surface-card p-6 sm:p-8">
          <p className="section-heading">Candidate Portal</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Redeployment Request
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            Submit a formal redeployment request after your contract is finished so recruiters can
            match you to another client using your skills, readiness, and internal rating history.
          </p>
        </section>

        {notice ? (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {notice}
          </section>
        ) : null}
        {error ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </section>
        ) : null}

        <section className="surface-card p-6">
          <div className="grid gap-3 md:grid-cols-4">
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Contract Status</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {contractStatus}
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Redeployment Status</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {myRecord?.redeploymentStatus || "NotRequested"}
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Internal Rating</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {myRecord?.internalRating?.overall ? `${myRecord.internalRating.overall}/5` : "Not yet rated"}
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Last Update</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(latestHistory?.updatedAt)}</p>
            </article>
          </div>

          {!contractFinished ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Redeployment request is available once your current contract status becomes Finished.
            </div>
          ) : null}
        </section>

        <section className="surface-card p-6">
          <p className="section-heading">Profile Inputs</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-950">Readiness and request details</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-700">
              Skills (required)
              <input
                value={skillsInput}
                onChange={(event) => setSkillsInput(event.target.value)}
                placeholder="React.js, TypeScript, REST APIs"
                className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="text-sm text-slate-700">
              Desired role (required)
              <input
                value={desiredRole}
                onChange={(event) => setDesiredRole(event.target.value)}
                placeholder="Frontend Engineer"
                className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="text-sm text-slate-700">
              Availability date (required)
              <input
                type="date"
                value={availabilityDate}
                onChange={(event) => setAvailabilityDate(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="text-sm text-slate-700">
              Location preference (required)
              <input
                value={locationPreference}
                onChange={(event) => setLocationPreference(event.target.value)}
                placeholder="Remote / Manila / Hybrid"
                className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="text-sm text-slate-700">
              Preferred client type (optional)
              <input
                value={preferredClientType}
                onChange={(event) => setPreferredClientType(event.target.value)}
                placeholder="Startup, Enterprise, BPO"
                className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="text-sm text-slate-700">
              Compensation band (optional)
              <input
                value={compensationBand}
                onChange={(event) => setCompensationBand(event.target.value)}
                placeholder="60k-80k"
                className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-700">
              Applicant note (required)
              <textarea
                rows={4}
                value={applicantNote}
                onChange={(event) => setApplicantNote(event.target.value)}
                placeholder="Summarize your post-contract highlights and client-readiness."
                className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="text-sm text-slate-700">
              Readiness note (profile)
              <textarea
                rows={4}
                value={readinessNote}
                onChange={(event) => setReadinessNote(event.target.value)}
                placeholder="Additional context for recruiter review."
                className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleSaveProfile}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:border-slate-400"
            >
              Save Profile
            </button>
            <button
              type="button"
              onClick={handleSubmitRequest}
              disabled={!contractFinished || alreadyRequested}
              className="rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Submit Redeployment Request
            </button>
          </div>
        </section>

        {myRecord?.requestMeta?.requestedAt ? (
          <section className="surface-card p-6">
            <p className="section-heading">Request Confirmation</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">Your request is in queue</h2>
            <p className="mt-2 text-sm text-slate-600">
              Submitted on {formatDateTime(myRecord.requestMeta.requestedAt)}.
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Current queue status:{" "}
              <span className="font-semibold text-slate-900">{myRecord.redeploymentStatus}</span>
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Next step: recruiter reviews your request and runs AI match scoring.
            </p>
          </section>
        ) : null}
      </div>
    </PageFrame>
  );
}
