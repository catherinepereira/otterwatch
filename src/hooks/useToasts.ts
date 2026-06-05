import { useCallback, useRef, useState } from "react";
import type { ToastData } from "../components/Toast";

// Manages the transient in-app toast stack. Browser Notifications are fired separately
// by the caller, gated on the per-cam notification preference
export function useToasts() {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((title: string, body?: string) => {
    const id = nextId.current++;
    setToasts((ts) => [...ts, { id, title, body }]);
  }, []);

  return { toasts, push, dismiss };
}
