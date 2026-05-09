import React, { useMemo, useState } from "react";
import { useAdminData } from "../../context/AdminDataContext";
import { rolePermissions } from "../../lib/adminMockData";

function formatNumber(value) {
  return new Intl.NumberFormat().format(value);
}

export default function AdminUsers() {
  const { users, updateUserRole } = useAdminData();
  const [notice, setNotice] = useState("");

  const stats = useMemo(
    () => ({
      total: users.length,
      admins: users.filter((user) => user.role === "Administrator").length,
      recruiters: users.filter((user) => user.role === "Recruiter").length,
      candidates: users.filter((user) => user.role === "Candidate").length,
    }),
    [users]
  );

  const handleRoleChange = (user, nextRole) => {
    const result = updateUserRole(user.email, nextRole);
    if (!result.ok) {
      setNotice(result.message);
      return;
    }

    setNotice(`${user.name} was updated to ${nextRole}.`);
  };

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">User governance</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Users and roles
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Manage the local mock accounts that power login, routing, and the admin
          oversight flow.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Total users</p>
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
      </section>

      {notice ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {notice}
        </div>
      ) : null}

      <section className="surface-card overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-950">Account table</h2>
          <p className="mt-1 text-sm text-slate-600">
            The seeded administrator account is locked to preserve platform access.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">User</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Permissions</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Scope</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {users.map((user) => (
                <tr key={user.email}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-slate-950">{user.name}</div>
                    <div className="mt-1 text-sm text-slate-500">{user.email}</div>
                    {user.locked ? (
                      <div className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Locked seed admin
                      </div>
                    ) : null}
                  </td>
                  <td className="px-6 py-4 align-top">
                    <select
                      value={user.role}
                      onChange={(event) => handleRoleChange(user, event.target.value)}
                      disabled={user.locked}
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
                  <td className="px-6 py-4 align-top text-sm text-slate-600">{user.scope}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

