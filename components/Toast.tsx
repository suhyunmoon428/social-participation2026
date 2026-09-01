"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastTone = "info" | "success" | "error";
type ToastItem = { id: number; message: string; tone: ToastTone };

const ToastContext = createContext<{
  show: (message: string, tone?: ToastTone) => void;
}>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, tone: ToastTone = "info") => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => setItems((prev) => prev.filter((item) => item.id !== id)), 3600);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 flex w-[min(92vw,420px)] -translate-x-1/2 flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={[
              "pointer-events-auto rounded-lg px-4 py-3 text-sm shadow-lg transition",
              item.tone === "error"
                ? "bg-ink-900 text-white"
                : item.tone === "success"
                ? "bg-ink-800 text-white"
                : "bg-white text-ink-700 ring-1 ring-ink-200",
            ].join(" ")}
            role="status"
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
