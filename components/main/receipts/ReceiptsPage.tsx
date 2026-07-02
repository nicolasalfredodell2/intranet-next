"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { ProgressBar } from "primereact/progressbar";
import { Dropdown } from "primereact/dropdown";
import { Paginator } from "primereact/paginator";
import { getReceipts, getReceiptPDF, sendToFirm } from "@/lib/services/receipts.service";

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  return (
    <span
      style={{ display: "inline-flex" }}
      onMouseEnter={(e) => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setPos({ top: r.top, left: r.left + r.width / 2 });
      }}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {pos && (
        <div style={{ position: "fixed", top: pos.top - 10, left: pos.left, transform: "translateX(-50%) translateY(-100%)", background: "#1e293b", color: "#fff", padding: "5px 11px", borderRadius: "7px", fontSize: "0.71rem", fontWeight: 500, whiteSpace: "nowrap", pointerEvents: "none", zIndex: 9999, boxShadow: "0 4px 14px rgba(0,0,0,0.18)", letterSpacing: "0.01em" }}>
          {label}
          <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", borderWidth: "5px", borderStyle: "solid", borderColor: "#1e293b transparent transparent transparent" }} />
        </div>
      )}
    </span>
  );
}

interface Filters {
  anio: string;
  mes: string;
  desc: string;
}

