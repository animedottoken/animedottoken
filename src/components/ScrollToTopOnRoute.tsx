import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { scrollToHash } from "@/lib/scroll";

export const ScrollToTopOnRoute = () => {
  const { pathname, hash } = useLocation();
  const isInitialMount = useRef(true);

  useEffect(() => {
    // On initial page load, always go to top regardless of hash
    if (isInitialMount.current) {
      isInitialMount.current = false;
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }

    if (hash) {
      // Only scroll to hash on navigation changes, not initial load
      scrollToHash(hash, { behavior: "smooth" });
      return;
    }
    
    // No hash: reset to top on route change
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
};
