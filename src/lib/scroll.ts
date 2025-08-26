// Centralized, resilient scrolling helpers
// - Uses CSS scroll-margin-top (e.g., Tailwind `scroll-mt-20`) on targets
// - Avoids manual offset math; aligns to top of section reliably
// - Retries for lazily rendered sections

export type ScrollToHashOptions = {
  behavior?: ScrollBehavior; // default: 'smooth'
  retries?: number;          // default: 8
  delayMs?: number;          // default: 100ms
  block?: ScrollLogicalPosition; // default: 'start'
};

function findTarget(idOrClass: string): HTMLElement | null {
  const id = idOrClass.replace(/^#/, "");
  const byId = document.getElementById(id);
  if (byId) return byId as HTMLElement;
  try {
    // Fallback to class selector if ID not found
    const byClass = document.querySelector(`.${id}`);
    return byClass as HTMLElement | null;
  } catch {
    return null;
  }
}

function updateHash(id: string) {
  try {
    // Keep the URL in sync without adding history entries
    history.replaceState(null, "", `#${id}`);
  } catch {
    // noop
  }
}

export function scrollToHash(hash: string, opts: ScrollToHashOptions = {}) {
  const id = hash.replace(/^#/, "");
  const behavior = opts.behavior ?? "smooth";
  const block = opts.block ?? "start";
  const retries = opts.retries ?? 8;
  const delayMs = opts.delayMs ?? 100;

  const attempt = (remaining: number) => {
    const el = findTarget(id);
    if (el) {
      updateHash(id);
      el.scrollIntoView({ behavior, block });
      return;
    }
    if (remaining <= 0) {
      // Final fallback: do nothing (avoid jumping to wrong position)
      return;
    }
    setTimeout(() => attempt(remaining - 1), delayMs);
  };

  attempt(retries);
}
