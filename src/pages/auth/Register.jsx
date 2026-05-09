import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getRoleHomePath } from "../../lib/routeHelpers";
import { createAccount, ensureDemoAccounts } from "../../lib/mockAuthStore";

const roleTabs = [
  { label: "Candidate", value: "Candidate" },
  { label: "Employer / Recruiter", value: "Recruiter" },
];

const initialForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  organization: "",
};

function validate(values, role) {
  const errors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!values.name.trim()) {
    errors.name = "Full name is required.";
  } else if (values.name.trim().length < 2) {
    errors.name = "Full name must be at least 2 characters.";
  }

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!emailRegex.test(values.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  } else if (values.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (role === "Recruiter" && !values.organization.trim()) {
    errors.organization = "Company name is required for recruiters.";
  }

  return errors;
}

export default function Register() {
  const [role, setRole] = useState("Candidate");
  const [values, setValues] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    ensureDemoAccounts();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setStatus({ type: "", message: "" });
  };

  const handleRoleChange = (nextRole) => {
    setRole(nextRole);
    setErrors((prev) => ({ ...prev, organization: "" }));
    setStatus({ type: "", message: "" });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validate(values, role);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    const creation = createAccount({
      name: values.name,
      email: values.email,
      password: values.password,
      role,
    });

    if (!creation.ok) {
      setStatus({ type: "error", message: creation.message });
      setIsSubmitting(false);
      return;
    }

    login({
      token: `mock-${Date.now()}`,
      role,
      name: values.name.trim(),
    });

    navigate(getRoleHomePath(role), { replace: true });
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 sm:px-6">
      <div className="grid w-full gap-6 lg:grid-cols-2">
        <section className="surface-card hidden p-8 lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="section-heading">Onboarding</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Create your account and enter the screening workspace
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Candidate and recruiter journeys are separated from day one, so
              each user lands on a focused dashboard after sign-up.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Your role controls route access, menu links, and destination pages.
            Administrator access is provisioned separately and is not available
            through public registration.
          </div>
        </section>

        <section className="surface-card relative p-6 sm:p-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back
          </button>

          <p className="section-heading">Authentication</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Register
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Choose your role and create your account.
          </p>

          <div className="mt-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
            {roleTabs.map((tab) => {
              const active = role === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => handleRoleChange(tab.value)}
                  className={[
                    "rounded-xl px-3 py-2 text-xs font-semibold transition sm:text-sm",
                    active
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900",
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={values.name}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                placeholder="Enter your full name"
              />
              {errors.name ? (
                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
              ) : null}
            </div>

            {role === "Recruiter" ? (
              <div>
                <label
                  htmlFor="organization"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Company
                </label>
                <input
                  id="organization"
                  name="organization"
                  type="text"
                  autoComplete="organization"
                  value={values.organization}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter company name"
                />
                {errors.organization ? (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.organization}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Work email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                placeholder="name@company.com"
              />
              {errors.email ? (
                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={values.password}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                placeholder="At least 8 characters"
              />
              {errors.password ? (
                <p className="mt-1 text-xs text-red-600">{errors.password}</p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={values.confirmPassword}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                placeholder="Re-enter your password"
              />
              {errors.confirmPassword ? (
                <p className="mt-1 text-xs text-red-600">
                  {errors.confirmPassword}
                </p>
              ) : null}
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-5 text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-blue-700 hover:text-blue-600"
            >
              Back to login
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
