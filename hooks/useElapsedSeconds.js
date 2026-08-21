import { useEffect, useRef, useState } from "react";

// Counts seconds since `active` became true. Resets to 0 when inactive.
export function useElapsedSeconds(active) {
  const [seconds, setSeconds] = useState(0);
  const activeRef = useRef(active);
  const startRef = useRef(null);

  useEffect(() => {
    activeRef.current = active;
    startRef.current = active ? Date.now() : null;
  }, [active]);

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds(
        activeRef.current ? Math.floor((Date.now() - startRef.current) / 1000) : 0
      );
    }, 1000);

    return () => clearInterval(id);
  }, []);

  return active ? seconds : 0;
}
