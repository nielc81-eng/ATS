import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { UserRound, Building2, ShieldOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getRoleHomePath } from "../../lib/routeHelpers";
import { createAccount, ensureDemoAccounts } from "../../lib/mockAuthStore";

/* ─── animation variants ─────────────────────────────────────────────────── */
const panelVariants = {
  hidden: { opacity: 0, x: 32, scale: 0.98 },
  show: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const slideTab = {
  hidden: { opacity: 0, x: 10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, x: -10, transition: { duration: 0.25 } },
};

/* ─── data ───────────────────────────────────────────────────────────────── */
const roleTabs = [
  { label: "Candidate", value: "Candidate", Icon: UserRound },
  { label: "Talent Acquisition", value: "Recruiter", Icon: Building2 },
];

const initialForm = { name: "", email: "", password: "", confirmPassword: "", organization: "" };

/* ─── validation ─────────────────────────────────────────────────────────── */
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
    errors.organization = "Company name is required for talent acquisition users.";
  }
  return errors;
}

/* ─── password strength ──────────────────────────────────────────────────── */
function getStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}
const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-blue-400", "bg-emerald-500"];

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
            key="err"
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
export default function Register() {
  const [role, setRole] = useState("Candidate");
  const [values, setValues] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { ensureDemoAccounts(); }, []);

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
    const creation = createAccount({ name: values.name, email: values.email, password: values.password, role });

    if (!creation.ok) {
      setStatus({ type: "error", message: creation.message });
      setIsSubmitting(false);
      return;
    }

    login({ token: `mock-${Date.now()}`, role, name: values.name.trim(), email: values.email.trim().toLowerCase() });
    navigate(getRoleHomePath(role), { replace: true });
  };

  const pwStrength = getStrength(values.password);

  return (
    <div className="relative flex min-h-screen items-center overflow-hidden bg-[#f8fbff]">
      {/* ambient blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-violet-400/20 blur-[120px]" />
        <div className="absolute -left-16 bottom-16 h-[350px] w-[350px] rounded-full bg-blue-400/15 blur-[100px]" />
        <div className="absolute bottom-0 right-1/3 h-[200px] w-[400px] rounded-full bg-emerald-400/10 blur-[80px]" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid w-full gap-6 lg:grid-cols-2">

          {/* ── LEFT info panel ── */}
          <motion.section
            variants={panelVariants}
            initial="hidden"
            animate="show"
            className="surface-card hidden p-8 lg:flex lg:flex-col lg:justify-between"
          >
            <motion.div variants={staggerContainer} initial="hidden" animate="show">
              <motion.p variants={fadeUp} className="section-heading">Onboarding</motion.p>
              <motion.h1
                variants={fadeUp}
                className="mt-3 text-3xl font-bold tracking-tight text-slate-950"
              >
                Create your account and enter the{" "}
                <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                  screening workspace
                </span>
              </motion.h1>
              <motion.p variants={fadeUp} className="mt-4 text-sm leading-6 text-slate-600">
                Candidate and talent acquisition journeys are separated from day one, so
                each user lands on a focused dashboard after sign-up.
              </motion.p>


            </motion.div>

            <motion.div
              variants={fadeUp}
              className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
            >
              <div className="flex items-center gap-2 mb-1">
                <ShieldOff size={13} strokeWidth={2} style={{ color: "#b45309" }} />
                <p className="font-semibold">Administrator access</p>
              </div>
              <p className="text-amber-700">
                Admin access is provisioned separately and is not available through
                public registration.
              </p>
            </motion.div>
          </motion.section>

          {/* ── RIGHT form panel ── */}
          <motion.section
            key="register-form"
            variants={panelVariants}
            initial="hidden"
            animate="show"
            className="surface-card relative overflow-hidden p-6 sm:p-8"
          >
            {/* decorative glow */}
            <div
              aria-hidden
              className="absolute left-0 top-0 h-40 w-40 -translate-x-20 -translate-y-20 rounded-full bg-violet-500/10 blur-2xl"
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
                Create your account
              </motion.h2>
              <motion.p variants={fadeUp} className="mt-1.5 text-sm text-slate-500">
                Choose your role and get started in seconds.
              </motion.p>

              {/* ── ROLE TABS ── */}
              <motion.div variants={fadeUp} className="mt-6">
                <div className="relative grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
                  {roleTabs.map((tab) => {
                    const active = role === tab.value;
                    return (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => handleRoleChange(tab.value)}
                        className="relative rounded-xl px-3 py-2.5 text-xs font-semibold transition sm:text-sm"
                      >
                        {active && (
                          <motion.div
                            layoutId="role-pill"
                            className="absolute inset-0 rounded-xl bg-white shadow-sm"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                        <span
                          className={`relative z-10 flex items-center justify-center gap-1.5 transition ${active ? "text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                        >
                          <tab.Icon size={13} strokeWidth={1.75} />
                          {tab.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {/* ── FORM ── */}
              <motion.form
                variants={staggerContainer}
                className="mt-6 space-y-4"
                onSubmit={handleSubmit}
                noValidate
              >
                <FormInput
                  id="name"
                  label="Full name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={values.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  error={errors.name}
                />

                <AnimatePresence>
                  {role === "Recruiter" && (
                    <motion.div
                      key="org-field"
                      variants={slideTab}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                    >
                      <FormInput
                        id="organization"
                        label="Company name"
                        name="organization"
                        type="text"
                        autoComplete="organization"
                        value={values.organization}
                        onChange={handleChange}
                        placeholder="Enter company name"
                        error={errors.organization}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <FormInput
                  id="email"
                  label="Work email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={values.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  error={errors.email}
                />

                {/* password + strength */}
                <motion.div variants={fadeUp}>
                  <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <motion.input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={values.password}
                    onChange={handleChange}
                    placeholder="At least 8 characters"
                    whileFocus={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                    className={[
                      "w-full rounded-2xl border bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none backdrop-blur transition",
                      "focus:border-blue-500 focus:ring-3 focus:ring-blue-100",
                      errors.password ? "border-red-400 ring-2 ring-red-100" : "border-slate-200",
                    ].join(" ")}
                  />

                  {/* strength bar */}
                  {values.password && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex flex-1 gap-1">
                        {[1, 2, 3, 4].map((level) => (
                          <motion.div
                            key={level}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: pwStrength >= level ? 1 : 0 }}
                            transition={{ duration: 0.3 }}
                            style={{ transformOrigin: "left" }}
                            className={`h-1.5 flex-1 rounded-full ${pwStrength >= level ? strengthColor[pwStrength] : "bg-slate-200"}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-medium text-slate-500">{strengthLabel[pwStrength]}</span>
                    </div>
                  )}

                  <AnimatePresence>
                    {errors.password && (
                      <motion.p
                        key="pw-err"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="mt-1.5 text-xs font-medium text-red-500"
                      >
                        {errors.password}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

                <FormInput
                  id="confirmPassword"
                  label="Confirm password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={values.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  error={errors.confirmPassword}
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
                          Creating account…
                        </motion.span>
                      ) : (
                        <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          Create account →
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </motion.div>
              </motion.form>

              <motion.p variants={fadeUp} className="mt-6 text-center text-sm text-slate-500">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-blue-600 transition hover:text-blue-500">
                  Back to login
                </Link>
              </motion.p>
            </motion.div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
