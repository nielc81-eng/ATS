import React, { useEffect, useMemo, useState } from "react";
import DigitalFileCard from "../../components/digitalFiles/DigitalFileCard";
import DigitalFileDetailPanel from "../../components/digitalFiles/DigitalFileDetailPanel";
import {
  digitalFileStatuses,
  getDigitalFileStatusTone,
} from "../../lib/digitalFilesMockData";
import { useDigitalFiles } from "../../context/DigitalFilesContext";

const statusFilters = ["All", ...digitalFileStatuses];

function matchesSearch(file, searchValue) {
  if (!searchValue) return true;
  const query = searchValue.toLowerCase();

  return [
    file.employeeName,
    file.employeeId,
    file.department,
    file.fileName,
    file.status,
    ...file.tags,
  ].some((value) => String(value).toLowerCase().includes(query));
}

export default function RecruiterDigitalFiles() {
  const { files, addFile, updateFileStatus } = useDigitalFiles();
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState("All");
  const [selectedFileId, setSelectedFileId] = useState(files[0]?.id ?? null);
  const [notice, setNotice] = useState("");

  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      const statusMatch = activeStatus === "All" ? true : file.status === activeStatus;
      return statusMatch && matchesSearch(file, search);
    });
  }, [activeStatus, files, search]);

  const selectedFile = useMemo(
    () =>
      filteredFiles.length > 0
        ? filteredFiles.find((file) => file.id === selectedFileId) ??
          filteredFiles[0] ??
          null
        : null,
    [filteredFiles, selectedFileId]
  );

  useEffect(() => {
    if (filteredFiles.length > 0 && !filteredFiles.some((file) => file.id === selectedFileId)) {
      setSelectedFileId(filteredFiles[0].id);
    }
  }, [filteredFiles, selectedFileId]);

  useEffect(() => {
    if (selectedFileId && !files.some((file) => file.id === selectedFileId)) {
      setSelectedFileId(files[0]?.id ?? null);
    }
  }, [files, selectedFileId]);

  const stats = useMemo(
    () => ({
      total: files.length,
      pending: files.filter((file) => file.status === "Pending Review").length,
      approved: files.filter((file) => file.status === "Approved").length,
      actionNeeded: files.filter((file) => file.status === "Needs Action").length,
    }),
    [files]
  );

  const handleAttachMockFile = () => {
    const nextFile = addFile({
      employeeName: "New Hire",
      employeeId: `EMP-${Date.now().toString().slice(-4)}`,
      department: "HR Operations",
      notes: "Mock 201 file attached from the vault action.",
    });

    setSelectedFileId(nextFile.id);
    setActiveStatus("All");
    setSearch("");
    setNotice(`Mock file ${nextFile.id} attached.`);
  };

  const updateAndNotify = (status, summary) => {
    if (!selectedFile) return;
    updateFileStatus(selectedFile.id, status, summary);
    setNotice(`File ${selectedFile.id} marked as ${status.toLowerCase()}.`);
  };

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">Recruiter Portal</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Digital 201 Files
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Manage employee 201 records, compliance documents, and file review
          statuses in one controlled vault.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
            Total Files
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{stats.total}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
            Pending Review
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {stats.pending}
          </p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
            Approved
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {stats.approved}
          </p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
            Needs Action
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {stats.actionNeeded}
          </p>
        </article>
      </section>

      <section className="surface-card p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-[16rem] flex-1">
            <label
              htmlFor="file-search"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Search files
            </label>
            <input
              id="file-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by employee, ID, department, or tag"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="button"
            onClick={handleAttachMockFile}
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Attach Mock File
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {statusFilters.map((status) => {
            const active = status === activeStatus;
            const tone = status === "All" ? null : getDigitalFileStatusTone(status);

            return (
              <button
                key={status}
                type="button"
                onClick={() => setActiveStatus(status)}
                className={[
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  active
                    ? "bg-slate-950 text-white"
                    : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400",
                  tone && !active ? tone.text : "",
                ].join(" ")}
              >
                {status}
              </button>
            );
          })}
        </div>

        {notice ? (
          <div
            role="status"
            aria-live="polite"
            className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800"
          >
            {notice}
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          {filteredFiles.length > 0 ? (
            filteredFiles.map((file) => (
              <DigitalFileCard
                key={file.id}
                file={file}
                selected={selectedFile?.id === file.id}
                onClick={() => setSelectedFileId(file.id)}
              />
            ))
          ) : (
            <div className="surface-card px-6 py-10 text-sm text-slate-600">
              No files match the current search or status filter.
            </div>
          )}
        </div>

        <DigitalFileDetailPanel
          file={selectedFile}
          onApprove={() =>
            updateAndNotify("Approved", "File approved for retention.")
          }
          onNeedsAction={() =>
            updateAndNotify(
              "Needs Action",
              "Additional compliance documents are required."
            )
          }
          onArchive={() => updateAndNotify("Archived", "File archived after review.")}
          onAttachMockFile={handleAttachMockFile}
        />
      </section>
    </div>
  );
}
