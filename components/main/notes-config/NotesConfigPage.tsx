"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { Dropdown } from "primereact/dropdown";
import { getNotesConfig, setNotesConfig, getNotes } from "@/lib/services/notes.service";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const TYPES = ["featured", "order1", "order2"] as const;
type ConfigType = typeof TYPES[number];

const TYPE_LABELS: Record<string, string> = {
  featured: "1ra Nota Principal",
  order1: "2da Nota Principal",
  order2: "3ra Nota Principal",
};

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  featured: { bg: "#dcfce7", color: "#059669" },
  order1: { bg: "#eff6ff", color: "#3b82f6" },
  order2: { bg: "#e0f2fe", color: "#0284c7" },
};

const POSITION_OPTIONS = [
  { label: "-- Sin asignar --", value: "" },
  { label: "1ra Nota Principal", value: "featured" },
  { label: "2da Nota Principal", value: "order1" },
  { label: "3ra Nota Principal", value: "order2" },
];

interface ConfigEntry { type: ConfigType; note_id: number | null; }

function initConfigs(): ConfigEntry[] {
  return TYPES.map((t) => ({ type: t, note_id: null }));
}

function SkeletonRows() {
  return (
    <div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="d-flex align-items-center" style={{ gap: "14px", border: "1.5px solid #e2e8f0", borderRadius: "12px", padding: "12px 16px", marginBottom: "10px" }}>
          <div style={{ width: 64, height: 64, borderRadius: 8, flexShrink: 0, background: "linear-gradient(90deg, #e8ecf0 25%, #f1f5f9 50%, #e8ecf0 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.4s infinite" }} />
          <div style={{ flex: 1 }}>
            <div style={{ width: "50%", height: 14, borderRadius: 6, marginBottom: 8, background: "linear-gradient(90deg, #e8ecf0 25%, #f1f5f9 50%, #e8ecf0 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.4s infinite" }} />
            <div style={{ width: "80%", height: 12, borderRadius: 6, background: "linear-gradient(90deg, #e8ecf0 25%, #f1f5f9 50%, #e8ecf0 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.4s infinite" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function NotesConfigPage() {
  const toast = useRef<Toast>(null);
  const [config, setConfig] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [configs, setConfigs] = useState<ConfigEntry[]>(initConfigs());
  const [isLoadConfig, setIsLoadConfig] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isSetConfig, setIsSetConfig] = useState(false);
  const [searchTitle, setSearchTitle] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [filters, setFilters] = useState({ page: 1, per_page: 9, title: "" });

  useEffect(() => {
    loadConfigNotes();
  }, []);

  useEffect(() => {
    chargeNotes(filters);
  }, [filters]);

  async function loadConfigNotes() {
    if (isLoadConfig) return;
    setIsLoadConfig(true);
    try {
      const resp = await getNotesConfig();
      const arr: any[] = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []);
      setConfig(arr);
      setConfigs((prev) => {
        const next = [...prev];
        arr.forEach((item: any) => {
          const idx = next.findIndex((c) => c.type === item.type);
          if (idx !== -1) next[idx] = { ...next[idx], note_id: item.note_id };
        });
        return next;
      });
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo cargar la configuración de notas" });
    } finally {
      setIsLoadConfig(false);
      chargeNotes(filters);
    }
  }

  async function chargeNotes(f: typeof filters) {
    setIsLoadingNotes(true);
    try {
      const resp = await getNotes(f.page, f.per_page, f.title);
      setNotes(resp.data ?? []);
    } catch {
      setNotes([]);
      toast.current?.show({ severity: "error", summary: "No se pudieron cargar las notas" });
    } finally {
      setIsLoadingNotes(false);
    }
  }

  function onSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSearchTitle(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters((p) => ({ ...p, title: val, page: 1 }));
    }, 1000);
  }

  function getConfigTypeForNote(noteId: number): string {
    const found = configs.find((c) => c.note_id === noteId);
    return found ? found.type : "";
  }

  function updateConfigForNote(noteId: number, selectedType: string) {
    setConfigs((prev) => {
      const next = prev.map((c) => c.note_id === noteId ? { ...c, note_id: null } : c);
      if (selectedType) {
        const idx = next.findIndex((c) => c.type === selectedType);
        if (idx !== -1) next[idx] = { ...next[idx], note_id: noteId };
      }
      return next;
    });
  }

  const missingLabels = configs.filter((c) => !c.note_id).map((c) => TYPE_LABELS[c.type] ?? c.type);

  function saveConfigs() {
    if (isSetConfig || missingLabels.length > 0) return;

    setIsSetConfig(true);
    setNotesConfig({ configs })
      .then(() => {
        toast.current?.show({ severity: "success", summary: "Configuración guardada" });
        loadConfigNotes();
      })
      .catch(() => toast.current?.show({ severity: "error", summary: "No se pudo guardar la nueva configuración" }))
      .finally(() => setIsSetConfig(false));
  }

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />

      <div className="fadeIn animated">

        {/* Header card */}
        <div className="card profile-card">
          <div className="d-flex align-items-center px-3 pt-3 pb-3" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-star" style={{ color: "#eab308", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Configuración de notas</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Elegí qué notas se destacan en el sitio institucional</small>
            </div>
            <button
              type="button"
              disabled={isLoadConfig}
              onClick={loadConfigNotes}
              className="btn btn-light d-flex align-items-center"
              style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.82rem", padding: "5px 14px", color: "#64748b" }}
            >
              <i className={isLoadConfig ? "pi pi-spin pi-spinner" : "pi pi-refresh"} style={{ fontSize: "0.78rem" }} />
              Recargar
            </button>
          </div>
        </div>

        {/* Current config card */}
        {config.length > 0 && (
          <div className="card profile-card mt-4">
            <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
              <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <i className="pi pi-star-fill" style={{ color: "#eab308", fontSize: "1rem" }} />
              </div>
              <div className="flex-grow-1">
                <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Listado de notas principales</h5>
                <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{config.length} de {TYPES.length} posiciones asignadas</small>
              </div>
            </div>
            <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />

            <div className="card-body" style={{ padding: "16px 20px 20px", position: "relative" }}>
              {[...config].sort((a, b) => TYPES.indexOf(a.type) - TYPES.indexOf(b.type)).map((item, i) => {
                const tc = TYPE_COLORS[item.type] ?? { bg: "#f1f5f9", color: "#64748b" };
                return (
                  <div
                    key={i}
                    className="d-flex align-items-center"
                    style={{ border: "1.5px solid #e2e8f0", borderRadius: "12px", padding: "12px 16px", marginBottom: i < config.length - 1 ? "10px" : 0, gap: "12px" }}
                  >
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <p className="mb-1 font-weight-bold" style={{ fontSize: "0.88rem", color: "#1e293b" }}>{item.note?.title}</p>
                      <p className="mb-0" style={{ fontSize: "0.78rem", color: "#64748b" }}>{item.note?.subtitle}</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <span style={{ display: "inline-block", background: tc.bg, color: tc.color, borderRadius: "20px", padding: "4px 12px", fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                        {TYPE_LABELS[item.type] ?? item.type}
                      </span>
                      <small style={{ display: "block", color: "#94a3b8", fontSize: "0.7rem", marginTop: "6px" }}>
                        Actualizada el {item.updated_at ? new Date(item.updated_at).toLocaleString("es-AR") : "-"}
                      </small>
                    </div>
                  </div>
                );
              })}

              {isSetConfig && (
                <div
                  className="d-flex flex-column align-items-center justify-content-center animated fadeIn"
                  style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.85)", borderRadius: "0 0 12px 12px", zIndex: 10 }}
                >
                  <i className="pi pi-spin pi-spinner" style={{ fontSize: "2rem", color: "#4a6cf7" }} />
                  <p className="mt-3 mb-0 font-weight-bold" style={{ color: "#4a6cf7", fontSize: "0.9rem" }}>Guardando configuración...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search notes card */}
        <div className="card profile-card mt-4">
          <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-search" style={{ color: "#eab308", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Buscar notas</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Asigná una posición a cada nota</small>
            </div>
            <button
              type="button"
              disabled={missingLabels.length > 0 || isSetConfig}
              onClick={saveConfigs}
              title={missingLabels.length > 0 ? `Falta asignar: ${missingLabels.join(", ")}` : undefined}
              className="btn btn-primary d-flex align-items-center"
              style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.82rem", padding: "5px 14px", flexShrink: 0 }}
            >
              <i className={isSetConfig ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
              {isSetConfig ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
          <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />

          <div className="card-body" style={{ padding: "16px 20px 20px" }}>
            {missingLabels.length > 0 && (
              <div className="d-flex align-items-center mb-3" style={{ gap: "8px", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "8px", padding: "8px 12px" }}>
                <i className="pi pi-exclamation-triangle" style={{ color: "#ea580c", fontSize: "0.85rem", flexShrink: 0 }} />
                <small style={{ color: "#9a3412", fontSize: "0.78rem" }}>
                  Para guardar, asigná: <strong>{missingLabels.join(", ")}</strong>
                </small>
              </div>
            )}

            <div className={`license-filter-input-wrap mb-3${searchTitle ? " license-filter-input-wrap--active" : ""}`}>
              <i className="pi pi-search license-filter-icon" />
              <input
                className="license-filter-input"
                style={{ paddingLeft: "32px" }}
                disabled={isLoadingNotes || isLoadConfig}
                placeholder="Buscar nota por título…"
                value={searchTitle}
                onChange={onSearchChange}
                autoComplete="off"
              />
            </div>

            {isLoadingNotes && <SkeletonRows />}

            {!isLoadingNotes && notes.length > 0 && (
              <div className="fadeIn animated">
                {notes.map((note) => (
                  <div key={note.id} className="d-flex align-items-center" style={{ border: "1.5px solid #e2e8f0", borderRadius: "12px", padding: "12px 16px", marginBottom: "10px", gap: "14px" }}>
                    {note.images?.[0]?.path_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`${API_URL}${note.images[0].path_url}`}
                        alt=""
                        style={{ width: 64, height: 64, objectFit: "cover", borderRadius: "8px", flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{ width: 64, height: 64, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <i className="pi pi-image" style={{ color: "#cbd5e1", fontSize: "1.3rem" }} />
                      </div>
                    )}
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <p className="mb-1 font-weight-bold" style={{ fontSize: "0.88rem", color: "#1e293b" }}>{note.title}</p>
                      <p className="mb-1" style={{ fontSize: "0.78rem", color: "#64748b" }}>{note.subtitle}</p>
                      <small style={{ color: "#94a3b8", fontSize: "0.7rem" }}>
                        Creado el {note.created_at ? new Date(note.created_at).toLocaleDateString("es-AR") : "-"}
                      </small>
                    </div>
                    <div style={{ width: 190, flexShrink: 0 }}>
                      <Dropdown
                        value={getConfigTypeForNote(note.id)}
                        options={POSITION_OPTIONS}
                        optionLabel="label"
                        optionValue="value"
                        disabled={isSetConfig}
                        onChange={(e) => updateConfigForNote(note.id, e.value ?? "")}
                        className="profile-dropdown"
                        panelClassName="license-filter-dropdown-panel"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isLoadingNotes && !isLoadConfig && notes.length === 0 && (
              <div style={{ padding: "40px", textAlign: "center" }}>
                <i className="pi pi-inbox" style={{ fontSize: "2rem", color: "#cbd5e1", display: "block", marginBottom: "8px" }} />
                <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: 0 }}>
                  {searchTitle.trim() ? `No se encontraron notas con el título "${searchTitle}".` : "No hay notas para mostrar."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
