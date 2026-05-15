import React from "react";
import { Link, Navigate } from "react-router-dom";
import BrandMark from "../../components/branding/BrandMark";
import { useAuth } from "../../context/AuthContext";
import { getRoleHomePath } from "../../lib/routeHelpers";

const features = [
  {
    title: "AI resume screening",
    text: "Context-aware parsing that scores candidates on role fit, not keyword noise.",
  },
  {
    title: "AI-ranked review",
    text: "Applicants are ranked by role fit and surfaced for fast hiring decisions.",
  },
  {
    title: "Talent acquisition analytics",
    text: "Track applicant volume, shortlist rate, and time-to-fill across hiring cycles.",
  },
  {
    title: "Digital 201 files",
    text: "Manage HR/compliance records in a controlled employee file vault.",
  },
];

const steps = [
  "Upload and parse resumes",
  "Rank semantically with AI-fit scoring",
  "Review analytics and hiring cycle reports",
  "Manage employee 201 records in the file vault",
];

export default function Landing() {
  const { session, isAuthenticated } = useAuth();

  if (isAuthenticated && session) {
    return <Navigate to={getRoleHomePath(session.role)} replace />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.22),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.12),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#eef4fb_100%)]" />

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <BrandMark />
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Register
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <section className="grid gap-8 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-14">
          <div className="max-w-3xl">
            <p className="section-heading">SMB Recruitment Platform</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              AI-powered resume screening built for faster hiring.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Screen resumes contextually with AI-ranked review,
              and keep hiring managers aligned with clear analytics and HR file
              controls.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Start Free
              </Link>
              <Link
                to="/login"
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                Sign In
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {["AI-ranked screening", "Semantic match scores", "Digital 201 files", "TA analytics"].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm text-slate-600 shadow-sm backdrop-blur"
                  >
                    {item}
                  </span>
                )
              )}
            </div>
          </div>

          <div className="surface-card p-6 sm:p-8">
            <div className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-soft">
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
                ].map(([title, text]) => (
                  <div key={title} className="rounded-2xl bg-white/10 p-4">
                    <p className="font-semibold">{title}</p>
                    <p className="mt-1 text-sm text-slate-300">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                ["Contextual", "NLP matching"],
                ["Prioritized", "AI-ranked review"],
                ["Scalable", "SMB-ready"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-3xl border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    {label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <article key={feature.title} className="surface-card p-5">
              <h3 className="text-lg font-semibold text-slate-950">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.text}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="surface-card p-6">
            <p className="section-heading">How it works</p>
            <div className="mt-5 space-y-4">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                    0{index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-950">{step}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Designed for a fast, controlled hiring workflow.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card p-6">
            <p className="section-heading">Trusted for HR operations</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">
                  AI-ranked screening
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Prioritize high-fit applicants with clear semantic fit signals.
                </p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">
                  Digital 201 files
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Manage employee records and compliance documents centrally.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white">
              <p className="text-sm font-semibold">Ready to begin?</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Create your account to access role-based dashboards and the
                talent acquisition and deployment workflows.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-950"
                >
                  Create account
                </Link>
                <Link
                  to="/login"
                  className="rounded-2xl border border-white/20 px-4 py-2 text-sm font-semibold text-white"
                >
                  Continue to login
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
