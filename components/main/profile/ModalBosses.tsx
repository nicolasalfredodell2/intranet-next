"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Chip } from "primereact/chip";
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

export default function ModalBosses({ show, user, onHide, onBossesAssigned }: Props) {
  const [allInternals, setAllInternals] = useState<Internal[]>([]);
  const [selectedCuils, setSelectedCuils] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [isFirstSelect, setIsFirstSelect] = useState(false);
  const [msg, setMsg] = useState<{ severity: string; text: string } | null>(null);
  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!show) return;
    loadInternals();

    const bosses = user?.bosses ?? [];
    if (bosses.length === 0) {
      setIsFirstSelect(true);
      setSelectedCuils([]);
    } else {
      setIsFirstSelect(false);
      setSelectedCuils(bosses.map((b: any) => b.people?.cuil ?? b.cuil));
    }
  }, [show]);

  function showMsg(severity: string, text: string) {
    setMsg({ severity, text });
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMsg(null), 5000);
  }

  async function loadInternals() {
    setLoading(true);
    try {
      const data = await getInternals("");
      const userCuil = localStorage.getItem("user");
      setAllInternals(data.filter((u: any) => u.cuil !== userCuil));
    } catch {
      showMsg("error", "No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return allInternals;
    const q = search.toLowerCase();
    return allInternals.filter((u) =>
      [u.cuil, u.lastname_name, u.name, u.lastname, u.legajo]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [search, allInternals]);

  const selectedItems = useMemo(
    () => allInternals.filter((u) => selectedCuils.includes(u.cuil)),
    [selectedCuils, allInternals]
  );

  function toggleSelection(cuil: string) {
    setSelectedCuils((prev) =>
      prev.includes(cuil) ? prev.filter((c) => c !== cuil) : [...prev, cuil]
    );
  }

  function dismiss(emitBosses = false) {
    if (emitBosses) {
      onBossesAssigned(selectedItems);
    }
    setAllInternals([]);
    setSearch("");
    setSelectedCuils([]);
    setLoading(false);
    onHide();
  }

  async function handleSetBosses() {
    if (selectedCuils.length === 0) {
      showMsg("info", "Debe seleccionar al menos un jefe.");
      return;
    }

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

  const dialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "10px" }}>
      <div style={{ width: 36, height: 36, borderRadius: "10px", background: "#fff4e6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-users" style={{ color: "#fd7e14", fontSize: "1rem" }} />
      </div>
      <div>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.95rem", color: "#2f3d4a" }}>Asignar jefes</p>
        <small className="text-muted" style={{ fontSize: "0.78rem" }}>Seleccioná quiénes aprobarán tus solicitudes</small>
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
          style={{ gap: "6px" }}
          onClick={handleSetBosses}
        >
          <i className={loadingAction ? "pi pi-spin pi-spinner" : "pi pi-check"} />
          {loadingAction ? "Guardando..." : "Guardar"}
        </button>

        {!isFirstSelect && (
          <button
            disabled={loading}
            type="button"
            className="btn text-muted ml-auto"
            onClick={() => dismiss(false)}
          >
            Volver
          </button>
        )}
      </div>

      {loadingAction && (
        <ProgressBar className="animated fadeIn mt-2" mode="indeterminate" style={{ height: "6px" }} />
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
      {isFirstSelect && (
        <div className="alert alert-info mb-3 animated fadeIn" style={{ fontSize: "0.85rem" }}>
          Seleccioná tu jefe/s para seguir navegando.
        </div>
      )}

      {/* Buscador */}
      <div className="mb-3">
        <div className="input-group">
          <div className="input-group-prepend">
            <span className="input-group-text" style={{ background: "#f8f9fa" }}>
              <i className="pi pi-search" style={{ fontSize: "0.85rem", color: "#aaa" }} />
            </span>
          </div>
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nombre o apellido"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
            disabled={loading}
          />
          {search && (
            <div className="input-group-append">
              <button
                type="button"
                className="input-group-text"
                style={{ background: "#f8f9fa", cursor: "pointer" }}
                onClick={() => setSearch("")}
              >
                <i className="pi pi-times" style={{ fontSize: "0.75rem", color: "#aaa" }} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Listado */}
      {loading ? (
        <div className="py-3">
          <ProgressBar mode="indeterminate" style={{ height: "6px" }} />
          <p className="text-muted text-center mt-3 mb-0" style={{ fontSize: "0.85rem" }}>Cargando usuarios...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-4 text-muted animated fadeIn" style={{ fontSize: "0.88rem" }}>
          {search ? "Sin resultados para tu búsqueda." : "No hay usuarios disponibles."}
        </div>
      ) : (
        <div style={{ maxHeight: "240px", overflowY: "auto", borderRadius: "8px", border: "1px solid #eee" }}>
          {filtered.map((internal, idx) => {
            const isSelected = selectedCuils.includes(internal.cuil);
            return (
              <div
                key={internal.cuil}
                className="d-flex align-items-center px-3 py-2"
                style={{
                  cursor: "pointer",
                  background: isSelected ? "#f0f4ff" : "transparent",
                  borderBottom: idx < filtered.length - 1 ? "1px solid #f4f4f4" : "none",
                  transition: "background 0.15s",
                  gap: "10px",
                }}
                onClick={() => toggleSelection(internal.cuil)}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelection(internal.cuil)}
                  onClick={(e) => e.stopPropagation()}
                  style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#4a6cf7", flexShrink: 0 }}
                />
                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                  <p className="mb-0" style={{ fontSize: "0.88rem", fontWeight: isSelected ? 600 : 400, color: "#2f3d4a" }}>
                    {internal.lastname_name}
                  </p>
                  <small className="text-info" style={{ fontSize: "0.74rem" }}>Cargo: {internal.occupation_signature ? internal.occupation_signature : '--'}</small>
                </div>
                {isSelected && (
                  <i className="pi pi-check-circle animated fadeIn" style={{ color: "#4a6cf7", fontSize: "1rem", flexShrink: 0 }} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Chips de seleccionados */}
      {selectedItems.length > 0 && (
        <div className="mt-3 animated fadeIn">
          <p className="mb-2" style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#aaa" }}>
            {selectedItems.length === 1 ? "1 jefe seleccionado" : `${selectedItems.length} jefes seleccionados`}
          </p>
          <div className="d-flex flex-wrap" style={{ gap: "6px" }}>
            {selectedItems.map((item) => (
              <Chip
                key={item.cuil}
                label={item.lastname_name}
                removable
                onRemove={() => { toggleSelection(item.cuil); return true; }}
                className="animated fadeIn custom-chip-internal"
              />
            ))}
          </div>
        </div>
      )}

      {msg && (
        <div className={`mt-3 alert alert-${msg.severity === "error" ? "danger" : msg.severity === "success" ? "success" : "info"} animated fadeIn`}>
          {msg.text}
        </div>
      )}
    </Dialog>
  );
}