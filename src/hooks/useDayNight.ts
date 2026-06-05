import { useEffect, useState } from "react";
import { isDayInPacific } from "../utils/dayNight";

// Tracks whether it is daytime in Pacific, re-checking every minute so it flips at
// sunrise/sunset without a page reload.
export function useDayNight(): boolean {
  const [isDay, setIsDay] = useState(isDayInPacific);

  useEffect(() => {
    const id = setInterval(() => setIsDay(isDayInPacific()), 60_000);
    return () => clearInterval(id);
  }, []);

  return isDay;
}
