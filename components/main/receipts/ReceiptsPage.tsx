"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { ProgressBar } from "primereact/progressbar";
import { Dropdown } from "primereact/dropdown";
import { getReceipts, getReceiptPDF, sendToFirm } from "@/lib/services/receipts.service";

interface Filters {
  anio: string;
  mes: string;
  desc: string;
}

const DESC_OPTIONS = ["Normal", "SAC", "Complementaria"];

const RRHH_CUILS = ["20306493478", "20363027653"];

function SkeletonRows() {
  return (
    <div style={{ padding: "4px 0 8px" }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ display: "flex", gap: "12px", padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,0.04)", alignItems: "center" }}>
          <div style={{ width: "10%", height: 26, borderRadius: 20, background: "linear-gradient(90deg, #e8ecf0 25%, #f1f5f9 50%, #e8ecf0 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.4s infinite" }} />
          <div style={{ width: "12%", height: 26, borderRadius: 20, background: "linear-gradient(90deg, #e8ecf0 25%, #f1f5f9 50%, #e8ecf0 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.4s infinite" }} />
          <div style={{ flex: 1, height: 14, borderRadius: 6, background: "linear-gradient(90deg, #e8ecf0 25%, #f1f5f9 50%, #e8ecf0 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.4s infinite" }} />
          <div style={{ width: 60, height: 30, borderRadius: 8, background: "linear-gradient(90deg, #e8ecf0 25%, #f1f5f9 50%, #e8ecf0 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.4s infinite" }} />
        </div>
      ))}
    </div>
  );
}

