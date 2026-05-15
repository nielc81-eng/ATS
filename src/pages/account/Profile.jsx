import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { PageFrame } from "../../components/layout/ShellPrimitives";
import { useAuth } from "../../context/AuthContext";
import { updateAccountProfile } from "../../lib/mockAuthStore";
import { getRoleHomePath } from "../../lib/routeHelpers";
import { getRoleDisplayLabel } from "../../lib/roles";
import CandidateEditProfile from "../candidate/EditProfile";

function validateProfileForm({ name, password, confirmPassword }) {
  const trimmedName = String(name || "").trim();

  if (!trimmedName) {
    return { ok: false, message: "Name is required." };
  }

  if (password) {
    if (String(password).length < 8) {
      return { ok: false, message: "Password must be at least 8 characters." };
    }

    if (password !== confirmPassword) {
      return { ok: false, message: "Passwords do not match." };
    }
  }

  return { ok: true, name: trimmedName };
}

export default function AccountProfile() {
  const { session, isAuthenticated } = useAuth();

  const roleLabel = useMemo(
    () => getRoleDisplayLabel(session?.role),
    [session?.role]
  );
  const backTo = useMemo(() => getRoleHomePath(session?.role), [session?.role]);

  const [name, setName] = useState(session?.name || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setName(session?.name || "");
  }, [session?.name]);

  if (!isAuthenticated || !session) {
    return <Navigate to="/login" replace />;
  }

  // Candidate keeps the full existing profile editor, accessed through "My Profile".
  if (session.role === "Candidate") {
    return <CandidateEditProfile />;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    const validation = validateProfileForm({ name, password, confirmPassword });
    if (!validation.ok) {
      setStatus({ type: "error", message: validation.message });
      return;
    }

    setIsSubmitting(true);
    const result = updateAccountProfile(session.email, {
      name: validation.name,
      password: password ? String(password) : "",
    });

    if (!result.ok) {
      setStatus({ type: "error", message: result.message || "Unable to update profile." });
      setIsSubmitting(false);
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setStatus({ type: "success", message: "Profile updated." });
    setIsSubmitting(false);
  };

  return (
    <PageFrame size="narrow">
      <div className="space-y-6">
        <section className="surface-card p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="section-heading">Account</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                My Profile
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                Update your display name and password. Your role and email are managed by administrators.
              </p>
            </div>

            <Link
              to={backTo}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Back to Dashboard
            </Link>
          </div>
        </section>

        <section className="surface-card p-6 sm:p-8">
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="profile-name" className="mb-2 block text-sm font-medium text-slate-700">
                  Display name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="profile-role" className="mb-2 block text-sm font-medium text-slate-700">
                  Role
                </label>
                <input
                  id="profile-role"
                  type="text"
                  value={roleLabel}
                  disabled
                  className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                />
              </div>
            </div>

            <div>
              <label htmlFor="profile-email" className="mb-2 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="profile-email"
                type="email"
                value={session.email || ""}
                disabled
                className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="profile-password" className="mb-2 block text-sm font-medium text-slate-700">
                  New password
                </label>
                <input
                  id="profile-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  placeholder="Leave blank to keep current"
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-confirm-password"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Confirm password
                </label>
                <input
                  id="profile-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {status.message ? (
              <div
                className={[
                  "rounded-2xl border px-4 py-3 text-sm",
                  status.type === "error"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700",
                ].join(" ")}
              >
                {status.message}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Password changes apply the next time you sign in.
              </p>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </PageFrame>
  );
}

