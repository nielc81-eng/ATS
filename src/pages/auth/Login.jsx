import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { getPathRole, getRoleHomePath } from "../../lib/routeHelpers";
import { ensureDemoAccounts, getAccountByEmail } from "../../lib/mockAuthStore";
import {
  clearLoginPolicyState,
  formatLockRemaining,
  getLoginPolicyState,
  MAX_LOGIN_ATTEMPTS,
  recordFailedLoginAttempt,
} from "../../lib/authPolicy";

/* ─── animation variants ─────────────────────────────────────────────────── */
const panelVariants = {
  hidden: { opacity: 0, x: -32, scale: 0.98 },
  show: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, x: 32, scale: 0.98, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

/* ─── helpers ────────────────────────────────────────────────────────────── */
const initialForm = { email: "", password: "" };

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

/* ─── styled input ───────────────────────────────────────────────────────── */
function FormInput({ id, label, error, ...props }) {
  return (
    <motion.div variants={fadeUp}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <motion.input
        id={id}
        whileFocus={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
        className={[
          "w-full rounded-2xl border bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none backdrop-blur transition",
          "focus:border-blue-500 focus:ring-3 focus:ring-blue-100",
          error ? "border-red-400 ring-2 ring-red-100" : "border-slate-200",
        ].join(" ")}
        {...props}
      />
      <AnimatePresence>
        {error && (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-1.5 text-xs font-medium text-red-500"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── component ──────────────────────────────────────────────────────────── */
export default function Login() {
  const [values, setValues] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { ensureDemoAccounts(); }, []);

  const fromPath = useMemo(() => {
    const from = location.state?.from;
    const pathname = typeof from?.pathname === "string" ? from.pathname : "";
    const search = typeof from?.search === "string" ? from.search : "";
    if (!pathname) return null;
    return `${pathname}${search}`;
  }, [location.state]);

  const normalizedEmail = useMemo(() => values.email.trim().toLowerCase(), [values.email]);
  const policyState = useMemo(() => getLoginPolicyState(normalizedEmail), [normalizedEmail]);

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
    const authPolicyState = getLoginPolicyState(values.email);

    if (authPolicyState.isLocked) {
      setStatus({
        type: "error",
        message: `Access denied. Maximum attempts reached. Try again in ${formatLockRemaining(authPolicyState.lockRemainingMs)}.`,
      });
      setIsSubmitting(false);
      return;
    }

    const account = getAccountByEmail(values.email);
    if (!account || account.password !== values.password) {
      const failedState = recordFailedLoginAttempt(values.email);
      const attemptsUsed = MAX_LOGIN_ATTEMPTS - failedState.remainingAttempts;
      setStatus({
        type: "error",
        message: failedState.isLocked
          ? `Access denied. Account temporarily locked for ${formatLockRemaining(failedState.lockRemainingMs)}.`
          : `Access denied. Credentials not validated (${attemptsUsed}/${MAX_LOGIN_ATTEMPTS} attempts used).`,
      });
      setIsSubmitting(false);
      return;
    }

    if (account.status === "Archived") {
      setStatus({
        type: "error",
        message: "This account has been archived by an administrator. Please contact support.",
      });
      setIsSubmitting(false);
      return;
    }

    clearLoginPolicyState(values.email);
    login({ token: `mock-${Date.now()}`, role: account.role, name: account.name, email: account.email });

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
    <div className="relative flex min-h-screen items-center overflow-hidden bg-[#f8fbff]">
      {/* ambient blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-blue-400/20 blur-[120px]" />
        <div className="absolute -right-16 bottom-16 h-[350px] w-[350px] rounded-full bg-violet-400/15 blur-[100px]" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid w-full gap-6 lg:grid-cols-2">

          {/* ── LEFT panel ── */}
          <motion.section
            variants={panelVariants}
            initial="hidden"
            animate="show"
            className="surface-card hidden p-8 lg:flex lg:flex-col lg:justify-between"
          >
            <motion.div variants={staggerContainer} initial="hidden" animate="show">
              <motion.p variants={fadeUp} className="section-heading">
                Enterprise Hiring Stack
              </motion.p>
              <motion.h1
                variants={fadeUp}
                className="mt-3 text-3xl font-bold tracking-tight text-slate-950"
              >
                Secure access to your{" "}
                <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                  AI-powered
                </span>{" "}
                screening workspace
              </motion.h1>
              <motion.p variants={fadeUp} className="mt-4 text-sm leading-6 text-slate-600">
                Resume analysis, AI-ranked screening, and role-based dashboards are
                ready behind this login flow.
              </motion.p>

              {/* feature chips */}
              <motion.div variants={fadeUp} className="mt-6 flex flex-wrap gap-2">
                {["AI parsing", "Role dashboards", "Analytics", "201 Files"].map((f) => (
                  <span
                    key={f}
                    className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600"
                  >
                    {f}
                  </span>
                ))}
              </motion.div>
            </motion.div>

            {/* demo credentials */}
            <motion.div
              variants={fadeUp}
              className="mt-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/60 p-5 text-sm text-slate-600"
            >
              <p className="mb-3 font-semibold text-slate-900">Demo credentials</p>
              <div className="space-y-1.5">
                {[
                  ["Candidate", "candidate@demo.com"],
                  ["Talent Acquisition", "recruiter@demo.com"],
                  ["Deployment Manager", "deployment@demo.com"],
                  ["Administrator", "admin@demo.com"],
                ].map(([role, email]) => (
                  <div key={role} className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">{role}</span>
                    <code className="rounded-lg bg-white px-2 py-0.5 text-xs font-medium text-slate-800 shadow-sm">
                      {email}
                    </code>
                  </div>
                ))}
                <p className="mt-3 rounded-lg bg-white/70 px-2 py-1.5 text-center text-xs text-slate-500">
                  Password for all: <strong className="text-slate-800">Demo123!</strong>
                </p>
              </div>
            </motion.div>
          </motion.section>

          {/* ── RIGHT panel ── */}
          <motion.section
            key="login-form"
            variants={panelVariants}
            initial="hidden"
            animate="show"
            className="surface-card relative overflow-hidden p-6 sm:p-8"
          >
            {/* decorative glow */}
            <div
              aria-hidden
              className="absolute right-0 top-0 h-40 w-40 translate-x-20 -translate-y-20 rounded-full bg-blue-500/10 blur-2xl"
            />

            <motion.div variants={staggerContainer} initial="hidden" animate="show" className="relative">
              <motion.div variants={fadeUp}>
                <Link
                  to="/"
                  className="mb-6 inline-flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  <span>Back</span>
                </Link>
              </motion.div>

              <motion.p variants={fadeUp} className="section-heading">Authentication</motion.p>
              <motion.h2 variants={fadeUp} className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                Welcome back
              </motion.h2>
              <motion.p variants={fadeUp} className="mt-1.5 text-sm text-slate-500">
                Sign in to your account to continue.
              </motion.p>

              {normalizedEmail ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 text-xs text-slate-400"
                >
                  Attempts remaining:{" "}
                  <span className="font-semibold text-slate-700">
                    {policyState.isLocked ? 0 : policyState.remainingAttempts}
                  </span>
                </motion.p>
              ) : null}

              <motion.form
                variants={staggerContainer}
                className="mt-7 space-y-4"
                onSubmit={handleSubmit}
                noValidate
              >
                <FormInput
                  id="email"
                  label="Email address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={values.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  error={errors.email}
                />
                <FormInput
                  id="password"
                  label="Password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={values.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  error={errors.password}
                />

                <AnimatePresence mode="wait">
                  {status.message && (
                    <motion.div
                      key="status"
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      className={[
                        "rounded-2xl border px-4 py-3 text-sm",
                        status.type === "error"
                          ? "border-red-200 bg-red-50 text-red-700"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700",
                      ].join(" ")}
                    >
                      {status.message}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div variants={fadeUp}>
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/30 transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <AnimatePresence mode="wait">
                      {isSubmitting ? (
                        <motion.span
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center gap-2"
                        >
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          Signing in…
                        </motion.span>
                      ) : (
                        <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          Sign in →
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </motion.div>
              </motion.form>

              <motion.p variants={fadeUp} className="mt-6 text-center text-sm text-slate-500">
                New to the platform?{" "}
                <Link to="/register" className="font-semibold text-blue-600 transition hover:text-blue-500">
                  Create an account
                </Link>
              </motion.p>
            </motion.div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
