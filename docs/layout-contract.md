# Layout Contract

This shell uses one alignment contract across roles and pages.

- Shell grid: `Sidebar (w-80 = 320px fixed)` + `Content area (flex-1 min-w-0)`.
- Global gutters: `px-4 sm:px-6 lg:px-8` are applied by `ShellContainer` for navbar and main content.
- One left edge rule: Navbar content and page content must start from the same `ShellContainer` gutter.
- Page widths are explicit via `PageFrame size`:
  - `wide` -> `--layout-max-wide` (operational dashboards/tables)
  - `standard` -> `--layout-max-standard` (default)
  - `narrow` -> `--layout-max-narrow` (long forms/profile edit)
- Vertical rhythm:
  - Page sections: `space-y-6`
  - Card/content padding: `p-6 sm:p-8`
- Layout anti-drift rule:
  - Do not add ad-hoc `mx-auto max-w-*` in shell/layout files.
  - Width belongs to page layer (`PageFrame`), not shell layer (`AppLayout/AdminLayout/JobsLayout`).
