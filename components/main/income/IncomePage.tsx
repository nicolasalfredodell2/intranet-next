"use client";

import { useEffect, useState } from "react";
import { useTimeclock } from "@/lib/hooks/useTimeclock";
import { loadDailyPart } from "@/lib/services/daily-part.service";
import TimeclockTimelineChart from "./TimeclockTimelineChart";

function subtractDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function formatGroupTitle(dateStr: string): string {
  try {
    const date = new Date(`${dateStr}T00:00:00`);
    const formatted = date.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch {
    return dateStr;
  }
}

function SkeletonBlocks() {
  return (
    <div style={{ padding: "4px 0 8px" }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={{ marginBottom: 16 }}>
          <div style={{ width: "35%", height: 12, borderRadius: 6, marginBottom: 8, background: "linear-gradient(90deg, #e8ecf0 25%, #f1f5f9 50%, #e8ecf0 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.4s infinite" }} />
          {Array.from({ length: 2 }).map((_, j) => (
            <div key={j} style={{ height: 44, borderRadius: 10, marginBottom: 6, background: "linear-gradient(90deg, #e8ecf0 25%, #f1f5f9 50%, #e8ecf0 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.4s infinite" }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function IncomePage() {
  const { groups, loading, error, search, today } = useTimeclock();
  const [workingHours, setWorkingHours] = useState<{ in: string; out: string } | null>(null);

  function loadWorkingHours() {
    loadDailyPart({ user_authenticated: true })
      .then((resp) => {
        const row = Object.values(resp[0])[0] as any;
        if (row?.working?.hour_in && row?.working?.hour_out) {
          setWorkingHours({ in: row.working.hour_in, out: row.working.hour_out });
        }
      })
      .catch(() => {});
  }

  function reload() {
    search(subtractDays(today, 6), today);
    loadWorkingHours();
  }

  useEffect(() => { reload(); }, []);

  return (
    <div className="fadeIn animated">

      {/* Header card */}
      <div className="card profile-card">
        <div className="d-flex align-items-center px-3 pt-3 pb-3" style={{ gap: "12px" }}>
          <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <i className="pi pi-history" style={{ color: "#059669", fontSize: "1rem" }} />
          </div>
          <div className="flex-grow-1">
            <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Fichadas Diarias</h5>
            <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Tus fichadas de entrada y salida de los últimos 7 días</small>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={reload}
            className="btn btn-light d-flex align-items-center"
            style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.82rem", padding: "5px 14px", color: "#64748b" }}
          >
            <i className={loading ? "pi pi-spin pi-spinner" : "pi pi-refresh"} style={{ fontSize: "0.78rem" }} />
            Recargar
          </button>
        </div>
      </div>

      {error && (
        <div className="fadeIn animated mt-4" style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(220,53,69,0.07)", border: "1px solid rgba(220,53,69,0.22)", color: "#dc3545", fontSize: "0.85rem", fontWeight: 500, display: "flex", alignItems: "center", gap: "8px" }}>
          <i className="pi pi-exclamation-circle" style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      {loading && (
        <div className="card profile-card mt-4">
          <div className="card-body" style={{ padding: "16px 20px 20px" }}>
            <SkeletonBlocks />
          </div>
        </div>
      )}

      {/* Workday timeline chart */}
      {!loading && <TimeclockTimelineChart groups={groups} workingHours={workingHours} />}

      {/* One card per date */}
      {!loading && groups.map((group) => (
        <div key={group.date} className="card profile-card mt-4 fadeIn animated">
          <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-calendar" style={{ color: "#3b82f6", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>{formatGroupTitle(group.date)}</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                {group.records.length} {group.records.length === 1 ? "fichada" : "fichadas"}
              </small>
            </div>
          </div>
          <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />
          <div className="card-body" style={{ padding: "16px 20px 20px" }}>
            <div className="d-flex flex-column" style={{ gap: "6px" }}>
              {group.records.map((r) => (
                <div
                  key={r.id}
                  className="d-flex align-items-center"
                  style={{
                    gap: "10px",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    background: r.isEntry ? "rgba(5,150,105,0.07)" : "rgba(220,53,69,0.06)",
                    border: `1px solid ${r.isEntry ? "rgba(5,150,105,0.18)" : "rgba(220,53,69,0.15)"}`,
                  }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: r.isEntry ? "rgba(5,150,105,0.15)" : "rgba(220,53,69,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <i className={`pi ${r.isEntry ? "pi-arrow-down" : "pi-arrow-up"}`} style={{ color: r.isEntry ? "#059669" : "#dc3545", fontSize: "0.78rem" }} />
                  </div>
                  <div className="flex-grow-1" style={{ minWidth: 0 }}>
                    <p className="mb-0" style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>{r.title}</p>
                    <small style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{r.hostLabel}</small>
                  </div>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: r.isEntry ? "#059669" : "#dc3545", whiteSpace: "nowrap" }}>
                    {r.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
