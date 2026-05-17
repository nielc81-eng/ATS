/**
 * motionConfig.js
 * Centralized Framer Motion design tokens based on the high-end-visual-design skill.
 * All motion in the app should import from here to stay consistent.
 */

// ─── Easing Curves ───────────────────────────────────────────────────────────
// Custom cubic-bezier that simulates real-world deceleration (Apple-esque).
// NEVER use linear or ease-in-out.
export const ease = {
  out: [0.32, 0.72, 0, 1],      // Primary — fast start, smooth stop
  inOut: [0.65, 0, 0.35, 1],   // Balanced, used for modals/overlays
  spring: { type: "spring", stiffness: 300, damping: 30 },
  gentleSpring: { type: "spring", stiffness: 80, damping: 20 },
  barSpring: { type: "spring", stiffness: 180, damping: 22, mass: 0.8 },
};

// ─── Page Transition Variants ────────────────────────────────────────────────
export const pageVariants = {
  initial: { opacity: 0, y: 16, filter: "blur(4px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: ease.out },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.25, ease: ease.inOut },
  },
};

// ─── Stagger Container Variants ───────────────────────────────────────────────
// Wrap any list/grid in this variant to stagger children cascading into view.
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
};

// ─── Individual Card / Item Variants ─────────────────────────────────────────
export const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.97 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: ease.out },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.97,
    transition: { duration: 0.2 },
  },
};

// ─── List Item Variants ───────────────────────────────────────────────────────
export const listItemVariants = {
  initial: { opacity: 0, x: -12 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: ease.out },
  },
  exit: {
    opacity: 0,
    x: 12,
    transition: { duration: 0.2 },
  },
};

// ─── Hover & Tap Micro-Interactions ──────────────────────────────────────────
export const cardHover = {
  whileHover: { y: -3, scale: 1.01, transition: { duration: 0.25, ease: ease.out } },
  whileTap: { scale: 0.98 },
};

export const buttonHover = {
  whileHover: { scale: 1.03, transition: { duration: 0.2, ease: ease.out } },
  whileTap: { scale: 0.96 },
};

// ─── Section Fade-Up (Scroll Interpolation) ───────────────────────────────────
// Use whileInView to trigger as sections scroll into the viewport.
export const sectionFadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0, transition: { duration: 0.6, ease: ease.out } },
  viewport: { once: true, margin: "-80px" },
};
