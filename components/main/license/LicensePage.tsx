"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { loadLicenses } from "@/lib/services/license.service";

interface Filters {
  articulo: string;
  descripcion: string;
  norma_aprobatoria: string;
  anio_ref: string;
}

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

function ArticleChip({ value }: { value: string }) {
  return (
    <span
      style={{
        background: "rgba(74,108,247,0.09)",
        color: "#4a6cf7",
        borderRadius: "8px",
        padding: "3px 10px",
        fontSize: "0.78rem",
        fontWeight: 700,
        letterSpacing: "0.02em",
      }}
    >
      {value}
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
  const [showDetail, setShowDetail] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    articulo: "",
    descripcion: "",
    norma_aprobatoria: "",
    anio_ref: "",
  });

  useEffect(() => {
    loadData();
  }, []);

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
    setLicensesForDetail(
      licensesTotal
        .filter((l: any) => l.articulo === license.articulo && l.anio_ref === license.anio_ref)
        .reverse()
    );
    setShowDetail(true);
  }

  const hasFilters = Object.values(filters).some(Boolean);

  const filtered = licensesCompact.filter(
    (l) =>
      (!filters.articulo || String(l.articulo).toLowerCase().includes(filters.articulo.toLowerCase())) &&
      (!filters.descripcion || l.descripcion?.toLowerCase().includes(filters.descripcion.toLowerCase())) &&
      (!filters.norma_aprobatoria ||
        l.norma_aprobatoria?.toLowerCase().includes(filters.norma_aprobatoria.toLowerCase())) &&
      (!filters.anio_ref || String(l.anio_ref).includes(filters.anio_ref))
  );

  const latestYear = licensesCompact.reduce((max, l) => Math.max(max, Number(l.anio_ref) || 0), 0);
  const totalDaysLatestYear = licensesCompact
    .filter((l) => l.anio_ref === latestYear)
    .reduce((sum, l) => sum + (l.cant ?? 0), 0);

  const summaryCards = [
    {
      label: "Tipos de licencia",
      value: licensesCompact.length,
      icon: "pi-list",
      color: "#4a6cf7",
      bg: "rgba(74,108,247,0.08)",
    },
    {
      label: "Año más reciente",
      value: latestYear || "—",
      icon: "pi-calendar",
      color: "#059669",
      bg: "rgba(5,150,105,0.08)",
    },
    {
      label: `Días en ${latestYear || "—"}`,
      value: `${totalDaysLatestYear} días`,
      icon: "pi-clock",
      color: "#d97706",
      bg: "rgba(217,119,6,0.08)",
    },
  ];

  const articuloOptions = [...new Set(licensesCompact.map((l) => String(l.articulo)))].sort();
  const descripcionOptions = [...new Set(licensesCompact.map((l) => l.descripcion).filter(Boolean))].sort() as string[];
  const normaOptions = [...new Set(licensesCompact.map((l) => l.norma_aprobatoria).filter(Boolean))].sort() as string[];
  const anioOptions = [...new Set(licensesCompact.map((l) => String(l.anio_ref)))].sort((a, b) => Number(b) - Number(a));

  const filterFields: { field: keyof Filters; placeholder: string; icon: string; type: "select" | "input"; options?: string[] }[] = [
    { field: "anio_ref", placeholder: "Año", icon: "pi-calendar", type: "select", options: anioOptions },
    { field: "articulo", placeholder: "Artículo", icon: "pi-hashtag", type: "select", options: articuloOptions },
    { field: "descripcion", placeholder: "Descripción", icon: "pi-align-left", type: "select", options: descripcionOptions },
    { field: "norma_aprobatoria", placeholder: "Norma", icon: "pi-book", type: "select", options: normaOptions },
  ];

  return (
    <>
      <Toast ref={toast} position="bottom-center" />

      <div className="animated fadeIn">

        {/* Main card */}
        <div className="card license-main-card">
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
                  </div>
                  {hasFilters && (
                    <button
                      type="button"
                      className="license-filter-clear"
                      onClick={() =>
                        setFilters({ articulo: "", descripcion: "", norma_aprobatoria: "", anio_ref: "" })
                      }
                    >
                      <i className="pi pi-times" /> Limpiar
                    </button>
                  )}
                </div>

                <DataTable
                  value={filtered}
                  className="p-datatable-sm license-table"
                  emptyMessage={
                    <div className="license-empty">
                      <i className="pi pi-inbox" />
                      <p>No hay licencias registradas</p>
                    </div>
                  }
                >
                  <Column
                    field="anio_ref"
                    header="AÑO"
                    style={{ width: "9%", textAlign: "left" }}
                    body={(r) => <span className="license-cell-year">{r.anio_ref}</span>}
                    sortable
                  />
                  <Column
                    field="articulo"
                    header="ARTÍCULO"
                    style={{ width: "10%" }}
                    body={(r) => <ArticleChip value={r.articulo} />}
                    sortable
                  />
                  <Column
                    field="descripcion"
                    header="DESCRIPCIÓN"
                    style={{ width: "30%" }}
                    body={(r) => <span className="license-cell-primary">{r.descripcion}</span>}
                    sortable
                  />
                  <Column
                    field="norma_aprobatoria"
                    header="NORMA"
                    style={{ width: "22%" }}
                    body={(r) => <span className="license-cell-secondary">{r.norma_aprobatoria}</span>}
                    sortable
                  />
                  <Column
                    field="cant"
                    header="DÍAS TOTALES"
                    style={{ width: "14%", textAlign: "left" }}
                    body={(r) => <DayBadge days={r.cant} />}
                    sortable
                  />
                  <Column
                    header=""
                    style={{ width: "7%", textAlign: "center" }}
                    body={(r) => (
                      <button
                        type="button"
                        className="license-action-btn"
                        onClick={() => openDetail(r)}
                        title="Ver detalle"
                        aria-label="Ver detalle"
                      >
                        <i className="pi pi-eye" />
                      </button>
                    )}
                  />
                </DataTable>
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
            <div>
              <div className="license-dialog-title">{licensesForDetail[0]?.descripcion}</div>
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
        <DataTable
          value={licensesForDetail}
          className="p-datatable-sm license-table"
          paginator
          rows={10}
        >
          <Column
            field="fecha_inicio"
            header="FECHA INICIO"
            body={(r) => (
              <span className="license-date-cell">
                {r.fecha_inicio}
              </span>
            )}
          />
          <Column
            field="fecha_finaliz"
            header="FECHA FIN"
            body={(r) => (
              <span className="license-date-cell">
                {r.fecha_finaliz}
              </span>
            )}
          />
          <Column
            field="dias_computados"
            header="DÍAS"
            body={(r) => <DayBadge days={r.dias_computados} />}
          />
          <Column
            field="norma_aprobatoria"
            header="NORMA APROBATORIA"
            body={(r) => <span className="license-cell-secondary">{r.norma_aprobatoria}</span>}
          />
        </DataTable>
      </Dialog>
    </>
  );
}
