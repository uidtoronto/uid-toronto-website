/** Smooth-scroll so `el` aligns near the top of the viewport (accounts for fixed navbar). */
export function scrollToElement(
  el: HTMLElement | null,
  options?: { offset?: number; behavior?: ScrollBehavior },
) {
  if (!el) return;
  const offset = options?.offset ?? 88;
  const behavior = options?.behavior ?? 'smooth';
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, top), behavior });
}
