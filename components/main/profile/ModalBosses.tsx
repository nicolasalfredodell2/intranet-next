"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { ProgressBar } from "primereact/progressbar";
import { getInternals } from "@/lib/services/internal.service";
import { setBosses } from "@/lib/services/perfil.service";

interface Internal {
  cuil: string;
  lastname_name: string;
  [key: string]: any;
}

interface Props {
  show: boolean;
  user: any;
  onHide: () => void;
  onBossesAssigned: (bosses: any[]) => void;
}

const SEARCH_DEBOUNCE_MS = 600;

function getInitial(name: string): string {
  return (name ?? "?")[0].toUpperCase();
}

function SkeletonList() {
  return (
    <div style={{ padding: "4px 0" }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", marginBottom: "4px" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(90deg, #e8ecf0 25%, #f1f5f9 50%, #e8ecf0 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.4s infinite", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 11, borderRadius: 4, width: "55%", marginBottom: 6, background: "linear-gradient(90deg, #e8ecf0 25%, #f1f5f9 50%, #e8ecf0 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.4s infinite" }} />
            <div style={{ height: 9, borderRadius: 4, width: "38%", background: "linear-gradient(90deg, #e8ecf0 25%, #f1f5f9 50%, #e8ecf0 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.4s infinite" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ModalBosses({ show, user, onHide, onBossesAssigned }: Props) {
  const [searchResults, setSearchResults] = useState<Internal[]>([]);
  const [selectedMap, setSelectedMap] = useState<Record<string, Internal>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [isFirstSelect, setIsFirstSelect] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!show) return;
    const bosses = user?.bosses ?? [];
    if (bosses.length === 0) {
      setIsFirstSelect(true);
      setSelectedMap({});
    } else {
      setIsFirstSelect(false);
      const map: Record<string, Internal> = {};
      bosses.forEach((b: any) => {
        const internal = b.people ?? b;
        if (internal?.cuil) map[internal.cuil] = internal;
      });
      setSelectedMap(map);
    }
    setSearchResults([]);
  }, [show]);

  const selectedItems = useMemo(() => Object.values(selectedMap), [selectedMap]);
  const selectedCuils = useMemo(() => Object.keys(selectedMap), [selectedMap]);

  function showMsg(type: "success" | "error" | "info", text: string) {
    setMsg({ type, text });
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMsg(null), 5000);
  }

  async function fetchResults(query: string) {
    setLoading(true);
    try {
      const userCuil = localStorage.getItem("user");
      const data = await getInternals(query);
      setSearchResults(data.filter((u: any) => u.cuil !== userCuil));
    } catch {
      showMsg("error", "No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) { setSearchResults([]); return; }
    debounceRef.current = setTimeout(() => fetchResults(value.trim()), SEARCH_DEBOUNCE_MS);
  }

  function toggleSelection(internal: Internal) {
    setSelectedMap((prev) => {
      const next = { ...prev };
      if (next[internal.cuil]) delete next[internal.cuil];
      else next[internal.cuil] = internal;
      return next;
    });
  }

  function dismiss(emitBosses = false) {
    if (emitBosses) onBossesAssigned(selectedItems);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearchResults([]);
    setSearch("");
    setSelectedMap({});
    setLoading(false);
    onHide();
  }

  async function handleSetBosses() {
    if (selectedCuils.length === 0) { showMsg("info", "Debe seleccionar al menos un jefe."); return; }
    setLoading(true);
    setLoadingAction(true);
    try {
      await setBosses(selectedItems);
      showMsg("success", selectedCuils.length > 1 ? "Jefes asignados." : "Jefe asignado.");
      setTimeout(() => dismiss(true), 2000);
    } catch (err: any) {
      showMsg("error", `No se pudo asignar los jefes. ${err?.message ?? ""}`);
    } finally {
      setLoading(false);
      setLoadingAction(false);
    }
  }

  const msgColors: Record<string, { bg: string; border: string; color: string; icon: string }> = {
    success: { bg: "rgba(5,150,105,0.07)", border: "rgba(5,150,105,0.25)", color: "#059669", icon: "pi-check-circle" },
    error:   { bg: "rgba(220,53,69,0.07)",  border: "rgba(220,53,69,0.25)",  color: "#dc3545", icon: "pi-times-circle" },
    info:    { bg: "rgba(74,108,247,0.07)", border: "rgba(74,108,247,0.22)", color: "#4a6cf7", icon: "pi-info-circle" },
  };

  const dialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fff4e6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-users" style={{ color: "#fd7e14", fontSize: "1rem" }} />
      </div>
      <div>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Asignar jefes</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Seleccioná quiénes aprobarán tus solicitudes de salida</small>
      </div>
    </div>
  );

  const footer = (
    <div>
      <div className="d-flex align-items-center" style={{ gap: "8px" }}>
        <button
          disabled={loading || selectedCuils.length === 0}
          type="button"
          className="btn btn-primary d-flex align-items-center"
          style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
          onClick={handleSetBosses}
        >
          <i className={loadingAction ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
          {loadingAction ? "Guardando..." : "Guardar"}
        </button>

        {!isFirstSelect && (
          <button
            disabled={loading}
            type="button"
            className="btn btn-light text-muted ml-auto"
            style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
            onClick={() => dismiss(false)}
          >
            Volver
          </button>
        )}
      </div>

      {loadingAction && (
        <ProgressBar className="animated fadeIn mt-2" mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} />
      )}
    </div>
  );

  return (
    <Dialog
      header={dialogHeader}
      visible={show}
      style={{ width: "min(560px, 92vw)" }}
      draggable={false}
      resizable={false}
      closable={false}
      dismissableMask={!isFirstSelect}
      modal
      onHide={() => dismiss(false)}
      footer={footer}
    >
      {/* First-select info banner */}
      {isFirstSelect && (
        <div
          className="animated fadeIn"
          style={{ background: "rgba(74,108,247,0.07)", border: "1px solid rgba(74,108,247,0.20)", borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", fontSize: "0.84rem", color: "#4a6cf7", fontWeight: 500 }}
        >
          <i className="pi pi-info-circle" style={{ flexShrink: 0 }} />
          Seleccioná tu jefe/s para poder continuar.
        </div>
      )}

      {/* Search */}
      <div className="bosses-search-wrap">
        <i className="pi pi-search bosses-search-icon" />
        <input
          className="profile-input"
          style={{ paddingLeft: "36px", paddingRight: search ? "40px" : "13px" }}
          placeholder="Buscar por nombre o apellido…"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          autoComplete="off"
          disabled={loading}
        />
        {search && (
          <button type="button" className="bosses-search-clear" onClick={() => handleSearchChange("")}>
            <i className="pi pi-times" style={{ fontSize: "0.72rem" }} />
          </button>
        )}
      </div>

      {/* Result list */}
      {loading ? (
        <SkeletonList />
      ) : searchResults.length === 0 ? (
        <div className="text-center py-4 animated fadeIn" style={{ color: "#94a3b8", fontSize: "0.88rem" }}>
          <i className="pi pi-search mb-2" style={{ fontSize: "1.5rem", display: "block", opacity: 0.4 }} />
          {search ? "Sin resultados para tu búsqueda." : "Escribí un nombre o apellido para buscar."}
        </div>
      ) : (
        <div style={{ maxHeight: "240px", overflowY: "auto", padding: "4px 2px" }}>
          {searchResults.map((internal) => {
            const isSelected = selectedCuils.includes(internal.cuil);
            return (
              <div
                key={internal.cuil}
                className={`bosses-modal-item${isSelected ? " bosses-modal-item--selected" : ""}`}
                onClick={() => toggleSelection(internal)}
              >
                {/* Avatar initial */}
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: isSelected ? "rgba(74,108,247,0.15)" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.78rem", fontWeight: 700, color: isSelected ? "#4a6cf7" : "#64748b", transition: "background 0.15s, color 0.15s" }}>
                  {getInitial(internal.lastname_name)}
                </div>
                {/* Info */}
                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                  <p className="mb-0" style={{ fontSize: "0.87rem", fontWeight: isSelected ? 600 : 400, color: isSelected ? "#1e293b" : "#374151", lineHeight: 1.3 }}>
                    {internal.lastname_name}
                  </p>
                  <small style={{ fontSize: "0.73rem", color: "#94a3b8" }}>
                    {internal.occupation_signature ?? "Sin función"}
                  </small>
                </div>
                {/* Check */}
                <i
                  className={`pi pi-check-circle${isSelected ? " animated fadeIn" : ""}`}
                  style={{ color: isSelected ? "#4a6cf7" : "transparent", fontSize: "1rem", flexShrink: 0, transition: "color 0.15s" }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Selected chips */}
      {selectedItems.length > 0 && (
        <div className="animated fadeIn" style={{ marginTop: "16px" }}>
          <p style={{ margin: "0 0 8px", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8" }}>
            {selectedItems.length === 1 ? "1 jefe seleccionado" : `${selectedItems.length} jefes seleccionados`}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {selectedItems.map((item) => (
              <div key={item.cuil} className="profile-boss-chip">
                <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(74,108,247,0.15)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, color: "#4a6cf7" }}>
                  {getInitial(item.lastname_name)}
                </span>
                {item.lastname_name}
                <button
                  type="button"
                  className="bosses-remove-chip-btn"
                  onClick={(e) => { e.stopPropagation(); toggleSelection(item); }}
                  title="Quitar"
                >
                  <i className="pi pi-times" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inline message */}
      {msg && (
        <div
          className="animated fadeIn"
          style={{ marginTop: "14px", padding: "10px 14px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.84rem", fontWeight: 500, background: msgColors[msg.type].bg, border: `1px solid ${msgColors[msg.type].border}`, color: msgColors[msg.type].color }}
        >
          <i className={`pi ${msgColors[msg.type].icon}`} style={{ flexShrink: 0 }} />
          {msg.text}
        </div>
      )}
    </Dialog>
  );
}