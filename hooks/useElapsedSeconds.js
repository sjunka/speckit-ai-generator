"use client";

import { useEffect, useState } from "react";

export function useElapsedSeconds(active) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setSeconds((current) => current + 1);
    }, 1000);

    return () => {
      clearInterval(intervalId);
      setSeconds(0);
    };
  }, [active]);

  return seconds;
}
