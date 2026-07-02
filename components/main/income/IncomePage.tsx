"use client";

import { useEffect } from "react";
import { Calendar } from "primereact/calendar";
import { addLocale } from "primereact/api";
import { useTimeclock } from "@/lib/hooks/useTimeclock";

addLocale("es", {
  firstDayOfWeek: 1,
  dayNames: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
  dayNamesShort: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
  dayNamesMin: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"],
  monthNames: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  monthNamesShort: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
  today: "Hoy",
  clear: "Limpiar",
});

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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
  const { fromDate, setFromDate, toDate, setToDate, groups, loading, error, search, today } = useTimeclock();

  useEffect(() => { search(); }, []);

  const totalRecords = groups.reduce((acc, g) => acc + g.records.length, 0);

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
            <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Consultá tus fichadas de entrada y salida</small>
          </div>
        </div>
      </div>

      {/* Filter card */}
      <div className="card profile-card mt-4">
        <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
          <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <i className="pi pi-search" style={{ color: "#3b82f6", fontSize: "1rem" }} />
          </div>
          <div className="flex-grow-1">
            <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Buscar fichadas</h5>
            <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Rango máximo entre fechas de 7 días</small>
          </div>
        </div>
        <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />
        <div className="card-body" style={{ padding: "16px 20px 20px" }}>
          <div className="d-flex flex-wrap align-items-end" style={{ gap: "12px" }}>
            <div style={{ minWidth: 180 }}>
              <label className="profile-field-label">Desde</label>
              <div className="license-filter-input-wrap">
                <i className="pi pi-calendar license-filter-icon" />
                <Calendar
                  value={fromDate ? new Date(`${fromDate}T00:00:00`) : null}
                  onChange={(e) => setFromDate(e.value ? toDateInputValue(e.value as Date) : "")}
                  dateFormat="dd/mm/yy"
                  locale="es"
                  showButtonBar
                  maxDate={new Date(`${today}T00:00:00`)}
                  placeholder="Desde"
                  className="license-filter-dropdown"
                  panelClassName="license-filter-dropdown-panel license-filter-calendar-panel"
                />
              </div>
            </div>
            <div style={{ minWidth: 180 }}>
              <label className="profile-field-label">Hasta</label>
              <div className="license-filter-input-wrap">
                <i className="pi pi-calendar license-filter-icon" />
                <Calendar
                  value={toDate ? new Date(`${toDate}T00:00:00`) : null}
                  onChange={(e) => setToDate(e.value ? toDateInputValue(e.value as Date) : "")}
                  dateFormat="dd/mm/yy"
                  locale="es"
                  showButtonBar
                  disabled={!fromDate}
                  maxDate={new Date(`${today}T00:00:00`)}
                  placeholder="Hasta"
                  className="license-filter-dropdown"
                  panelClassName="license-filter-dropdown-panel license-filter-calendar-panel"
                />
              </div>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={() => search()}
              className="btn btn-primary d-flex align-items-center"
              style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem", height: 38 }}
            >
              <i className={loading ? "pi pi-spin pi-spinner" : "pi pi-search"} style={{ fontSize: "0.78rem" }} />
              {loading ? "Buscando..." : "Buscar"}
            </button>
          </div>

          {error && (
            <div className="fadeIn animated mt-3" style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(220,53,69,0.07)", border: "1px solid rgba(220,53,69,0.22)", color: "#dc3545", fontSize: "0.85rem", fontWeight: 500, display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="pi pi-exclamation-circle" style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}
        </div>
      </div>

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
