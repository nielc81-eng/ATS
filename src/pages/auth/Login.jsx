import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getPathRole, getRoleHomePath } from "../../lib/routeHelpers";
import { ensureDemoAccounts, getAccountByEmail } from "../../lib/mockAuthStore";

const initialForm = {
  email: "",
  password: "",
};

function validate(values) {
  const nextErrors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!values.email.trim()) {
    nextErrors.email = "Email is required.";
  } else if (!emailRegex.test(values.email.trim())) {
    nextErrors.email = "Please enter a valid email address.";
  }

  if (!values.password) {
    nextErrors.password = "Password is required.";
  } else if (values.password.length < 8) {
    nextErrors.password = "Password must be at least 8 characters.";
  }

  return nextErrors;
}

export default function Login() {
  const [values, setValues] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    ensureDemoAccounts();
  }, []);

  const fromPath = useMemo(() => {
    const from = location.state?.from;
    const pathname = typeof from?.pathname === "string" ? from.pathname : "";
    const search = typeof from?.search === "string" ? from.search : "";
    if (!pathname) return null;
    return `${pathname}${search}`;
  }, [location.state]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setStatus({ type: "", message: "" });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    const account = getAccountByEmail(values.email);

    if (!account || account.password !== values.password) {
      setStatus({
        type: "error",
        message: "Invalid credentials. Please check your email and password.",
      });
      setIsSubmitting(false);
      return;
    }

    login({
      token: `mock-${Date.now()}`,
      role: account.role,
      name: account.name,
      email: account.email,
    });

    const rolePath = getRoleHomePath(account.role);
    const nextPath =
      account.role === "Candidate" && fromPath?.startsWith("/jobs")
        ? fromPath
        : fromPath && getPathRole(fromPath) === account.role
          ? fromPath
          : rolePath;

    navigate(nextPath, { replace: true });
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 sm:px-6">
      <div className="grid w-full gap-6 lg:grid-cols-2">
        <section className="surface-card hidden p-8 lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="section-heading">Enterprise Hiring Stack</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Secure access to your AI-powered screening workspace
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Resume analysis, blind screening, and role-based dashboards are
              ready behind this login flow.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Demo credentials</p>
            <p className="mt-2">Candidate: candidate@demo.com / Demo123!</p>
            <p>Recruiter: recruiter@demo.com / Demo123!</p>
            <p>Administrator: admin@demo.com / Demo123!</p>
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
            Login
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Sign in using your account credentials.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email
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
                autoComplete="current-password"
                value={values.password}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                placeholder="Enter your password"
              />
              {errors.password ? (
                <p className="mt-1 text-xs text-red-600">{errors.password}</p>
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
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-5 text-sm text-slate-600">
            New to the platform?{" "}
            <Link
              to="/register"
              className="font-semibold text-blue-700 hover:text-blue-600"
            >
              Create an account
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
