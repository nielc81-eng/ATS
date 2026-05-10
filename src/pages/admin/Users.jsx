import React, { useMemo, useState } from "react";
import { useAdminData } from "../../context/AdminDataContext";
import { rolePermissions } from "../../lib/adminMockData";

function formatNumber(value) {
  return new Intl.NumberFormat().format(value);
}

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

function getStatusBadge(status) {
  if (status === "Archived") {
    return "border border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border border-emerald-200 bg-emerald-50 text-emerald-800";
}

export default function AdminUsers() {
  const { users, updateUserRole, archiveUser, restoreUser } = useAdminData();
  const [notice, setNotice] = useState({ type: "", message: "" });
  const [statusFilter, setStatusFilter] = useState("Active");
  const [archiveDialog, setArchiveDialog] = useState({
    open: false,
    user: null,
    reason: "",
    submitting: false,
  });

  const stats = useMemo(() => {
    const activeUsers = users.filter((user) => user.status !== "Archived");
    return {
      total: activeUsers.length,
      admins: activeUsers.filter((user) => user.role === "Administrator").length,
      recruiters: activeUsers.filter((user) => user.role === "Recruiter").length,
      candidates: activeUsers.filter((user) => user.role === "Candidate").length,
      archived: users.filter((user) => user.status === "Archived").length,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (statusFilter === "Archived") {
      return users.filter((user) => user.status === "Archived");
    }

    if (statusFilter === "All") {
      return users;
    }

    return users.filter((user) => user.status !== "Archived");
  }, [users, statusFilter]);

  const handleRoleChange = (user, nextRole) => {
    const result = updateUserRole(user.email, nextRole);
    if (!result.ok) {
      setNotice({ type: "error", message: result.message });
      return;
    }

    setNotice({ type: "success", message: `${user.name} was updated to ${nextRole}.` });
  };

  const handleArchiveUser = (user) => {
    setArchiveDialog({
      open: true,
      user,
      reason: "",
      submitting: false,
    });
  };

  const closeArchiveDialog = () => {
    if (archiveDialog.submitting) return;
    setArchiveDialog({
      open: false,
      user: null,
      reason: "",
      submitting: false,
    });
  };

  const confirmArchiveUser = () => {
    if (!archiveDialog.user) return;

    setArchiveDialog((prev) => ({ ...prev, submitting: true }));

    const result = archiveUser(user.email, {
      actor: "Administrator",
      archiveReason: archiveDialog.reason || "",
    });

    if (!result.ok) {
      setNotice({ type: "error", message: result.message });
      setArchiveDialog((prev) => ({ ...prev, submitting: false }));
      return;
    }

    setNotice({
      type: "success",
      message: `${archiveDialog.user.name} was archived and removed from active access.`,
    });

    setArchiveDialog({
      open: false,
      user: null,
      reason: "",
      submitting: false,
    });
  };

  const handleRestoreUser = (user) => {
    const result = restoreUser(user.email, "Administrator");
    if (!result.ok) {
      setNotice({ type: "error", message: result.message });
      return;
    }

    setNotice({
      type: "success",
      message: `${user.name} was restored and can log in again.`,
    });
  };

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">User governance</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Users and roles
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Archive and restore user access without deleting account records.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Active users</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{formatNumber(stats.total)}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Administrators</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{formatNumber(stats.admins)}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Recruiters</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{formatNumber(stats.recruiters)}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Candidates</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{formatNumber(stats.candidates)}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Archived</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{formatNumber(stats.archived)}</p>
        </article>
      </section>

      <section className="surface-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-slate-700">Filter users</p>
          <div className="grid grid-cols-3 rounded-2xl bg-slate-100 p-1">
            {["Active", "Archived", "All"].map((value) => {
              const active = statusFilter === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  className={[
                    "rounded-xl px-3 py-2 text-xs font-semibold transition sm:text-sm",
                    active
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900",
                  ].join(" ")}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {notice.message ? (
        <div
          className={[
            "rounded-2xl border px-4 py-3 text-sm",
            notice.type === "error"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-blue-200 bg-blue-50 text-blue-800",
          ].join(" ")}
        >
          {notice.message}
        </div>
      ) : null}

      <section className="surface-card overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-950">Account table</h2>
          <p className="mt-1 text-sm text-slate-600">
            Seeded admin is locked and cannot be archived.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">User</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Permissions</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredUsers.map((user) => (
                <tr key={user.email}>
                  <td className="px-6 py-4 align-top">
                    <div className="text-sm font-semibold text-slate-950">{user.name}</div>
                    <div className="mt-1 text-sm text-slate-500">{user.email}</div>
                    {user.locked ? (
                      <div className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Locked seed admin
                      </div>
                    ) : null}
                    {user.status === "Archived" ? (
                      <div className="mt-2 text-xs text-slate-500">
                        Archived {formatDateTime(user.archivedAt)} by {user.archivedBy || "Administrator"}
                        {user.archiveReason ? ` (${user.archiveReason})` : ""}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-6 py-4 align-top">
                    <span className={["inline-flex rounded-full px-3 py-1 text-xs font-semibold", getStatusBadge(user.status)].join(" ")}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <select
                      value={user.role}
                      onChange={(event) => handleRoleChange(user, event.target.value)}
                      disabled={user.locked || user.status === "Archived"}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    >
                      <option value="Candidate">Candidate</option>
                      <option value="Recruiter">Recruiter</option>
                      <option value="Administrator">Administrator</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <ul className="space-y-1 text-sm text-slate-600">
                      {(rolePermissions[user.role] || []).map((permission) => (
                        <li key={permission}>- {permission}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="flex flex-wrap gap-2">
                      {user.status === "Archived" ? (
                        <button
                          type="button"
                          onClick={() => handleRestoreUser(user)}
                          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 transition hover:border-emerald-300"
                        >
                          Restore user
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleArchiveUser(user)}
                          disabled={user.locked}
                          className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 transition hover:border-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Archive user
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                    No users match the selected filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {archiveDialog.open ? (
        <>
          <div className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px]" />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="archive-user-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-7">
              <p className="section-heading">Confirm Action</p>
              <h3
                id="archive-user-title"
                className="mt-2 text-xl font-semibold tracking-tight text-slate-950"
              >
                Archive {archiveDialog.user?.name}?
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                This user will be blocked from login until restored. Their records
                remain intact.
              </p>

              <div className="mt-5">
                <label
                  htmlFor="archiveReason"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Archive reason (optional)
                </label>
                <textarea
                  id="archiveReason"
                  rows={3}
                  value={archiveDialog.reason}
                  onChange={(event) =>
                    setArchiveDialog((prev) => ({
                      ...prev,
                      reason: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter an optional note for the audit log..."
                />
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={closeArchiveDialog}
                  disabled={archiveDialog.submitting}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmArchiveUser}
                  disabled={archiveDialog.submitting}
                  className="rounded-2xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {archiveDialog.submitting ? "Archiving..." : "Archive user"}
                </button>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
