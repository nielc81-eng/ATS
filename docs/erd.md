# ERD (Conceptual Data Model)

This project is currently a React-only UI with mock data stored in-memory / `localStorage` (see `src/lib/*MockData.js` and `src/lib/mockAuthStore.js`). This ERD documents a reasonable relational model you can use if/when you add a backend database.

```mermaid
erDiagram
  ACCOUNT {
    string id PK
    string name
    string email UK
    string password_hash
    string role  "Candidate|Recruiter|Admin"
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

  JOB_REQUISITION {
    string id PK
    string title
    string department
    string description
    int applicants_count
    date posted_on
    string created_by_account_id FK
    datetime created_at
  }

  SKILL {
    string id PK
    string name UK
  }

  JOB_SKILL_REQUIREMENT {
    string id PK
    string job_id FK
    string skill_id FK
    string kind "must_have|nice_to_have"
  }

  APPLICATION {
    string id PK
    string job_id FK
    string candidate_profile_id FK
    string applicant_label "e.g., Applicant #402"
    int score
    string stage "intake|blind_screen|hm_review|interview|offer|rejected|hired"
    datetime created_at
  }

  CANDIDATE_SKILL {
    string id PK
    string candidate_profile_id FK
    string skill_id FK
  }

  MATCH_SIGNAL {
    string id PK
    string application_id FK
    string message
  }

  JOB_ANALYTICS_SNAPSHOT {
    string id PK
    string job_id FK
    int shortlisted
    int time_to_fill_days
    int screening_days
    int interview_days
    int offer_days
    datetime created_at
  }

  JOB_ANALYTICS_ROW {
    string id PK
    string snapshot_id FK
    string stage
    int candidates
    string avg_match "e.g., 84%"
    string cycle_day "e.g., Day 2-3"
    string note
  }

  EMPLOYEE {
    string id PK
    string employee_id UK "e.g., EMP-1001"
    string name
    string department
    datetime created_at
  }

  EMPLOYEE_FILE {
    string id PK
    string employee_id FK
    string file_name
    string file_type
    string status "Pending Review|Approved|Needs Action|Archived"
    date uploaded_on
    date last_reviewed_on
    string reviewer_account_id FK
    string size_label "e.g., 2.4 MB"
    string notes
    string review_summary
    datetime created_at
  }

  FILE_TAG {
    string id PK
    string name UK
  }

  EMPLOYEE_FILE_TAG {
    string file_id FK
    string tag_id FK
  }

  FILE_DOCUMENT_ITEM {
    string id PK
    string file_id FK
    string label "e.g., Government ID"
  }

  ACCOUNT ||--o| CANDIDATE_PROFILE : has
  ACCOUNT ||--o| RECRUITER_PROFILE : has
  ACCOUNT ||--o{ JOB_REQUISITION : creates

  JOB_REQUISITION ||--o{ JOB_SKILL_REQUIREMENT : requires
  SKILL ||--o{ JOB_SKILL_REQUIREMENT : listed

  CANDIDATE_PROFILE ||--o{ APPLICATION : submits
  JOB_REQUISITION ||--o{ APPLICATION : receives

  APPLICATION ||--o{ MATCH_SIGNAL : explains

  CANDIDATE_PROFILE ||--o{ CANDIDATE_SKILL : lists
  SKILL ||--o{ CANDIDATE_SKILL : known

  JOB_REQUISITION ||--o{ JOB_ANALYTICS_SNAPSHOT : measures
  JOB_ANALYTICS_SNAPSHOT ||--o{ JOB_ANALYTICS_ROW : breaks_down

  EMPLOYEE ||--o{ EMPLOYEE_FILE : owns
  ACCOUNT ||--o{ EMPLOYEE_FILE : reviews

  EMPLOYEE_FILE ||--o{ EMPLOYEE_FILE_TAG : tagged_by
  FILE_TAG ||--o{ EMPLOYEE_FILE_TAG : applied_to

  EMPLOYEE_FILE ||--o{ FILE_DOCUMENT_ITEM : contains
```

**Mapping to current UI mock data**
- `ACCOUNT` comes from `src/lib/mockAuthStore.js` (currently plaintext passwords in `localStorage` for demo only).
- `JOB_REQUISITION`, `JOB_ANALYTICS_*`, and job-local candidate data comes from `src/lib/recruitmentMockData.js`.
- `EMPLOYEE` and `EMPLOYEE_FILE` come from `src/lib/digitalFilesMockData.js` (the “201 File” screens).

