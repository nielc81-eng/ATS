import React, { useMemo, useState } from "react";
import { useAdminData } from "../../context/AdminDataContext";
import { rolePermissions } from "../../lib/adminMockData";
import { getRoleDisplayLabel } from "../../lib/roles";

export default function AdminWorkPrivileges() {
  const { users, updateUserRole } = useAdminData();
  const [notice, setNotice] = useState({ type: "", message: "" });

  const activeUsers = useMemo(
    () => users.filter((user) => user.status !== "Archived"),
    [users]
  );

  const handleRoleChange = (user, nextRole) => {
    const result = updateUserRole(user.email, nextRole);
    if (!result.ok) {
      setNotice({ type: "error", message: result.message });
      return;
    }

    setNotice({
      type: "success",
      message: `${user.name} privileges updated to ${getRoleDisplayLabel(nextRole)}.`,
    });
  };

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">Administrator Console</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Assign Work Privileges
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Manage role-based work privileges for staff accounts and keep access aligned to responsibilities.
        </p>
      </section>

      {notice.message ? (
        <section
          className={[
            "rounded-2xl border px-4 py-3 text-sm",
            notice.type === "error"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-cyan-200 bg-cyan-50 text-cyan-900",
          ].join(" ")}
        >
          {notice.message}
        </section>
      ) : null}

      <section className="surface-card overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-950">Role Assignments</h2>
          <p className="mt-1 text-sm text-slate-600">
            Update account roles to control route access and workload ownership.
          </p>
        </div>
        <div className="space-y-3 p-6">
          {activeUsers.map((user) => (
            <article key={user.email} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{user.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{user.email}</p>
                </div>
                <select
                  value={user.role}
                  onChange={(event) => handleRoleChange(user, event.target.value)}
                  disabled={user.locked}
                  className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="Candidate">Candidate</option>
                  <option value="Recruiter">Talent Acquisition</option>
                  <option value="DeploymentManager">Deployment Manager</option>
                  <option value="Administrator">Administrator</option>
                </select>
              </div>

              <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Current Privileges
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(rolePermissions[user.role] || []).map((permission) => (
                    <span
                      key={`${user.email}-${permission}`}
                      className="rounded-full bg-white px-3 py-1 text-xs text-slate-700"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

