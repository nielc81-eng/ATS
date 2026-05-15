# ERD (Conceptual Data Model)

This app is currently React + localStorage mock state. The model below documents a backend-ready relational shape aligned to Processes 1.0–1.4.

```mermaid
erDiagram
  ACCOUNT {
    string id PK
    string name
    string email UK
    string password_hash
    string role "Candidate|Recruiter|DeploymentManager|Administrator"
    string status "Active|Archived"
    datetime created_at
  }

  CANDIDATE_PROFILE {
    string id PK
    string account_id FK
    int years_experience
    datetime created_at
  }

  RECRUITER_PROFILE {
    string id PK
    string account_id FK
    string department
    datetime created_at
  }

  DEPLOYMENT_MANAGER_PROFILE {
    string id PK
    string account_id FK
    datetime created_at
  }

  APPLICATION {
    string id PK
    string candidate_profile_id FK
    string job_id FK
    string status "Submitted|PooledForFutureOpportunities|InterviewInitial|InterviewFinal|PostHireDocsSubmitted|HiredOnboarding|BackoutArchived|Rejected"
    datetime applied_at
    datetime updated_at
  }

  APPLICATION_TIMELINE {
    string id PK
    string application_id FK
    string by_role "Candidate|Recruiter|System"
    string to_status
    string note
    datetime at
  }

  COMPLIANCE_GATE_DECISION {
    string id PK
    string application_id FK
    string result "pass|fail"
    string actor
    string reason
    datetime decided_at
  }

  JOB_REQUISITION {
    string id PK
    string title
    string department
    string description
    date posted_on
  }

  TALENT_POOL_CANDIDATE {
    string id PK
    string name
    string email
    string status "New|Shortlisted|Ready|Placed|Archived"
    datetime updated_on
  }

  DEPLOYMENT_ASSIGNMENT {
    string id PK
    string talent_id FK
    string target_name
    string status "Active|Completed|Released"
    datetime assigned_at
    datetime end_date
  }

  DEPLOYMENT_NOTIFICATION_EVENT {
    string id PK
    string assignment_id FK
    string event_type "expiration_alert|compliance_notification"
    string message
    string triggered_by
    string status "sent"
    datetime created_at
  }

  EMPLOYEE_FILE {
    string id PK
    string employee_id
    string employee_name
    string department
    string status "Pending Review|Approved|Needs Action|Archived"
    datetime last_reviewed_on
  }

  ADMIN_AUDIT_EVENT {
    string id PK
    string actor
    string action
    string target
    string category
    string detail
    datetime timestamp
  }

  ACCOUNT ||--o| CANDIDATE_PROFILE : has
  ACCOUNT ||--o| RECRUITER_PROFILE : has
  ACCOUNT ||--o| DEPLOYMENT_MANAGER_PROFILE : has

  CANDIDATE_PROFILE ||--o{ APPLICATION : submits
  JOB_REQUISITION ||--o{ APPLICATION : receives
  APPLICATION ||--o{ APPLICATION_TIMELINE : tracks
  APPLICATION ||--o| COMPLIANCE_GATE_DECISION : decides

  TALENT_POOL_CANDIDATE ||--o{ DEPLOYMENT_ASSIGNMENT : assigned_to
  DEPLOYMENT_ASSIGNMENT ||--o{ DEPLOYMENT_NOTIFICATION_EVENT : emits
```

## Mapping to current mock data
- `ACCOUNT`: `src/lib/mockAuthStore.js`
- `APPLICATION` and `JOB_REQUISITION`: `src/context/RecruitmentDataContext.jsx`, `src/lib/recruitmentMockData.js`
- `TALENT_POOL_CANDIDATE`: `src/context/TalentPoolContext.jsx`, `src/lib/talentPoolSchemas.js`
- `DEPLOYMENT_ASSIGNMENT`: `src/context/AdminWorkforceContext.jsx`, `src/lib/adminWorkforceMockData.js`
- `EMPLOYEE_FILE`: `src/context/DigitalFilesContext.jsx`, `src/lib/digitalFilesMockData.js`
- `ADMIN_AUDIT_EVENT`: `src/context/AdminDataContext.jsx`, `src/lib/adminMockData.js`

## Operational ownership (flowchart alignment)
- `Recruiter` (display label: `Talent Acquisition`) owns AI-ranked review, requisition alignment checks, talent-pool search/re-evaluation, analytics/audit reporting, and the 7-day compliance & interview gate.
- `DeploymentManager` owns active deployment monitoring, employee deployment status updates, Digital 201 vault operations, expiration alerts, and compliance notifications.
- `Administrator` owns staff account management, work-privilege assignment, recruitment & AI policy controls, usage history oversight, and system cleanup/data backup workflows.
