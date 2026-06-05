import { useEffect } from "react";

export interface ToastData {
  id: number;
  title: string;
  body?: string;
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: number) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 6000);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  return (
    <div
      className="border-border-strong bg-elevated min-w-64 rounded-md border px-4 py-3 shadow-lg"
      style={{ animation: "slideIn 0.2s ease-out" }}
      role="status"
    >
      <div className="text-sm font-medium">{toast.title}</div>
      {toast.body && (
        <div className="text-text-muted text-xs">{toast.body}</div>
      )}
    </div>
  );
}

export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastData[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="fixed right-4 bottom-4 flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
