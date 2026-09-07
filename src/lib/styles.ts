// `outline-none` clears Tailwind's internal --tw-outline-style variable to
// "none", so it has to be set back to "solid" explicitly on focus-visible —
// outline-width/color alone don't bring the outline back. Shared by every
// interactive element on the page so nothing falls back to the browser's
// default blue outline.
export const FOCUS_RING =
  "outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]";
