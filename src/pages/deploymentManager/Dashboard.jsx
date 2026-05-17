import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAdminWorkforce } from "../../context/AdminWorkforceContext";
import { useDigitalFiles } from "../../context/DigitalFilesContext";

import { MetricCard } from "../../components/widgets/MetricCard";
import { HorizontalBarChart } from "../../components/widgets/HorizontalBarChart";
import { AgingQueueWidget } from "../../components/widgets/AgingQueueWidget";
import { groupItemsByStatus, calculateAgeInDays } from "../../lib/analytics/metrics";
import { Users, Briefcase, FileCheck, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, sectionFadeUp } from '../../lib/motionConfig';

export default function DeploymentManagerDashboard() {
  const { requests, assignments } = useAdminWorkforce();
  const { files } = useDigitalFiles();

  const analytics = useMemo(() => {
    const pendingRequests = requests.filter((request) => request.status === "Pending Approval");
    const activeDeployments = assignments.filter((assignment) => assignment.status === "Active");
    const needsActionFiles = files.filter((file) => file.status === "Needs Action");

    const expiringAssignments = assignments.filter((assignment) => {
      if (!assignment.endDate) return false;
      const ms = Date.parse(assignment.endDate) - Date.now();
      return ms > 0 && ms <= 1000 * 60 * 60 * 24 * 30; // 30 days window
    }).map(assignment => {
      const daysLeft = Math.floor((Date.parse(assignment.endDate) - Date.now()) / (1000 * 60 * 60 * 24));
      return {
        id: assignment.id,
        title: assignment.targetName || 'Deployment Target',
        subtitle: `Talent ID: ${assignment.talentId}`,
        age: `${daysLeft} days left`,
        status: daysLeft <= 14 ? 'Critical' : 'Warning',
        urgent: daysLeft <= 14
      };
    }).sort((a, b) => parseInt(a.age) - parseInt(b.age));

    const assignmentGroups = groupItemsByStatus(assignments, 'status');
    const assignmentMix = [
      { label: 'Active', value: assignmentGroups['Active'] || 0, colorClass: 'bg-emerald-500' },
      { label: 'Completed', value: assignmentGroups['Completed'] || 0, colorClass: 'bg-blue-400' },
      { label: 'Released', value: assignmentGroups['Released'] || 0, colorClass: 'bg-slate-400' }
    ].filter(item => item.value > 0);

    const pendingRequestsAge = pendingRequests.map(req => {
      const age = req.requestedAt ? calculateAgeInDays(req.requestedAt) : Math.floor(Math.random() * 5) + 1;
      return {
        id: req.id,
        title: req.clientName || 'Deployment Request',
        subtitle: `Role: ${req.roleRequested || 'Standard'}`,
        age: `${age} days pending`,
        status: age > 3 ? 'Aging' : 'New',
        urgent: age > 3
      };
    }).sort((a, b) => parseInt(b.age) - parseInt(a.age));

    const vaultReadiness = [
      { label: 'Compliant', value: files.filter(f => f.status === 'Approved').length, colorClass: 'bg-emerald-500' },
      { label: 'Pending Review', value: files.filter(f => f.status === 'Pending Review').length, colorClass: 'bg-amber-400' },
      { label: 'Needs Action', value: needsActionFiles.length, colorClass: 'bg-rose-500' }
    ].filter(item => item.value > 0);

    return {
      pendingCount: pendingRequests.length,
      activeCount: activeDeployments.length,
      needsActionCount: needsActionFiles.length,
      expiringCount: expiringAssignments.filter(a => parseInt(a.age) <= 14).length,
      expiringAssignments,
      assignmentMix,
      pendingRequestsAge,
      vaultReadiness
    };
  }, [requests, assignments, files]);

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">Deployment Manager</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Deployment Operations & Readiness
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Monitor active deployments, manage Digital 201 vault compliance, and track upcoming contract expirations.
        </p>
      </section>

      <motion.section
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <MetricCard 
          title="Active Deployments" 
          value={analytics.activeCount} 
          icon={Briefcase} 
          trend="+5 this month" 
          trendDirection="up" 
        />
        <MetricCard 
          title="Pending Requests" 
          value={analytics.pendingCount} 
          icon={Users} 
          trend="-2 resolved" 
          trendDirection="down" 
        />
        <MetricCard 
          title="Expiring (14 days)" 
          value={analytics.expiringCount} 
          icon={AlertTriangle} 
          subtext="Requires renewal" 
          trendDirection="neutral" 
        />
        <MetricCard 
          title="Files Needing Action" 
          value={analytics.needsActionCount} 
          icon={FileCheck} 
          subtext="Blocks deployment" 
          trendDirection="neutral" 
        />
      </motion.section>

      <motion.section className="grid gap-6 xl:grid-cols-2" {...sectionFadeUp}>
        <div className="space-y-6">
          <HorizontalBarChart title="Assignment Status Mix" data={analytics.assignmentMix} />
          <HorizontalBarChart title="Vault Compliance Readiness" data={analytics.vaultReadiness} />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <AgingQueueWidget title="Contract Expiration Risk" items={analytics.expiringAssignments} emptyMessage="No contracts expiring soon." />
          <AgingQueueWidget title="Pending Requests Aging" items={analytics.pendingRequestsAge} emptyMessage="No pending deployment requests." />
        </div>
      </motion.section>

      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading mb-4">Operations & Follow-ups</p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            ["Review Requests", "/deployment-manager/requests"],
            ["Monitor Assignments", "/deployment-manager/assignments"],
            ["View Schedule", "/deployment-manager/schedule"],
            ["Manage Vault", "/deployment-manager/vault"],
            ["Compliance Alerts", "/deployment-manager/notifications"],
          ].map(([label, to]) => (
            <Link
              key={to}
              to={to}
              className="rounded-3xl border border-slate-200 bg-white px-4 py-4 text-center text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 flex items-center justify-center min-h-[4rem]"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
