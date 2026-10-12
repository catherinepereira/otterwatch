import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useCams } from "../stores/cams";

// Re-fetch the cams so their heartbeat (last_frame_at) stays current. A poll costs no
// Realtime messages, and the heartbeat only changes once a minute anyway
const POLL_MS = 60_000;

export function useCamsPolling(): void {
  const setCams = useCams((s) => s.setCams);

  useEffect(() => {
    let active = true;
    const load = () =>
      supabase
        .from("cams")
        .select("*")
        .eq("enabled", true)
        .order("id")
        .then(({ data }) => {
          if (active && data) setCams(data);
        });

    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [setCams]);
}