export default function ReceiptsPage() {
  const toast = useRef<Toast>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [cuilSearch, setCuilSearch] = useState("");
  const [filters, setFilters] = useState<Filters>({ anio: "", mes: "", desc: "" });
  const [errMessage, setErrMessage] = useState<string | null>(null);
  const [isBossRRHH] = useState(() => RRHH_CUILS.includes(localStorage.getItem("user") ?? ""));

  const [confirmReceipt, setConfirmReceipt] = useState<any>(null);
  const [loadingSendFirm, setLoadingSendFirm] = useState(false);

  useEffect(() => { chargeReceipts(); }, []);

  function handleCuilChange(value: string) {
    setCuilSearch(value);
    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => chargeReceipts(value), 1000);
  }

  async function chargeReceipts(cuil = cuilSearch) {
    setLoading(true);
    setErrMessage(null);
    try {
      const resp = await getReceipts(cuil);
      const original: any[] = resp.message.original;
      original.forEach((element: any, index: number) => {
        const year = original[index].year;
        original[index] = Object.values(element);
        (original[index] as any).year = year;
      });
      setReceipts(original);
      const years = [...new Set(original.map((r: any) => String(r.year)))].sort((a, b) => Number(b) - Number(a));
      if (years.length > 0) setFilters({ anio: years[0], mes: "", desc: "" });
    } catch (err: any) {
      setErrMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function openPDF(receiptData: any) {
    if (loadingAction) return;
    setLoadingAction(receiptData.idn);
    try {
      const buffer = await getReceiptPDF(receiptData.idn, cuilSearch);
      const blob = new Blob([buffer], { type: "application/pdf" });
      window.open(URL.createObjectURL(blob));
    } catch {
      toast.current?.show({ severity: "error", summary: "Hubo un problema", detail: "No existe el archivo de esta liquidación." });
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleSendToFirm() {
    if (!confirmReceipt) return;
    setLoadingSendFirm(true);
    try {
      await sendToFirm(confirmReceipt.idn, cuilSearch);
      toast.current?.show({ severity: "success", summary: "Recibo enviado para firmar", detail: "Ya se le informó a RRHH para que firmen su recibo." });
      setConfirmReceipt(null);
    } catch {
      toast.current?.show({ severity: "info", summary: "Ya se envió el recibo a firmar." });
      setConfirmReceipt(null);
    } finally {
      setLoadingSendFirm(false);
    }
  }

  const yearOptions = [...new Set(receipts.map((r: any) => String((r as any).year)))].sort((a, b) => Number(b) - Number(a));
  const monthOptions = [...new Set(
    receipts.flatMap((r: any) => (r as any[]).filter((rd: any) => rd?.label).map((rd: any) => String(rd.interval)))
  )].sort((a, b) => Number(a) - Number(b));
  const hasFilters = !!(filters.anio || filters.mes || filters.desc);

  function matchesDesc(label: string) {
    if (!filters.desc) return true;
    const d = filters.desc.toLowerCase();
    const l = (label ?? "").toLowerCase();
    return d === "sac" ? l.includes("sac") || l.includes("s.a.c") : l.includes(d);
  }
  const filteredReceipts = receipts.filter((r: any) => !filters.anio || String((r as any).year) === filters.anio);

  const dialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fff4e6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-file-edit" style={{ color: "#fd7e14", fontSize: "1rem" }} />
      </div>
      <div>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Solicitar firma</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Se notificará a RRHH para firmar el recibo</small>
      </div>
    </div>
  );

  const firmFooter = (
    <div>
      <div className="d-flex align-items-center" style={{ gap: "8px" }}>
        <button
          disabled={loadingSendFirm}
          onClick={handleSendToFirm}
          type="button"
          className="btn btn-primary d-flex align-items-center"
          style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
        >
          <i className={loadingSendFirm ? "pi pi-spin pi-spinner" : "pi pi-send"} style={{ fontSize: "0.78rem" }} />
          {loadingSendFirm ? "Enviando..." : "Enviar"}
        </button>
        <button
          disabled={loadingSendFirm}
          onClick={() => setConfirmReceipt(null)}
          type="button"
          className="btn btn-light text-muted ml-auto"
          style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
        >
          Cancelar
        </button>
      </div>
      {loadingSendFirm && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
    </div>
  );

  return (
    <>
      <Toast ref={toast} position="bottom-center" />

      <div className="fadeIn animated">
        <div className="card profile-card">

          {/* Header */}
          <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-wallet" style={{ color: "#059669", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Recibos</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Historial de liquidaciones de haberes</small>
            </div>
          </div>
          <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />

          <div className="card-body" style={{ padding: "16px 20px 20px" }}>

            {/* CUIL search (admin only) */}
            {isBossRRHH && (
              <div className="mb-3" style={{ maxWidth: 340 }}>
                <label className="profile-field-label">Buscar por CUIL</label>
                <div className="bosses-search-wrap">
                  <i className="pi pi-search bosses-search-icon" />
                  <input
                    className="profile-input"
                    style={{ paddingLeft: "36px", paddingRight: cuilSearch ? "40px" : "13px" }}
                    type="number"
                    placeholder="Ingresá el CUIL…"
                    value={cuilSearch}
                    onChange={(e) => handleCuilChange(e.target.value)}
                  />
                  {cuilSearch && (
                    <button type="button" className="bosses-search-clear" onClick={() => handleCuilChange("")}>
                      <i className="pi pi-times" style={{ fontSize: "0.72rem" }} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Filter bar */}
            <div className="license-filter-bar mb-3">
              <div className="license-filter-bar-inputs">
                <div className={`license-filter-input-wrap${filters.anio ? " license-filter-input-wrap--active" : ""}`}>
                  <i className="pi pi-calendar license-filter-icon" />
                  <Dropdown
                    value={filters.anio || null}
                    options={yearOptions}
                    onChange={(e) => setFilters((p) => ({ ...p, anio: e.value ?? "" }))}
                    placeholder="Año"
                    className="license-filter-dropdown"
                    panelClassName="license-filter-dropdown-panel"
                    showClear={!!filters.anio}
                    emptyMessage="Sin opciones"
                  />
                </div>
                <div className={`license-filter-input-wrap${filters.mes ? " license-filter-input-wrap--active" : ""}`}>
                  <i className="pi pi-calendar-minus license-filter-icon" />
                  <Dropdown
                    value={filters.mes || null}
                    options={monthOptions}
                    onChange={(e) => setFilters((p) => ({ ...p, mes: e.value ?? "" }))}
                    placeholder="Mes"
                    className="license-filter-dropdown"
                    panelClassName="license-filter-dropdown-panel"
                    showClear={!!filters.mes}
                    emptyMessage="Sin opciones"
                  />
                </div>
                <div className={`license-filter-input-wrap${filters.desc ? " license-filter-input-wrap--active" : ""}`}>
                  <i className="pi pi-align-left license-filter-icon" />
                  <Dropdown
                    value={filters.desc || null}
                    options={DESC_OPTIONS}
                    onChange={(e) => setFilters((p) => ({ ...p, desc: e.value ?? "" }))}
                    placeholder="Descripción"
                    className="license-filter-dropdown"
                    panelClassName="license-filter-dropdown-panel"
                    showClear={!!filters.desc}
                    emptyMessage="Sin opciones"
                  />
                </div>
              </div>
              {hasFilters && (
                <button
                  type="button"
                  className="license-filter-clear"
                  onClick={() => setFilters({ anio: "", mes: "", desc: "" })}
                >
                  <i className="pi pi-times" /> Limpiar
                </button>
              )}
            </div>

            {/* Loading skeleton */}
            {loading && <SkeletonRows />}

            {/* Error */}
            {!loading && errMessage && (
              <div className="fadeIn animated" style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(220,53,69,0.07)", border: "1px solid rgba(220,53,69,0.22)", color: "#dc3545", fontSize: "0.85rem", fontWeight: 500, display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="pi pi-exclamation-circle" style={{ flexShrink: 0 }} />
                {errMessage}
              </div>
            )}

            {/* Receipts table */}
            {!loading && !errMessage && (
              <div className="fadeIn animated" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["AÑO", "MES", "DESCRIPCIÓN", ""].map((h, i) => (
                        <th
                          key={i}
                          style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", padding: "0 8px 10px", textAlign: i === 3 ? "right" : "left", borderBottom: "1.5px solid rgba(0,0,0,0.06)", whiteSpace: "nowrap" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReceipts.map((receipt: any) =>
                      (receipt as any[]).map((receiptData: any, idx: number) =>
                        receiptData.label && (!filters.mes || String(receiptData.interval) === filters.mes) && matchesDesc(receiptData.label) ? (
                          <tr key={`${(receipt as any).year}-${idx}`} className="fadeIn animated" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                            <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
                              <span style={{ background: "rgba(74,108,247,0.09)", color: "#4a6cf7", borderRadius: "8px", padding: "3px 10px", fontSize: "0.78rem", fontWeight: 700 }}>
                                {(receipt as any).year}
                              </span>
                            </td>
                            <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
                              <span style={{ background: "#f1f5f9", color: "#475569", borderRadius: "20px", padding: "3px 10px", fontSize: "0.78rem", fontWeight: 600 }}>
                                {receiptData.interval}
                              </span>
                            </td>
                            <td style={{ padding: "10px 8px", fontSize: "0.86rem", color: "#374151" }}>
                              {receiptData.label}
                            </td>
                            <td style={{ padding: "10px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                              <div className="d-flex align-items-center justify-content-end" style={{ gap: "6px" }}>
                                {receiptData.status == null && (((receipt as any).year == 2022 && receiptData.interval >= 2) || (receipt as any).year > 2022) && (
                                  <button
                                    type="button"
                                    disabled={!!loadingAction}
                                    onClick={() => setConfirmReceipt(receiptData)}
                                    title="Solicitar firma"
                                    style={{ background: "none", border: "1.5px solid #e2e8f0", borderRadius: "8px", padding: "4px 10px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}
                                  >
                                    <i className="mdi mdi-feather" style={{ fontSize: "0.95rem" }} />
                                    Firmar
                                  </button>
                                )}
                                {receiptData.status != null && (
                                  <span
                                    style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "20px", fontSize: "0.73rem", fontWeight: 600, background: receiptData.status == 0 ? "rgba(23,162,184,0.1)" : "rgba(5,150,105,0.1)", color: receiptData.status == 0 ? "#17a2b8" : "#059669" }}
                                    title={receiptData.status == 0 ? "En espera de firma" : "Firmado"}
                                  >
                                    <i className={`pi ${receiptData.status == 0 ? "pi-hourglass" : "pi-check-circle"}`} style={{ fontSize: "0.75rem" }} />
                                    {receiptData.status == 0 ? "En espera" : "Firmado"}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  disabled={!!loadingAction}
                                  onClick={() => openPDF(receiptData)}
                                  title="Ver recibo"
                                  style={{ background: "none", border: "1.5px solid #e2e8f0", borderRadius: "8px", padding: "4px 10px", cursor: loadingAction ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", fontWeight: 600, color: "#4a6cf7" }}
                                >
                                  <i className={loadingAction === receiptData.idn ? "pi pi-spin pi-spinner" : "pi pi-eye"} style={{ fontSize: "1rem" }} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : null
                      )
                    )}
                  </tbody>
                </table>

                {/* Empty state */}
                {filteredReceipts.length === 0 && (
                  <div className="text-center py-5 fadeIn animated">
                    <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                      <i className="pi pi-wallet" style={{ fontSize: "1.5rem", color: "#94a3b8" }} />
                    </div>
                    <p className="font-weight-bold mb-1" style={{ fontSize: "0.95rem", color: "#1e293b" }}>Sin recibos</p>
                    <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0 }}>
                      {filters.anio ? `No hay recibos para el año ${filters.anio}.` : "No hay recibos disponibles."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog
        header={dialogHeader}
        visible={!!confirmReceipt}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(480px, 92vw)" }}
        onHide={() => setConfirmReceipt(null)}
        footer={firmFooter}
      >
        <p style={{ fontSize: "0.88rem", color: "#374151", margin: 0 }}>
          Se enviará el recibo <strong>{confirmReceipt?.label}</strong> para ser firmado por RRHH.
        </p>
      </Dialog>
    </>
  );
}