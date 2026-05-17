# Framer Motion Implementation Plan

## 1. Skill Search Results & Target Skill

**Target Skill Identified:** `high-end-visual-design` 
**(Found in: `C:\Users\cnico\OneDrive\Desktop\APPLICANT\skills\high-end-visual-design\SKILL.md`)**

**Why this skill?** 
This skill explicitly defines the rules for creating "$150k+ agency-level digital experiences" using fluid dynamics and custom spring physics. It strictly prohibits standard `linear` or `ease-in-out` transitions and mandates the use of custom cubic-beziers and `transform`/`opacity` for GPU-safe, ultra-premium motion choreography. 

*Secondary relevant skills found during the scan:* `scroll-experience`, `design-spells`, `frontend-ui-dark-ts`.

---

## 2. Global Motion Guidelines (Based on Target Skill)

To elevate the ATS UI to "Awwwards-Tier", we will adopt the motion principles from the `high-end-visual-design` skill:

*   **Fluid Dynamics:** Use custom cubic-beziers (e.g., `transition: { duration: 0.7, ease: [0.32, 0.72, 0, 1] }`) or realistic spring physics for all layout changes.
*   **Performance Guardrails:** Animate *exclusively* via `transform` (x, y, scale, rotate) and `opacity`. Never animate `width`, `height`, `top`, or `left` to avoid layout reflows and dropped frames.
*   **Scroll Interpolation:** Elements should never appear statically on load. As they enter the viewport, they must execute a gentle, heavy fade-up (e.g., `translate-y-16 blur-md opacity-0` resolving to `translate-y-0 blur-0 opacity-100`).

---

## 3. Implementation Roadmap

### Phase 1: Core Layout & Route Transitions
1.  **Page Transitions:** Wrap the main React Router `Routes` inside Framer Motion's `<AnimatePresence mode="wait">`.
2.  **Page Variants:** Define a global variant for page mounting/unmounting (e.g., a soft fade-up `y: 20, opacity: 0` -> `y: 0, opacity: 1`). Apply this to the `PageFrame` component.
3.  **Navigation Sidebar:** Add spring-based animations to the sidebar expansion/collapse, ensuring the layout shift feels physical and intentional.

### Phase 2: Upgrading the Analytical Widgets (Staggered Reveals)
1.  **Dashboard Grids:** Use `variants` and `staggerChildren` on the dashboard grids so `MetricCards` cascade into view sequentially instead of popping in simultaneously.
2.  **Horizontal Bar Charts:** Upgrade the loading bars to use a highly tuned spring config (`type: "spring", stiffness: 50, damping: 20`) rather than the current standard `easeOut`.
3.  **Aging Queue Widget:** Animate list items entering and exiting the queue using `AnimatePresence`, specifically useful when filtering or marking items as "Reviewed".

### Phase 3: Haptic Micro-Interactions (The "Double-Bezel" & Magnetic Buttons)
1.  **Magnetic Button Hover Physics:** Convert primary CTA buttons into `motion.button`. On hover, scale the entire button down slightly (`scale: 0.98`) to simulate physical pressing, and translate internal icons diagonally to create kinetic tension.
2.  **Interactive Cards:** Apply subtle lift effects (`y: -2`) and enhanced shadow interpolation on hover for job listings and candidate cards.
3.  **Modal Expansions:** For candidate review dialogs or 201 File previews, implement a heavy glass effect (`backdrop-blur-3xl`) with a scaling reveal from the point of origin.

---

## 4. Execution Protocol

1.  **Setup:** Ensure `framer-motion` is installed (already verified in `package.json`).
2.  **Shared Configuration:** Create a `src/lib/motionConfig.js` file to store reusable variants, spring configurations, and custom easing curves defined by the `high-end-visual-design` skill.
3.  **Iterative Rollout:** 
    *   Start with `App.jsx` and `PageFrame.jsx` for routing.
    *   Move to `MetricCard`, `HorizontalBarChart`, and `AgingQueueWidget`.
    *   Finish with buttons, modals, and list items.
