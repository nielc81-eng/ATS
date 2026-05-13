import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTalentPool } from "../../context/TalentPoolContext";

function formatPercent(value) {
  return `${Math.round(value || 0)}%`;
}

export default function AdminTalentPoolAnalytics() {
  const { analytics, pools, candidates, vacancies, recommendationMap } = useTalentPool();

  const topCandidates = useMemo(() => {
    return [...candidates]
      .map((candidate) => ({
        candidate,
        topRecommendation: recommendationMap[candidate.id]?.[0] || null,
      }))
      .sort(
        (left, right) =>
          (right.topRecommendation?.score || 0) - (left.topRecommendation?.score || 0)
      )
      .slice(0, 8);
  }, [candidates, recommendationMap]);

  const poolBreakdown = useMemo(() => {
    return pools.map((pool) => ({
      pool,
      candidates: candidates.filter((candidate) => candidate.poolIds.includes(pool.id)).length,
      openVacancies: vacancies.filter(
        (vacancy) => vacancy.poolId === pool.id && vacancy.state === "Open"
      ).length,
    }));
  }, [candidates, pools, vacancies]);

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">Administrator</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Talent Pool Analytics
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Global reporting across all pools, recruiter-operated candidate pipelines,
          and AI fit recommendations.
        </p>
        <div className="mt-5">
          <Link
            to="/admin/talent-pool"
            className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          >
            Back to Talent Pool Settings
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Total Candidates</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{analytics.totalCandidates}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Recommended Pairs</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{analytics.recommendedPairs}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Avg Top Match</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {formatPercent(analytics.averageTopMatchScore)}
          </p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Open Vacancies</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{analytics.openVacancies}</p>
        </article>
      </section>

      <section className="surface-card p-6">
        <h2 className="text-lg font-semibold text-slate-950">Candidate Status Breakdown</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {Object.entries(analytics.statusBreakdown).map(([status, count]) => (
            <article
              key={status}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
            >
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{status}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{count}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="surface-card p-6">
          <h2 className="text-lg font-semibold text-slate-950">Pool Capacity Snapshot</h2>
          <div className="mt-4 space-y-3">
            {poolBreakdown.map(({ pool, candidates: poolCandidates, openVacancies }) => (
              <article
                key={pool.id}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{pool.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {pool.department} • {pool.id}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {poolCandidates} candidates
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  Open vacancies in this pool: <span className="font-semibold">{openVacancies}</span>
                </p>
              </article>
            ))}
          </div>
        </article>

        <article className="surface-card p-6">
          <h2 className="text-lg font-semibold text-slate-950">Top AI Recommendations</h2>
          <div className="mt-4 space-y-3">
            {topCandidates.length > 0 ? (
              topCandidates.map(({ candidate, topRecommendation }) => (
                <article
                  key={candidate.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{candidate.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {candidate.status} • {candidate.location}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                      {topRecommendation?.score ?? 0}%
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    {topRecommendation
                      ? `Best fit vacancy: ${topRecommendation.vacancyId} (${topRecommendation.overlapSkills.length} overlap skills).`
                      : "No open vacancy match yet."}
                  </p>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                No candidate recommendations available yet.
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
