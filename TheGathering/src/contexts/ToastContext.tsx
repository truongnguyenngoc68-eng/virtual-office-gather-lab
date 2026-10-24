import * as React from "react";

type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
}

interface ToastInternal extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  showToast: (
    message: string,
    options?: Omit<ToastOptions, "description">
  ) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(
  undefined
);

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

let idCounter = 1;

export function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = React.useState<ToastInternal[]>([]);

  const showToast = React.useCallback(
    (message: string, options?: Omit<ToastOptions, "description">) => {
      const id = idCounter++;
      const next: ToastInternal = {
        id,
        title: options?.title,
        description: message,
        variant: options?.variant || "info",
        durationMs: options?.durationMs ?? 3500,
      };
      setToasts((prev) => [...prev, next]);

      if (next.durationMs && next.durationMs > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, next.durationMs);
      }
    },
    []
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed inset-x-0 top-4 flex justify-center pointer-events-none z-[9999]">
        <div className="w-full max-w-md space-y-2 px-4">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-2xl px-4 py-3 text-sm shadow-lg border backdrop-blur bg-slate-900/90 ${
                toast.variant === "success"
                  ? "border-emerald-500/40 text-emerald-50"
                  : toast.variant === "error"
                  ? "border-rose-500/40 text-rose-50"
                  : toast.variant === "warning"
                  ? "border-amber-500/40 text-amber-50"
                  : "border-slate-700/60 text-slate-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-current" />
                <div className="flex-1 min-w-0">
                  {toast.title && (
                    <div className="font-semibold truncate">{toast.title}</div>
                  )}
                  {toast.description && (
                    <div className="text-xs text-slate-100/90 break-words">
                      {toast.description}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="ml-2 text-xs text-slate-300 hover:text-white"
                  onClick={() =>
                    setToasts((prev) => prev.filter((t) => t.id !== toast.id))
                  }
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

