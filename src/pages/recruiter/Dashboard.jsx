import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageFrame } from "../../components/layout/ShellPrimitives";
import { useDigitalFiles } from "../../context/DigitalFilesContext";
import { useRecruiterDocsInbox } from "../../context/RecruiterDocsInboxContext";
import { useRecruitmentData } from "../../context/RecruitmentDataContext";
import {
  buildRecruiterJobPath,
  getMostRecentJobId,
} from "../../lib/jobNavigation";
import { get201StatusTone } from "../../lib/digitalFileStatusConfig";

import { MetricCard } from "../../components/widgets/MetricCard";
import { HorizontalBarChart } from "../../components/widgets/HorizontalBarChart";
import { AgingQueueWidget } from "../../components/widgets/AgingQueueWidget";
import { FunnelWidget } from "../../components/widgets/FunnelWidget";
import { calculateAgeInDays, calculateConversionRate, groupItemsByStatus } from "../../lib/analytics/metrics";
import { Users, Briefcase, FileCheck, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, cardVariants } from '../../lib/motionConfig';

function formatDate(dateString) {
  if (!dateString) return "No date";
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function toTimeValue(dateString) {
  const parsed = Date.parse(dateString || "");
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default function RecruiterDashboard() {
  const { jobs } = useRecruitmentData();
  const { files, addFile } = useDigitalFiles();
  const { items, approveInboxItem, requestActionForItem, markInboxItemReviewed, refreshInbox } = useRecruiterDocsInbox();
  const [notice, setNotice] = useState("");
  
  const mostRecentJobId = useMemo(() => getMostRecentJobId(jobs), [jobs]);
  const quickActions = useMemo(
    () => [
      { label: "Manage Jobs", path: "/recruiter/jobs" },
      { label: "Run Screening", path: buildRecruiterJobPath("/recruiter/screening", mostRecentJobId) },
      { label: "Open Analytics", path: buildRecruiterJobPath("/recruiter/analytics", mostRecentJobId) },
      { label: "Review 201 Files", path: "/recruiter/files" },
    ],
    [mostRecentJobId]
  );

  // Derive Analytical Metrics
  const analytics = useMemo(() => {
    const totalApplicants = jobs.reduce((sum, job) => sum + (job.applicants || 0), 0);
    const totalShortlisted = jobs.reduce((sum, job) => sum + (job.analytics?.shortlisted || 0), 0);
    // Mock data for further stages since not all are in mock yet
    const totalInterviewed = Math.round(totalShortlisted * 0.4); 
    const totalOffers = Math.round(totalInterviewed * 0.5);

    const funnelStages = [
      { label: 'Applicants', value: totalApplicants },
      { label: 'AI Shortlist', value: totalShortlisted, conversionRate: calculateConversionRate(totalShortlisted, totalApplicants) },
      { label: 'Interviews', value: totalInterviewed, conversionRate: calculateConversionRate(totalInterviewed, totalShortlisted) },
      { label: 'Offers', value: totalOffers, conversionRate: calculateConversionRate(totalOffers, totalInterviewed) }
    ];

    const agingRequisitions = jobs.map(job => {
      const age = calculateAgeInDays(job.postedOn);
      return {
        id: job.id,
        title: job.title,
        subtitle: `${job.department} - ${job.id}`,
        age: `${age}d open`,
        status: age > 30 ? 'Aging' : 'On Track',
        urgent: age > 30
      };
    }).sort((a, b) => parseInt(b.age) - parseInt(a.age)).slice(0, 5);

    const fileStatusGroups = groupItemsByStatus(files, 'status');
    const fileStatusMix = [
      { label: 'Pending Review', value: fileStatusGroups['Pending Review'] || 0, colorClass: 'bg-amber-400' },
      { label: 'Needs Action', value: fileStatusGroups['Needs Action'] || 0, colorClass: 'bg-rose-400' },
      { label: 'Approved', value: fileStatusGroups['Approved'] || 0, colorClass: 'bg-emerald-400' }
    ].filter(item => item.value > 0);

    return {
      activeJobs: jobs.length,
      totalApplicants,
      funnelStages,
      agingRequisitions,
      fileStatusMix,
      pendingFiles: fileStatusGroups['Pending Review'] || 0
    };
  }, [jobs, files]);

  const sortedInbox = useMemo(
    () => [...items].sort((left, right) => Date.parse(right.submittedOn || "") - Date.parse(left.submittedOn || "")),
    [items]
  );

  const hasNoJobs = analytics.activeJobs === 0;
  const hasNoFiles = files.length === 0;

  const handleAttachMockFile = () => {
    const nextFile = addFile({
      employeeName: "New Hire",
      employeeId: `EMP-${Date.now().toString().slice(-4)}`,
      department: "HR Operations",
      notes: "Mock file attached from the recruiter dashboard.",
    });
    setNotice(`Mock file ${nextFile.id} attached and ready for review.`);
  };

  return (
    <PageFrame size="wide">
      <div className="space-y-6">
        <section className="surface-card p-6 sm:p-8">
          <p className="section-heading">Talent Acquisition Portal</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Hiring Funnel & Pipeline Health
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            Monitor requisition aging, evaluate funnel conversion rates, and manage compliance file reviews.
          </p>
        </section>

        {(hasNoJobs || hasNoFiles) && (
          <section className="rounded-3xl border border-amber-200 bg-amber-50 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Getting Started</p>
            <p className="mt-2 text-sm text-amber-900">
              Populate the dashboard by creating a requisition or attaching mock files.
            </p>
            <div className="mt-4 flex gap-3">
              {hasNoJobs && (
                <Link to="/recruiter/jobs" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Create Requisition
                </Link>
              )}
              {hasNoFiles && (
                <button onClick={handleAttachMockFile} className="rounded-2xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 transition hover:border-amber-400">
                  Attach Mock File
                </button>
              )}
            </div>
          </section>
        )}

        {notice && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {notice}
          </div>
        )}

        <motion.section
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <MetricCard title="Active Requisitions" value={analytics.activeJobs} icon={Briefcase} trend="+2 this week" trendDirection="up" />
          <MetricCard title="Total Applicants" value={analytics.totalApplicants} icon={Users} trend="+15% vs last mo" trendDirection="up" />
          <MetricCard title="Avg Time to Hire" value="24 days" icon={Target} trend="-3 days" trendDirection="up" />
          <MetricCard title="Docs Pending Review" value={analytics.pendingFiles} icon={FileCheck} subtext="Requires action" trendDirection="neutral" />
        </motion.section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <FunnelWidget title="Hiring Funnel Conversion" stages={analytics.funnelStages} />
          </div>
          <div>
            <AgingQueueWidget title="Aging Requisitions" items={analytics.agingRequisitions} emptyMessage="No aging requisitions" />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div>
            <HorizontalBarChart title="Digital 201 File Review Status" data={analytics.fileStatusMix} />
          </div>
          <div className="xl:col-span-2 surface-card p-6 sm:p-8">
            <p className="section-heading mb-4">Quick Actions</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {quickActions.map((action) => (
                <Link
                  key={action.path}
                  to={action.path}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="surface-card p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <p className="section-heading">Candidate Docs Inbox</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-950">New onboarding submissions</h2>
            </div>
            <button
              type="button"
              onClick={refreshInbox}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Refresh Inbox
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {sortedInbox.length > 0 ? (
              sortedInbox.map((item) => {
                const tone = get201StatusTone(item.status);
                return (
                  <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.candidateAlias || "Candidate"}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.docType} - Submitted {formatDate(item.submittedOn)}
                        </p>
                      </div>
                      <span className={["rounded-full px-3 py-1 text-xs font-semibold", tone.pill].join(" ")}>
                        {item.status}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { approveInboxItem(item.id, "Approved"); setNotice("Approved"); }} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg">Approve</button>
                      <button onClick={() => { requestActionForItem(item.id, "Needs Action"); setNotice("Action requested"); }} className="text-xs border border-amber-300 text-amber-900 bg-amber-50 px-3 py-1.5 rounded-lg">Action Needed</button>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600 lg:col-span-2">
                No candidate submissions yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </PageFrame>
  );
}