const DESC_OPTIONS = ["Complementaria", "Normal", "SAC"];

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
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfReceipt, setPdfReceipt] = useState<any>(null);
  const [cuilSearch, setCuilSearch] = useState("");
  const [filters, setFilters] = useState<Filters>({ anio: "", mes: "", desc: "" });
  const [errMessage, setErrMessage] = useState<string | null>(null);
  const [isBossRRHH] = useState(() => RRHH_CUILS.includes(localStorage.getItem("user") ?? ""));

  const [confirmReceipt, setConfirmReceipt] = useState<any>(null);
  const [loadingSendFirm, setLoadingSendFirm] = useState(false);
  const [paginatorFirst, setPaginatorFirst] = useState(0);
  const [pageRows, setPageRows] = useState(10);

  useEffect(() => { chargeReceipts(); }, []);

  useEffect(() => { setPaginatorFirst(0); }, [filters]);

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
    if (pdfReceipt?.idn === receiptData.idn) {
      toast.current?.show({ severity: "info", summary: "Ya estás viendo este recibo", life: 2500 });
      return;
    }
    setLoadingAction(receiptData.idn);
    try {
      const buffer = await getReceiptPDF(receiptData.idn, cuilSearch);
      const blob = new Blob([buffer], { type: "application/pdf" });
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(URL.createObjectURL(blob));
      setPdfReceipt(receiptData);
    } catch {
      toast.current?.show({ severity: "error", summary: "Hubo un problema", detail: "No existe el archivo de esta liquidación." });
    } finally {
      setLoadingAction(null);
    }
  }

  function closePdf() {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setPdfReceipt(null);
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

  const allVisibleRows = filteredReceipts.flatMap((receipt: any) =>
    (receipt as any[])
      .map((rd: any, idx: number) => ({ receipt, receiptData: rd, idx }))
      .filter(({ receiptData }) =>
        receiptData.label &&
        (!filters.mes || String(receiptData.interval) === filters.mes) &&
        matchesDesc(receiptData.label)
      )
  );
  const pagedRows = allVisibleRows.slice(paginatorFirst, paginatorFirst + pageRows);

  const dialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fff4e6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-file-edit" style={{ color: "#fd7e14", fontSize: "1rem" }} />
      </div>
      <div>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Solicitar firma</p>
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

      <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
        <div className="fadeIn animated" style={{ flex: 1, minWidth: 0 }}>

        {/* CUIL search (admin only) */}
        {isBossRRHH && (
          <div className="card profile-card profile-card--admin">
            <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
              <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <i className="pi pi-shield" style={{ color: "#eab308", fontSize: "1rem" }} />
              </div>
              <div className="flex-grow-1">
                <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Buscar por CUIL</h5>
                <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Consultá los recibos de cualquier agente</small>
              </div>
              <span style={{ background: "rgba(234,179,8,0.14)", color: "#a16207", borderRadius: "20px", padding: "3px 10px", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                Administración
              </span>
            </div>
            <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />
            <div className="card-body" style={{ padding: "16px 20px 20px" }}>
              <div style={{ maxWidth: 340 }}>
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
            </div>
          </div>
        )}

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
            <button
              type="button"
              disabled={loading}
              onClick={() => chargeReceipts()}
              className="btn btn-light d-flex align-items-center"
              style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.82rem", padding: "5px 14px", color: "#64748b" }}
            >
              <i className={loading ? "pi pi-spin pi-spinner" : "pi pi-refresh"} style={{ fontSize: "0.78rem" }} />
              Recargar
            </button>
          </div>
          <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />

          <div className="card-body" style={{ padding: "16px 20px 20px" }}>

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
                    {pagedRows.map(({ receipt, receiptData, idx }) => (
                      <tr
                        key={`${(receipt as any).year}-${idx}`}
                        className="fadeIn animated"
                        onMouseEnter={() => setHoveredRow(`${(receipt as any).year}-${idx}`)}
                        onMouseLeave={() => setHoveredRow(null)}
                        style={{ borderBottom: "1px solid rgba(0,0,0,0.04)", background: hoveredRow === `${(receipt as any).year}-${idx}` || pdfReceipt?.idn === receiptData.idn ? "rgba(74,108,247,0.06)" : "transparent", transition: "background 0.15s" }}
                      >
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
                              <Tooltip label="Solicitar firma">
                                <button
                                  type="button"
                                  disabled={!!loadingAction}
                                  onClick={() => setConfirmReceipt(receiptData)}
                                  style={{ background: "none", border: "1.5px solid #e2e8f0", borderRadius: "8px", padding: "4px 10px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}
                                >
                                  <i className="mdi mdi-feather" style={{ fontSize: "0.95rem" }} />
                                </button>
                              </Tooltip>
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
                            <Tooltip label="Ver recibo">
                              <button
                                type="button"
                                disabled={!!loadingAction}
                                onClick={() => openPDF(receiptData)}
                                style={{ background: "none", border: "1.5px solid #e2e8f0", borderRadius: "8px", padding: "4px 10px", cursor: loadingAction ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", fontWeight: 600, color: "#4a6cf7" }}
                              >
                                <i className={loadingAction === receiptData.idn ? "pi pi-spin pi-spinner" : "pi pi-eye"} style={{ fontSize: "1rem" }} />
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {allVisibleRows.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ padding: "40px", textAlign: "center" }}>
                          <i className="pi pi-wallet" style={{ fontSize: "2rem", color: "#cbd5e1", display: "block", marginBottom: "8px" }} />
                          <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: 0 }}>
                            No hay recibos registrados{filters.anio || filters.desc || filters.mes ? " con los filtros aplicados" : ""}.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <Paginator
                  first={paginatorFirst}
                  rows={pageRows}
                  totalRecords={allVisibleRows.length}
                  rowsPerPageOptions={[10, 15, 20]}
                  onPageChange={(e) => { setPaginatorFirst(e.first); setPageRows(e.rows); }}
                  rightContent={
                    <span style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 500, paddingRight: "4px" }}>
                      {allVisibleRows.length} {allVisibleRows.length === 1 ? "recibo" : "recibos"}
                    </span>
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>

        {pdfUrl && (
          <div
            style={{
              width: "min(800px, 65vw)",
              flexShrink: 0,
              position: "sticky",
              top: "16px",
              height: "calc(100vh - 80px)",
              background: "#fff",
              borderRadius: "12px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.10), -2px 0 8px rgba(0,0,0,0.04)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              animation: "slideInRight 0.22s ease",
              border: "1.5px solid rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ padding: "12px 18px", borderBottom: "1.5px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: "10px", background: "#fff0f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <i className="mdi mdi-file-pdf-box" style={{ color: "#dc3545", fontSize: "1.2rem" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem", color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pdfReceipt?.label}</p>
                <small style={{ color: "#94a3b8", fontSize: "0.74rem" }}>Recibo de haberes</small>
              </div>
              <button
                type="button"
                onClick={closePdf}
                style={{ background: "none", border: "1.5px solid #e2e8f0", cursor: "pointer", padding: "5px 8px", borderRadius: "8px", color: "#94a3b8", display: "flex", alignItems: "center" }}
                title="Cerrar"
              >
                <i className="pi pi-times" style={{ fontSize: "0.85rem" }} />
              </button>
            </div>
            <iframe src={pdfUrl} style={{ flex: 1, border: "none", width: "100%" }} title="Recibo PDF" />
          </div>
        )}
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
          Se enviará el recibo <strong>{confirmReceipt?.label}</strong> para ser firmado por el director de RRHH.
        </p>
      </Dialog>
    </>
  );
}