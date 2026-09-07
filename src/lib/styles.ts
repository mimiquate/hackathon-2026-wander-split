// `outline-none` clears Tailwind's internal --tw-outline-style variable to
// "none", so it has to be set back to "solid" explicitly on focus-visible —
// outline-width/color alone don't bring the outline back. Shared by every
// interactive element on the page so nothing falls back to the browser's
// default blue outline.
export const FOCUS_RING =
  "outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]";

// For a control whose focus ring has to render on a wrapper around the
// focusable element (e.g. Input's pill, where the ring belongs to the whole
// field, not just the <input>) rather than as an outline on the element
// itself — same terracota ring, expressed as an inset box-shadow via
// :focus-within instead.
export const FOCUS_RING_INSET =
  "focus-within:shadow-[inset_0_0_0_1px_var(--focus-ring),0_0_0_3px_color-mix(in_oklab,var(--focus-ring)_22%,transparent)]";
