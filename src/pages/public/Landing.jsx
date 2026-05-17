import React, { useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Brain, Star, BarChart3, FolderLock } from "lucide-react";
import BrandMark from "../../components/branding/BrandMark";
import { useAuth } from "../../context/AuthContext";
import { getRoleHomePath } from "../../lib/routeHelpers";

/* ─── animation presets ─────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const cardReveal = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ─── data ───────────────────────────────────────────────────────────────── */
const features = [
  {
    Icon: Brain,
    title: "AI Resume Screening",
    text: "Context-aware parsing that scores candidates on role fit, not keyword noise.",
    accent: "from-violet-500/20 to-purple-500/10",
    iconBg: "rgba(139,92,246,0.10)",
    iconColor: "#7c3aed",
    iconBorder: "rgba(139,92,246,0.18)",
  },
  {
    Icon: Star,
    title: "AI-Ranked Review",
    text: "Applicants are ranked by role fit and surfaced for fast hiring decisions.",
    accent: "from-blue-500/20 to-cyan-500/10",
    iconBg: "rgba(59,130,246,0.10)",
    iconColor: "#2563eb",
    iconBorder: "rgba(59,130,246,0.18)",
  },
  {
    Icon: BarChart3,
    title: "TA Analytics",
    text: "Track applicant volume, shortlist rate, and time-to-fill across hiring cycles.",
    accent: "from-emerald-500/20 to-teal-500/10",
    iconBg: "rgba(16,185,129,0.10)",
    iconColor: "#059669",
    iconBorder: "rgba(16,185,129,0.18)",
  },
  {
    Icon: FolderLock,
    title: "Digital 201 Files",
    text: "Manage HR/compliance records in a controlled employee file vault.",
    accent: "from-amber-500/20 to-orange-500/10",
    iconBg: "rgba(245,158,11,0.10)",
    iconColor: "#d97706",
    iconBorder: "rgba(245,158,11,0.18)",
  },
];

const steps = [
  { step: "01", label: "Upload & Parse", desc: "AI extracts and normalises resume data instantly." },
  { step: "02", label: "Semantic Rank", desc: "Candidates are scored by role fit — not keywords." },
  { step: "03", label: "Review Analytics", desc: "Visualise hiring cycle data and shortlist rates." },
  { step: "04", label: "Manage 201 Files", desc: "Centralise HR records in the compliant vault." },
];

