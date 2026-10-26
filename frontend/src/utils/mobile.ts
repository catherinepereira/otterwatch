// below Tailwind's md breakpoint, read once at mount
export function isMobile(): boolean {
  return window.matchMedia("(max-width: 767px)").matches;
}
