"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { Toast, type ToastMessage, type ToastProps } from "primereact/toast";

interface SeverityMeta {
  icon: string;
  color: string;
  bg: string;
}

const SEVERITY_META: Record<string, SeverityMeta> = {
  success: { icon: "pi-check-circle", color: "#059669", bg: "#f0fdf4" },
  info: { icon: "pi-info-circle", color: "#3b82f6", bg: "#eff6ff" },
  warn: { icon: "pi-exclamation-triangle", color: "#b45309", bg: "#fffbeb" },
  error: { icon: "pi-times-circle", color: "#dc3545", bg: "#fff1f2" },
  secondary: { icon: "pi-info-circle", color: "#64748b", bg: "#f8fafc" },
  contrast: { icon: "pi-info-circle", color: "#1e293b", bg: "#f1f5f9" },
};

function ToastCard({ message, toastRef }: { message: ToastMessage; toastRef: React.RefObject<Toast | null> }) {
  const meta = SEVERITY_META[message.severity ?? "info"] ?? SEVERITY_META.info;
  const life = message.sticky ? 0 : (message.life ?? 3000);

  const [paused, setPaused] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remainingRef = useRef(life);
  const lastStartRef = useRef(0);

  function close() {
    toastRef.current?.remove(message);
  }

  useEffect(() => {
    if (!life) return;
    lastStartRef.current = Date.now();
    timeoutRef.current = setTimeout(close, remainingRef.current);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleMouseEnter() {
    if (!life) return;
    setPaused(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - lastStartRef.current));
  }

  function handleMouseLeave() {
    if (!life) return;
    setPaused(false);
    lastStartRef.current = Date.now();
    timeoutRef.current = setTimeout(close, remainingRef.current);
  }

  return (
    <div className="app-toast-card" style={{ background: meta.bg }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div className="app-toast-icon" style={{ color: meta.color }}>
        <i className={`pi ${meta.icon}`} />
      </div>
      <div className="app-toast-body">
        {message.summary && <p className="app-toast-summary">{message.summary}</p>}
        {message.detail && <p className="app-toast-detail">{message.detail}</p>}
      </div>
      <button type="button" className="app-toast-close" onClick={close} aria-label="Cerrar">
        <i className="pi pi-times" />
      </button>
      {!!life && (
        <div className="app-toast-progress-track">
          <div
            className="app-toast-progress-bar"
            style={{
              background: meta.color,
              animationDuration: `${life}ms`,
              animationPlayState: paused ? "paused" : "running",
            }}
          />
        </div>
      )}
    </div>
  );
}

const AppToast = forwardRef<Toast, ToastProps>(function AppToast(props, ref) {
  const innerRef = useRef<Toast>(null);

  return (
    <Toast
      ref={(instance) => {
        innerRef.current = instance;
        if (typeof ref === "function") ref(instance);
        else if (ref) ref.current = instance;
      }}
      {...props}
      content={(contentProps: { message: ToastMessage }) => <ToastCard message={contentProps.message} toastRef={innerRef} />}
    />
  );
});

export default AppToast;