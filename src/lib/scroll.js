export function scrollToTop() {
  if (typeof window === "undefined" || typeof window.scrollTo !== "function") return;
  window.scrollTo(0, 0);
}
