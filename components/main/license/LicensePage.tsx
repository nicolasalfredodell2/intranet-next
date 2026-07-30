"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Paginator } from "primereact/paginator";
import { loadLicenses } from "@/lib/services/license.service";

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
  descripcion: string;
  norma_aprobatoria: string;
  anio_ref: string;
}

const SORT_OPTIONS = [
  { label: "Año (ascendente)", value: "anio_ref:asc" },
  { label: "Año (descendente)", value: "anio_ref:desc" },
  { label: "Descripción (A-Z)", value: "descripcion:asc" },
  { label: "Descripción (Z-A)", value: "descripcion:desc" },
  { label: "Norma (A-Z)", value: "norma_aprobatoria:asc" },
  { label: "Norma (Z-A)", value: "norma_aprobatoria:desc" },
  { label: "Días utilizados (menor a mayor)", value: "cant:asc" },
  { label: "Días utilizados (mayor a menor)", value: "cant:desc" },
];

function formatDate(d: string) {
  return d.split("-").reverse().join("/").replace("-", "/").replace("-", "/");
}

function DayBadge({ days }: { days: number }) {
  return (
    <span
      style={{
        background: "#f1f5f9",
        color: "#475569",
        borderRadius: "20px",
        padding: "3px 10px",
        fontSize: "0.78rem",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {days} {days === 1 ? "día" : "días"}
    </span>
  );
}


function SkeletonRows() {
  return (
    <div style={{ padding: "4px 0 8px" }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="license-skeleton-row">
          {[10, 30, 22, 8, 12, 8].map((w, j) => (
            <div key={j} className="license-skeleton-cell" style={{ width: `${w}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function LicensePage() {
  const toast = useRef<Toast>(null);
  const [loading, setLoading] = useState(false);
  const [licensesCompact, setLicensesCompact] = useState<any[]>([]);
  const [licensesTotal, setLicensesTotal] = useState<any[]>([]);
  const [licensesForDetail, setLicensesForDetail] = useState<any[]>([]);
  const [selectedLicense, setSelectedLicense] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    descripcion: "",
    norma_aprobatoria: "",
    anio_ref: "",
  });
  const [paginatorFirst, setPaginatorFirst] = useState(0);
  const [paginatorRows, setPaginatorRows] = useState(10);
  const [sortBy, setSortBy] = useState("");
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [detailFirst, setDetailFirst] = useState(0);
  const [detailRows, setDetailRows] = useState(10);
  const [hoveredDetailRow, setHoveredDetailRow] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setPaginatorFirst(0);
  }, [filters]);

  async function loadData() {
    setLoading(true);
    try {
      const resp = await loadLicenses();
      if (resp.error) {
        toast.current?.show({ severity: "error", summary: "No se pudieron cargar las licencias" });
        return;
      }

      const licenses: any[] = resp;
      const temp: any[] = [];

      licenses.forEach((license: any) => {
        license.fecha_inicio = formatDate(license.fecha_inicio);
        license.fecha_finaliz = formatDate(license.fecha_finaliz);

        if (temp.length === 0) {
          license.cant = license.dias_computados;
          temp.push(license);
          return;
        }

        let isRepeat = false;
        temp.forEach((t: any) => {
          if (t.articulo === license.articulo && t.anio_ref === license.anio_ref) {
            isRepeat = true;
            t.cant += license.dias_computados;
          }
        });

        if (!isRepeat) {
          license.cant = license.dias_computados;
          temp.push(license);
        }
      });

      const compact = temp.reverse();
      setLicensesCompact(compact);
      setLicensesTotal(licenses);

      const maxYear = compact.reduce((max, l) => Math.max(max, Number(l.anio_ref) || 0), 0);
      if (maxYear > 0) {
        setFilters((prev) => ({ ...prev, anio_ref: String(maxYear) }));
      }
    } catch (err: any) {
      toast.current?.show({
        severity: "error",
        summary: "No se pudieron cargar las licencias",
        detail: err.message,
      });
    } finally {
      setLoading(false);
    }
  }

  function openDetail(license: any) {
    const details = licensesTotal
      .filter((l: any) => l.articulo === license.articulo && l.anio_ref === license.anio_ref)
      .reverse();
    const norma = license.norma_aprobatoria ?? details.find((l: any) => l.norma_aprobatoria)?.norma_aprobatoria ?? null;
    setSelectedLicense({ ...license, norma_aprobatoria: norma });
    setDetailFirst(0);
    setLicensesForDetail(details);
    setShowDetail(true);
  }

  const hasFilters = Object.values(filters).some(Boolean);

  const filtered = licensesCompact.filter(
    (l) =>
      (!filters.descripcion || l.descripcion?.toLowerCase().includes(filters.descripcion.toLowerCase())) &&
      (!filters.norma_aprobatoria ||
        l.norma_aprobatoria?.toLowerCase().includes(filters.norma_aprobatoria.toLowerCase())) &&
      (!filters.anio_ref || String(l.anio_ref).includes(filters.anio_ref))
  );

  if (sortBy) {
    const [sortField, sortDir] = sortBy.split(":");
    filtered.sort((a, b) => {
      const cmp =
        sortField === "anio_ref" || sortField === "cant"
          ? (Number(a[sortField]) || 0) - (Number(b[sortField]) || 0)
          : String(a[sortField] ?? "").localeCompare(String(b[sortField] ?? ""));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }

  const latestYear = licensesCompact.reduce((max, l) => Math.max(max, Number(l.anio_ref) || 0), 0);
  const totalDaysLatestYear = licensesCompact
    .filter((l) => l.anio_ref === latestYear)
    .reduce((sum, l) => sum + (l.cant ?? 0), 0);

  const descripcionOptions = [...new Set(licensesCompact.map((l) => l.descripcion).filter(Boolean))].sort() as string[];
  const normaOptions = [...new Set(licensesCompact.map((l) => l.norma_aprobatoria).filter(Boolean))].sort() as string[];
  const anioOptions = [...new Set(licensesCompact.map((l) => String(l.anio_ref)))].sort((a, b) => Number(b) - Number(a));

  const filterFields: { field: keyof Filters; placeholder: string; icon: string; type: "select" | "input"; options?: string[] }[] = [
    { field: "anio_ref", placeholder: "Año", icon: "pi-calendar", type: "select", options: anioOptions },
    { field: "descripcion", placeholder: "Descripción", icon: "pi-align-left", type: "select", options: descripcionOptions },
    { field: "norma_aprobatoria", placeholder: "Norma", icon: "pi-book", type: "select", options: normaOptions },
  ];

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />

      <div className="animated fadeIn">

        {/* Main card */}
        <div className="card profile-card license-main-card">

          {/* Header */}
          <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "rgba(74,108,247,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-calendar-minus" style={{ color: "#4a6cf7", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Licencias</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Historial de licencias</small>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={loadData}
              className="btn btn-light d-flex align-items-center"
              style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.82rem", padding: "5px 14px", color: "#64748b" }}
            >
              <i className={loading ? "pi pi-spin pi-spinner" : "pi pi-refresh"} style={{ fontSize: "0.78rem" }} />
              Recargar
            </button>
          </div>
          <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />

          <div className="card-body">
            {loading ? (
              <SkeletonRows />
            ) : (
              <div className="animated fadeIn">

                {/* Filter bar */}
                <div className="license-filter-bar">
                  <div className="license-filter-bar-inputs">
                    {filterFields.map(({ field, placeholder, icon, type, options }) => (
                      <div key={field} className={`license-filter-input-wrap${filters[field] ? " license-filter-input-wrap--active" : ""}`}>
                        <i className={`pi ${icon} license-filter-icon`} />
                        {type === "select" ? (
                          <Dropdown
                            value={filters[field] || null}
                            options={options || []}
                            onChange={(e) => setFilters((p) => ({ ...p, [field]: e.value ?? "" }))}
                            placeholder={placeholder}
                            className="license-filter-dropdown"
                            panelClassName="license-filter-dropdown-panel"
                            showClear={!!filters[field]}
                            emptyMessage="Sin opciones"
                          />
                        ) : (
                          <input
                            className="license-filter-input"
                            placeholder={placeholder}
                            value={filters[field]}
                            onChange={(e) => setFilters((p) => ({ ...p, [field]: e.target.value }))}
                          />
                        )}
                      </div>
                    ))}
                    <div className={`license-filter-input-wrap${sortBy ? " license-filter-input-wrap--active" : ""}`}>
                      <i className="pi pi-sort-alt license-filter-icon" />
                      <Dropdown
                        value={sortBy || null}
                        options={SORT_OPTIONS}
                        optionLabel="label"
                        optionValue="value"
                        onChange={(e) => setSortBy(e.value ?? "")}
                        placeholder="Ordenar por"
                        className="license-filter-dropdown"
                        panelClassName="license-filter-dropdown-panel"
                        showClear={!!sortBy}
                      />
                    </div>
                  </div>
                  {hasFilters && (
                    <button
                      type="button"
                      className="license-filter-clear"
                      onClick={() =>
                        setFilters({ descripcion: "", norma_aprobatoria: "", anio_ref: "" })
                      }
                    >
                      <i className="pi pi-times" /> Limpiar
                    </button>
                  )}
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["AÑO", "DESCRIPCIÓN", "NORMA", "DÍAS UTILIZADOS", ""].map((h, i) => (
                          <th key={i} style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", padding: "0 8px 10px", textAlign: i === 4 ? "right" : "left", borderBottom: "1.5px solid rgba(0,0,0,0.06)", whiteSpace: "nowrap" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ padding: "40px", textAlign: "center" }}>
                            <i className="pi pi-inbox" style={{ fontSize: "2rem", color: "#cbd5e1", display: "block", marginBottom: "8px" }} />
                            <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: 0 }}>
                              No hay licencias registradas {hasFilters ? "con los filtros aplicados" : ""}.
                            </p>
                          </td>
                        </tr>
                      )}
                      {filtered.slice(paginatorFirst, paginatorFirst + paginatorRows).map((r) => {
                        const rowKey = `${r.articulo}-${r.anio_ref}`;
                        return (
                        <tr
                          key={rowKey}
                          className="fadeIn animated"
                          onMouseEnter={() => setHoveredRow(rowKey)}
                          onMouseLeave={() => setHoveredRow(null)}
                          style={{ borderBottom: "1px solid rgba(0,0,0,0.04)", background: hoveredRow === rowKey ? "rgba(74,108,247,0.06)" : "transparent", transition: "background 0.15s" }}
                        >
                          <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
                            <span className="license-cell-year">{r.anio_ref}</span>
                          </td>
                          <td style={{ padding: "10px 8px" }}>
                            <span className="license-cell-primary">{r.descripcion}</span>
                          </td>
                          <td style={{ padding: "10px 8px" }}>
                            <span className="license-cell-secondary">{r.norma_aprobatoria}</span>
                          </td>
                          <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
                            <DayBadge days={r.cant} />
                          </td>
                          <td style={{ padding: "10px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                            <div className="d-flex align-items-center justify-content-end">
                              <Tooltip label="Ver detalle">
                                <button
                                  type="button"
                                  className="license-action-btn"
                                  onClick={() => openDetail(r)}
                                  aria-label="Ver detalle"
                                >
                                  <i className="pi pi-eye" />
                                </button>
                              </Tooltip>
                            </div>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <Paginator
                    first={paginatorFirst}
                    rows={paginatorRows}
                    totalRecords={filtered.length}
                    rowsPerPageOptions={[10, 15, 20]}
                    onPageChange={(e) => { setPaginatorFirst(e.first); setPaginatorRows(e.rows); }}
                    rightContent={
                      <span style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 500, paddingRight: "4px" }}>
                        {filtered.length} {filtered.length === 1 ? "licencia" : "licencias"}
                      </span>
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog
        header={
          <div className="license-dialog-header">
            <div className="license-dialog-header-icon">
              <i className="pi pi-calendar-minus" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span className="license-dialog-title">{licensesForDetail[0]?.descripcion}</span>
                {selectedLicense?.norma_aprobatoria && (
                  <span style={{ background: "rgba(74,108,247,0.09)", color: "#4a6cf7", borderRadius: "8px", padding: "2px 9px", fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                    {selectedLicense.norma_aprobatoria}
                  </span>
                )}
                <span style={{ background: "#f1f5f9", color: "#475569", borderRadius: "20px", padding: "2px 9px", fontSize: "0.72rem", fontWeight: 600, whiteSpace: "nowrap" }}>
                  {licensesForDetail.reduce((s, l) => s + (l.dias_computados ?? 0), 0)} días utilizados
                </span>
              </div>
              <span className="license-dialog-year-badge">{licensesForDetail[0]?.anio_ref}</span>
            </div>
          </div>
        }
        visible={showDetail}
        draggable={false}
        dismissableMask
        modal
        style={{ width: "min(95vw, 780px)" }}
        onHide={() => setShowDetail(false)}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["FECHA INICIO", "FECHA FIN", "DÍAS UTILIZADOS", "NORMA APROBATORIA"].map((h, i) => (
                  <th key={i} style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", padding: "0 8px 10px", textAlign: "left", borderBottom: "1.5px solid rgba(0,0,0,0.06)", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {licensesForDetail.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: "40px", textAlign: "center" }}>
                    <i className="pi pi-inbox" style={{ fontSize: "2rem", color: "#cbd5e1", display: "block", marginBottom: "8px" }} />
                    <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: 0 }}>No hay registros para esta licencia.</p>
                  </td>
                </tr>
              )}
              {licensesForDetail.slice(detailFirst, detailFirst + detailRows).map((r, i) => {
                const rowKey = detailFirst + i;
                return (
                  <tr
                    key={rowKey}
                    className="fadeIn animated"
                    onMouseEnter={() => setHoveredDetailRow(rowKey)}
                    onMouseLeave={() => setHoveredDetailRow(null)}
                    style={{ borderBottom: "1px solid rgba(0,0,0,0.04)", background: hoveredDetailRow === rowKey ? "rgba(74,108,247,0.06)" : "transparent", transition: "background 0.15s" }}
                  >
                    <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
                      <span className="license-date-cell">{r.fecha_inicio}</span>
                    </td>
                    <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
                      <span className="license-date-cell">{r.fecha_finaliz}</span>
                    </td>
                    <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
                      <DayBadge days={r.dias_computados} />
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      <span className="license-cell-secondary">{r.norma_aprobatoria}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Paginator
            first={detailFirst}
            rows={detailRows}
            totalRecords={licensesForDetail.length}
            rowsPerPageOptions={[10, 15, 20]}
            onPageChange={(e) => { setDetailFirst(e.first); setDetailRows(e.rows); }}
            rightContent={
              <span style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 500, paddingRight: "4px" }}>
                {licensesForDetail.length} {licensesForDetail.length === 1 ? "registro" : "registros"}
              </span>
            }
          />
        </div>
      </Dialog>
    </>
  );
}
