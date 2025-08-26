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
      
      // Stabilization loop: ensure position stability after layout changes
      const stabilize = () => {
        let consecutiveStable = 0;
        const maxAttempts = 20; // ~2 seconds max
        let attempts = 0;
        
        const checkStability = () => {
          attempts++;
          const currentEl = findTarget(id);
          if (!currentEl) return;
          
          const rect = currentEl.getBoundingClientRect();
          const targetTop = 0; // Should be at top with scroll-margin-top CSS
          const tolerance = 10; // Allow small variance
          
          if (Math.abs(rect.top - targetTop) <= tolerance) {
            consecutiveStable++;
            if (consecutiveStable >= 2) {
              // Stable for 2 frames, we're done
              return;
            }
          } else {
            consecutiveStable = 0;
            // Re-scroll if not stable
            currentEl.scrollIntoView({ behavior: "smooth", block });
          }
          
          if (attempts < maxAttempts) {
            requestAnimationFrame(checkStability);
          }
        };
        
        // Start stabilization after initial scroll settles
        setTimeout(() => requestAnimationFrame(checkStability), 100);
      };
      
      stabilize();
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