/* ─── helper: scroll-aware section ──────────────────────────────────────── */
function RevealSection({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      variants={staggerContainer}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── magnetic button ────────────────────────────────────────────────────── */
function MagBtn({ to, primary, children }) {
  return (
    <motion.div
      whileHover={{ scale: 1.045 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      <Link
        to={to}
        className={
          primary
            ? "inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/30 transition hover:from-slate-800 hover:to-slate-600"
            : "inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 backdrop-blur transition hover:border-slate-300 hover:bg-white"
        }
      >
        {children}
      </Link>
    </motion.div>
  );
}

/* ─── component ──────────────────────────────────────────────────────────── */
export default function Landing() {
  const { session, isAuthenticated } = useAuth();

  if (isAuthenticated && session) {
    return <Navigate to={getRoleHomePath(session.role)} replace />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f8fbff]">
      {/* ── ambient blobs ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-blue-400/20 blur-[120px]" />
        <div className="absolute -right-20 top-20 h-[400px] w-[400px] rounded-full bg-violet-400/15 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[500px] rounded-full bg-cyan-400/10 blur-[90px]" />
      </div>

      {/* ── HEADER ── */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8"
      >
        <BrandMark />
        <nav className="flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/login"
              className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 backdrop-blur transition hover:border-slate-300 hover:bg-white"
            >
              Login
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/register"
              className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 px-4 py-2 text-sm font-medium text-white shadow-md shadow-slate-900/25 transition hover:from-slate-800"
            >
              Register
            </Link>
          </motion.div>
        </nav>
      </motion.header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">

        {/* ── HERO ── */}
        <section className="grid gap-10 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
          {/* left copy */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="max-w-3xl"
          >
            <motion.p
              variants={fadeUp}
              custom={0}
              className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600"
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
              SMB Recruitment Platform
            </motion.p>

            <motion.h1
              variants={fadeUp}
              custom={0.1}
              className="mt-5 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl"
            >
              AI-powered resume
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
                screening
              </span>{" "}
              built for
              <br />
              faster hiring.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={0.2}
              className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg"
            >
              Screen resumes contextually with AI-ranked review, and keep hiring
              managers aligned with clear analytics and HR file controls.
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={0.3}
              className="mt-8 flex flex-wrap gap-3"
            >
              <MagBtn to="/register" primary>
                Start Free →
              </MagBtn>
              <MagBtn to="/login">Sign In</MagBtn>
            </motion.div>

            <motion.div
              variants={fadeUp}
              custom={0.4}
              className="mt-8 flex flex-wrap gap-2"
            >
              {["AI-ranked screening", "Semantic match scores", "Digital 201 files", "TA analytics"].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full border border-slate-200/80 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur"
                  >
                    {item}
                  </span>
                )
              )}
            </motion.div>
          </motion.div>

          {/* right dashboard card */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="relative"
          >
            {/* glow halo */}
            <div
              aria-hidden
              className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-blue-400/20 via-violet-400/10 to-transparent blur-2xl"
            />

            <div className="surface-card relative p-6 sm:p-8">
              {/* dark inner panel */}
              <div className="rounded-[1.75rem] bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-2xl">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Platform snapshot
                </p>
                <h2 className="mt-3 text-2xl font-semibold">
                  One system, four role-based workflows
                </h2>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    ["Resume intake", "AI parsing and upload feedback"],
                    ["Screening", "AI-ranked candidate review"],
                    ["Analytics", "Hiring cycle insights"],
                    ["201 Files", "HR document vault"],
                  ].map(([title, text], i) => (
                    <motion.div
                      key={title}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 + i * 0.1, duration: 0.5 }}
                      whileHover={{ scale: 1.03 }}
                      className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm transition"
                    >
                      <p className="font-semibold">{title}</p>
                      <p className="mt-1 text-sm text-slate-300">{text}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* stat pills */}
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  ["Contextual", "NLP matching"],
                  ["Prioritized", "AI-ranked review"],
                  ["Scalable", "SMB-ready"],
                ].map(([label, value], i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + i * 0.08, duration: 0.45 }}
                    whileHover={{ y: -2 }}
                    className="rounded-2xl border border-slate-200 bg-white p-4 transition"
                  >
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-base font-semibold text-slate-950">
                      {value}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── FEATURE CARDS ── */}
        <RevealSection className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((f) => (
            <motion.article
              key={f.title}
              variants={cardReveal}
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft backdrop-blur"
            >
              {/* gradient accent */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${f.accent} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
              />
              <div className="relative">
                {/* Double-bezel icon tile */}
                <div
                  style={{
                    display: "inline-flex",
                    padding: "5px",
                    borderRadius: "0.875rem",
                    background: "rgba(255,255,255,0.8)",
                    border: "1px solid rgba(15,23,42,0.07)",
                    boxShadow: "0 1px 4px rgba(15,23,42,0.06)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "2.25rem",
                      height: "2.25rem",
                      borderRadius: "0.625rem",
                      background: f.iconBg,
                      border: `1px solid ${f.iconBorder}`,
                    }}
                  >
                    <f.Icon size={16} strokeWidth={1.75} style={{ color: f.iconColor }} />
                  </div>
                </div>
                <h3 className="mt-3 text-base font-semibold text-slate-950">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{f.text}</p>
              </div>
            </motion.article>
          ))}
        </RevealSection>

        {/* ── HOW IT WORKS + CTA ── */}
        <RevealSection className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* steps */}
          <motion.div variants={cardReveal} className="surface-card p-6 sm:p-8">
            <p className="section-heading">How it works</p>
            <div className="mt-5 space-y-3">
              {steps.map((s, i) => (
                <motion.div
                  key={s.step}
                  variants={cardReveal}
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-4 transition"
                >
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 text-xs font-bold text-white shadow">
                    {s.step}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-950">{s.label}</p>
                    <p className="mt-0.5 text-sm text-slate-500">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* trust + CTA */}
          <motion.div variants={cardReveal} className="flex flex-col gap-4">
            <div className="surface-card flex-1 p-6 sm:p-8">
              <p className="section-heading">Trusted for HR operations</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
                  ["AI-ranked screening", "Prioritize high-fit applicants with clear semantic fit signals."],
                  ["Digital 201 files", "Manage employee records and compliance documents centrally."],
                ].map(([title, text]) => (
                  <motion.div
                    key={title}
                    whileHover={{ scale: 1.02 }}
                    className="rounded-2xl bg-slate-50 p-5 transition"
                  >
                    <p className="text-sm font-semibold text-slate-900">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* dark CTA card */}
            <motion.div
              whileHover={{ scale: 1.015 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-xl"
            >
              <div
                aria-hidden
                className="absolute right-0 top-0 h-48 w-48 translate-x-16 -translate-y-16 rounded-full bg-blue-500/20 blur-2xl"
              />
              <p className="relative text-sm font-semibold">Ready to begin?</p>
              <p className="relative mt-2 text-sm leading-6 text-slate-300">
                Create your account to access role-based dashboards and the talent
                acquisition and deployment workflows.
              </p>
              <div className="relative mt-5 flex flex-wrap gap-3">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    to="/register"
                    className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                  >
                    Create account
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    to="/login"
                    className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
                  >
                    Continue to login
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </RevealSection>
      </main>
    </div>
  );
}
