import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { PageFrame, PageHeader } from "../../components/layout/ShellPrimitives";
import { useAdminData } from "../../context/AdminDataContext";
import { useDigitalFiles } from "../../context/DigitalFilesContext";
import { useRecruiterDocsInbox } from "../../context/RecruiterDocsInboxContext";
import { useRecruitmentData } from "../../context/RecruitmentDataContext";

import { MetricCard } from "../../components/widgets/MetricCard";
import { HorizontalBarChart } from "../../components/widgets/HorizontalBarChart";
import { AgingQueueWidget } from "../../components/widgets/AgingQueueWidget";
import { Users, ShieldAlert, Activity, Database, UsersRound, BarChart3, Server, ChevronRight } from 'lucide-react';
import { calculateAgeInDays } from "../../lib/analytics/metrics";
import { motion } from 'framer-motion';
import { staggerContainer, sectionFadeUp } from '../../lib/motionConfig';
import { toCanonicalReportingStatus } from "../../lib/applicationTransitionGuard";

function formatNumber(value) {
  return new Intl.NumberFormat().format(value);
}

export default function AdminDashboard() {
  const { users, auditEvents } = useAdminData();
  const { jobs, applicationsByEmail } = useRecruitmentData();
  const { files } = useDigitalFiles();
  const { items } = useRecruiterDocsInbox();

  const allApplications = useMemo(() => Object.values(applicationsByEmail).flat(), [applicationsByEmail]);

  const stats = useMemo(() => {
    const roleCounts = {
      Administrator: users.filter((user) => user.role === "Administrator" && user.status !== "Archived").length,
      Recruiter: users.filter((user) => user.role === "Recruiter" && user.status !== "Archived").length,
      Candidate: users.filter((user) => user.role === "Candidate" && user.status !== "Archived").length,
    };

    const canonicalCounts = allApplications.reduce((acc, application) => {
      const status = toCanonicalReportingStatus(application.status);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    const applicationDistribution = ["Submitted", "Shortlisted", "Interview", "Offer", "Hired", "Rejected"].map(
      (status) => ({
        status,
        count: canonicalCounts[status] || 0,
      })
    );

    return {
      totalUsers: users.filter((user) => user.status !== "Archived").length,
      roleCounts,
      jobs: jobs.length,
      applications: allApplications.length,
      needsActionFiles: files.filter((file) => file.status === "Needs Action").length,
      pendingInbox: items.filter((item) => item.status === "Submitted").length,
      flaggedItems:
        files.filter((file) => file.status === "Needs Action").length +
        allApplications.filter(
          (application) =>
            toCanonicalReportingStatus(application.status) === "Rejected"
        ).length,
      applicationDistribution,
    };
  }, [allApplications, files, items, jobs, users]);

  const recentEvents = auditEvents.slice(0, 8);
  const flaggedFiles = files.filter((file) => file.status === "Needs Action").slice(0, 4);
  const flaggedApplications = allApplications
    .filter((application) => application.status === "Rejected")
    .slice(0, 4);

  // Widget Data Transforms
  const roleDistribution = [
    { label: 'Administrator', value: stats.roleCounts.Administrator, colorClass: 'bg-cyan-500' },
    { label: 'Talent Acquisition', value: stats.roleCounts.Recruiter, colorClass: 'bg-emerald-500' },
    { label: 'Candidate', value: stats.roleCounts.Candidate, colorClass: 'bg-slate-400' },
  ].filter(item => item.value > 0);

  const appDistArray = stats.applicationDistribution.map((item, index) => {
    const colors = ['bg-slate-400', 'bg-blue-400', 'bg-indigo-400', 'bg-purple-400', 'bg-emerald-500', 'bg-rose-500'];
    return {
      label: item.status,
      value: item.count,
      colorClass: colors[index % colors.length]
    };
  }).filter(item => item.value > 0);

  const complianceSignals = [
    ...flaggedFiles.map(f => ({
      id: f.id,
      title: f.employeeName,
      subtitle: `201 File - ${f.department}`,
      age: 'Needs Action',
      status: 'Flagged',
      urgent: true
    })),
    ...flaggedApplications.map(a => ({
      id: a.id,
      title: a.candidateName,
      subtitle: `Application - ${a.jobTitle}`,
      age: 'Rejected',
      status: 'Policy Review',
      urgent: true
    }))
  ];

  const recentAuditActivity = recentEvents.map(event => ({
    id: event.id,
    title: event.action,
    subtitle: `${event.actor} - ${event.target || 'System'}`,
    age: 'Recent',
    status: event.category,
    urgent: event.category === 'Security' || event.category === 'Policy' || event.category === 'Data'
  }));

  return (
    <PageFrame size="wide">
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
        >
          <PageHeader
            dark
            eyebrow="Administrator dashboard"
            title="System Oversight &amp; Compliance"
            description="Monitor system activity, audit volume, role distribution, and investigate flagged policy signals across all workspaces."
          />
        </motion.div>

        <motion.section
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <MetricCard 
            title="Total Users" 
            value={formatNumber(stats.totalUsers)} 
            icon={Users} 
            subtext="Active accounts" 
            trendDirection="neutral"
            accentColor="indigo"
          />
          <MetricCard 
            title="Policy Watch Items" 
            value={formatNumber(stats.flaggedItems)} 
            icon={ShieldAlert} 
            trend="+2 flagged" 
            trendDirection="down"
            accentColor="rose"
          />
          <MetricCard 
            title="Audit Events (30d)" 
            value={formatNumber(auditEvents.length)} 
            icon={Activity} 
            trend="+12% volume" 
            trendDirection="neutral"
            accentColor="sky"
          />
          <MetricCard 
            title="Total Records" 
            value={formatNumber(stats.jobs + stats.applications)} 
            icon={Database} 
            subtext="Jobs &amp; Applications" 
            trendDirection="neutral"
            accentColor="violet"
          />
        </motion.section>

        <motion.section
          className="grid gap-6 xl:grid-cols-2"
          {...sectionFadeUp}
        >
          <div className="space-y-6">
            <HorizontalBarChart title="System Role Distribution" data={roleDistribution} />
            <HorizontalBarChart title="Cross-Workspace Application Mix" data={appDistArray} />
          </div>
          <div className="space-y-6">
            <AgingQueueWidget title="Policy & Compliance Signals" items={complianceSignals} emptyMessage="No flagged items needing policy review." />
          </div>
        </motion.section>

        <motion.section className="grid gap-6 xl:grid-cols-3" {...sectionFadeUp}>
          <div className="xl:col-span-2">
            <AgingQueueWidget title="Recent Audit Activity" items={recentAuditActivity} emptyMessage="No recent events." />
          </div>
          <div className="space-y-3">
            <p className="section-heading px-1">Management Tools</p>
            <div className="grid gap-2.5">
              {[
                { label: "Manage Staff Accounts", to: "/admin/users", note: "Accounts, roles, and privileges.", Icon: UsersRound },
                { label: "Recruitment & AI Policies", to: "/admin/policies", note: "Set policy guardrails and defaults.", Icon: ShieldAlert },
                { label: "Audit & Usage Reports", to: "/admin/audit", note: "Platform activity and audit timeline.", Icon: BarChart3 },
                { label: "System Controls", to: "/admin/system", note: "Cleanup, backup, and maintenance.", Icon: Server },
              ].map((link) => (
                <motion.div
                  key={link.to}
                  whileHover={{ y: -1, transition: { duration: 0.18, ease: [0.32, 0.72, 0, 1] } }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    to={link.to}
                    className="flex items-center gap-3 rounded-xl bg-white px-3.5 py-3 transition-all"
                    style={{
                      border: "1px solid rgba(15,23,42,0.07)",
                      boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
                    }}
                  >
                    <span
                      className="flex h-8 w-8 flex-none items-center justify-center rounded-lg"
                      style={{
                        background: "rgba(15,23,42,0.04)",
                        border: "1px solid rgba(15,23,42,0.06)",
                      }}
                    >
                      <link.Icon size={14} strokeWidth={1.75} style={{ color: "#64748b" }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-slate-900 leading-tight">{link.label}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400 leading-tight">{link.note}</p>
                    </div>
                    <ChevronRight size={13} strokeWidth={2} style={{ color: "#cbd5e1", flexShrink: 0 }} />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      </div>
    </PageFrame>
  );
}
