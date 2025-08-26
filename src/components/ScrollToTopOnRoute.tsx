import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const ScrollToTopOnRoute = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Only reset scroll when navigating to a new route without an anchor
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [pathname, hash]);

  return null;
};
