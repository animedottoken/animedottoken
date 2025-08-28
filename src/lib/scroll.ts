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
  const retries = opts.retries ?? 12; // Increased retries
  const delayMs = opts.delayMs ?? 150; // Slightly longer delay

  const attempt = (remaining: number) => {
    const el = findTarget(id);
    if (el) {
      updateHash(id);
      
      // Get the current scroll position for comparison
      const initialScrollY = window.scrollY;
      
      el.scrollIntoView({ behavior, block });
      
      // Enhanced stabilization with better timing
      const stabilize = () => {
        let stableCount = 0;
        const maxStabilizeAttempts = 30; // Increased attempts
        let attempts = 0;
        
        const checkStability = () => {
          attempts++;
          const currentEl = findTarget(id);
          if (!currentEl) return;
          
          const rect = currentEl.getBoundingClientRect();
          const expectedTop = 0; // Should align to top with scroll-margin-top
          const tolerance = 5; // Tighter tolerance
          
          if (Math.abs(rect.top - expectedTop) <= tolerance) {
            stableCount++;
            // Need 3 consecutive stable readings
            if (stableCount >= 3) {
              return; // Stable, we're done
            }
          } else {
            stableCount = 0;
            // Re-scroll with more precise positioning
            currentEl.scrollIntoView({ behavior: "smooth", block: "start" });
          }
          
          if (attempts < maxStabilizeAttempts) {
            requestAnimationFrame(checkStability);
          }
        };
        
        // Wait longer for initial scroll to complete before stabilizing
        setTimeout(() => requestAnimationFrame(checkStability), 200);
      };
      
      stabilize();
      return;
    }
    
    if (remaining <= 0) {
      console.warn(`Could not find element with id: ${id}`);
      return;
    }
    
    setTimeout(() => attempt(remaining - 1), delayMs);
  };

  attempt(retries);
}
