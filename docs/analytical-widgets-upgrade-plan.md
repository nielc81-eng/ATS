# Analytical Widgets Upgrade Plan

## 1. Overview
The goal of this upgrade is to transform the three primary role dashboards (Recruiter, Administrator, and Deployment Manager) into a cohesive, analytical experience. We will introduce a shared analytics widget set that standardizes metric rules and visual language across all roles while strictly preserving existing routing and role separation.

## 2. Shared Component Strategy
To ensure a consistent visual language, we will build a shared analytics widget layer before doing any page-specific polish. This will reuse existing dashboard primitives and add missing pieces required for trends, status breakdowns, and aging queues.

**New & Enhanced Shared Components (`src/components/widgets/`):**
- **`MetricCard`**: A core tile displaying a primary KPI (count, percentage) with a sparkline or trend indicator (up/down/flat) and optional subtext.
- **`HorizontalBarChart`**: A component for status breakdowns and mix distributions.
- **`AgingQueueWidget`**: A specialized list/table widget highlighting items at risk of SLA breach (e.g., aging requisitions, pending requests).
- **`FunnelWidget`**: A specialized component mapping conversion through consecutive stages (e.g., Application -> Shortlist -> Hire).

These components will be data-agnostic, accepting props for values, labels, colors, and trends.

## 3. Widget Scope by Role

### 3.1. Recruiter (Talent Acquisition)
**Focus:** Hiring Funnel Health & Requisition Pipeline
- **Applicant Volume & Velocity**: Total applications received, screening velocity, and time-to-hire estimates.
- **Funnel Conversion**: Conversion rates from Application -> AI Shortlist -> Interview -> Offer.
- **Requisition Aging**: Queue of open job requisitions, highlighting those exceeding time-to-fill targets.
- **File Review Status**: Tracking of applicant/post-hire documentation review queues.
- **Job-Level Analytics**: Drill-down capabilities from aggregate widgets into specific job performance.

### 3.2. Administrator
**Focus:** System Oversight, Compliance & Governance
- **System Activity & Audit Volume**: Total system actions, login volume, and recent audit events over time.
- **Policy & Compliance Signals**: Rejected or flagged items detected by compliance rules and AI policy controls.
- **User Role Distribution**: Breakdown of active accounts by role (Candidate, Recruiter, DeploymentManager, Admin).
- **Cross-Workspace Trend Summaries**: High-level usage history and capacity metrics across different workspaces.

### 3.3. Deployment Manager
**Focus:** Workforce Operations & Deployment Readiness
- **Active Deployments**: Current headcount deployed versus idle/bench metrics.
- **Assignment Status Mix**: Breakdown of assignments (Active, Completed, Released, Pending).
- **Expiration Risk & Follow-up Queues**: Alerts for upcoming contract expirations or required compliance renewals.
- **Request Aging**: Tracking the aging of deployment status updates or new assignment requests.
- **Vault Readiness**: Digital 201 file completeness and compliance tracking for the deployed workforce.

## 4. Data Sources
The backend is currently driven by mock/local-state logic. Analytics will be derived using new helper functions in the `src/lib/` and contexts:
- **Recruiter**: `RecruitmentDataContext.jsx`, `recruitmentMockData.js`
- **Administrator**: `AdminDataContext.jsx`, `adminMockData.js`, `mockAuthStore.js`
- **Deployment Manager**: `AdminWorkforceContext.jsx`, `adminWorkforceMockData.js`, `DigitalFilesContext.jsx`

*New derived-metric helpers will be created to ensure calculations (counts, percentages) remain consistent across both summary tiles and detailed reports.*

## 5. Rollout Order
1. **Phase 1: Shared Widget Layer**
   - Create shared widgets (`MetricCard`, `HorizontalBarChart`, `AgingQueueWidget`, `FunnelWidget`) in `src/components/widgets/`.
   - Implement common derived-metric utilities in `src/lib/analytics/` with test coverage.
2. **Phase 2: Recruiter Dashboard**
   - Upgrade the Recruiter home view using the shared widgets to visualize funnel health and requisition aging.
3. **Phase 3: Administrator Dashboard**
   - Refactor Admin summary cards into analytical oversight widgets (audit trends, role mix).
4. **Phase 4: Deployment Manager Dashboard**
   - Transform the Deployment Manager view into a real operational dashboard (expiration risks, vault readiness).
5. **Phase 5: Validation & Polish**
   - Verify empty-data states, responsive behavior (grids/chart blocks), and role-isolation boundaries. Ensure no Admin-only data leaks to Recruiters.

## 6. Documentation Impact
The new widget behavior visually expands on the existing operational ownership described in `docs/erd.md` without fundamentally altering the boundaries.
- **Recruiter** continues to own the funnel and AI-ranked review.
- **Deployment Manager** handles operational vault readiness, deployments, and expiration queues.
- **Administrator** retains system oversight, audit tracking, and role management.

No structural changes are required for `README.md` or `docs/erd.md`, as the roles' functional responsibilities remain unchanged. The new analytics layer simply provides better visibility into the existing processes.
