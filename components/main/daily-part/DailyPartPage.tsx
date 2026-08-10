"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { ProgressBar } from "primereact/progressbar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { CalendarCheck, FileSpreadsheet, FileText } from "lucide-react";
import { loadDailyPart } from "@/lib/services/daily-part.service";

const MONTH_NAMES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

const LATE_OPTIONS = [
  { label: "Sí", value: "Si" },
  { label: "No", value: "No" },
];

function formatHourInDiff(minutes: number | null | undefined): string {
  if (!minutes) return "0:00 Hs.";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m >= 0 && m < 10 ? `0${m}` : m} Hs.`;
}

function normalizeReportItem(item: any) {
  return {
    ...item,
    is_late_string: item.is_late == 1 ? "Si" : "No",
    hour_in_diff: formatHourInDiff(item.hour_in_diff),
    check: (item.check ?? "").replaceAll(",", " / "),
  };
}

export default function DailyPartPage() {
  const toast = useRef<Toast>(null);

  const today = new Date();
  const day = today.getDate();
  const month = today.getUTCMonth();
  const year = today.getFullYear();

  const [reportDaily, setReportDaily] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [fileFilter, setFileFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [lateFilter, setLateFilter] = useState("");

  useEffect(() => {
    loadReportDaily();
  }, []);

  async function loadReportDaily() {
    setIsLoading(true);
    try {
      const resp = await loadDailyPart();
      const data = resp?.[0] ? Object.values(resp[0]) : [];
      setReportDaily(data.map(normalizeReportItem));
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudo cargar el parte diario", detail: err.message });
    } finally {
      setIsLoading(false);
    }
  }

  function clearFilters() {
    setFileFilter("");
    setNameFilter("");
    setLateFilter("");
  }

  function handleFileFilterChange(value: string) {
    setFileFilter(value.replace(/\D/g, "").slice(0, 3));
  }

  function handleNameFilterChange(value: string) {
    setNameFilter(value.replace(/[^a-zA-ZÀ-ÿ\s]/g, "").slice(0, 20));
  }

  const filtered = reportDaily.filter((item) => {
    if (fileFilter && !String(item.file ?? "").toLowerCase().includes(fileFilter.toLowerCase())) return false;
    if (nameFilter && !String(item.lastname_name ?? "").toLowerCase().includes(nameFilter.toLowerCase())) return false;
    if (lateFilter && item.is_late_string !== lateFilter) return false;
    return true;
  });

  function buildExportRows() {
    return filtered.map((item) => ({
      "Legajo": item.file,
      "Nombre": item.lastname_name,
      "Llegó tarde": item.is_late_string,
      "Tiempo excedido": item.hour_in_diff,
      "Fichadas del día": item.check,
      "Horario laboral": `${item.working?.hour_in ?? ""} - ${item.working?.hour_out ?? ""}`,
    }));
  }

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(buildExportRows());
    const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
    XLSX.writeFile(workbook as any, `Parte diario del ${day} de ${MONTH_NAMES[month]} de ${year}.xlsx`);
  }

  async function exportPdf() {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF();
    autoTable(doc, { head: [["Legajo", "Nombre", "Llegó tarde", "Tiempo excedido", "Fichadas del día", "Horario laboral"]], body: buildExportRows().map((r) => Object.values(r)) });
    doc.save(`Parte diario del ${day} de ${MONTH_NAMES[month]} de ${year}.pdf`);
  }

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />

      <div className="fadeIn animated">

        {/* Header card */}
        <div className="card profile-card">
          <div className="d-flex align-items-center flex-wrap px-3 pt-3 pb-3" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <CalendarCheck size={18} color="#eab308" />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Parte diario</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Hoy, {day} de {MONTH_NAMES[month]} de {year}</small>
            </div>
            {!isLoading && reportDaily.length > 0 && (
              <div className="d-flex align-items-center" style={{ gap: "8px" }}>
                <button
                  type="button"
                  onClick={exportExcel}
                  className="btn btn-light d-flex align-items-center"
                  style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.82rem", padding: "5px 14px", color: "#059669" }}
                >
                  <FileSpreadsheet size={14} />
                  Excel
                </button>
                <button
                  type="button"
                  onClick={exportPdf}
                  className="btn btn-light d-flex align-items-center"
                  style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.82rem", padding: "5px 14px", color: "#dc3545" }}
                >
                  <FileText size={14} />
                  PDF
                </button>
              </div>
            )}
          </div>
        </div>

        {/* List card */}
        <div className="card profile-card mt-4">
          <div className="card-body">
            <div className="license-filter-bar mb-3">
              <div className="license-filter-bar-inputs">
                <div className={`license-filter-input-wrap${fileFilter ? " license-filter-input-wrap--active" : ""}`}>
                  <i className="pi pi-id-card license-filter-icon" />
                  <input
                    className="license-filter-input"
                    style={{ paddingLeft: "32px" }}
                    placeholder="Buscar por legajo…"
                    inputMode="numeric"
                    maxLength={3}
                    value={fileFilter}
                    onChange={(e) => handleFileFilterChange(e.target.value)}
                  />
                </div>
                <div className={`license-filter-input-wrap${nameFilter ? " license-filter-input-wrap--active" : ""}`}>
                  <i className="pi pi-search license-filter-icon" />
                  <input
                    className="license-filter-input"
                    style={{ paddingLeft: "32px" }}
                    placeholder="Buscar por nombre…"
                    maxLength={20}
                    value={nameFilter}
                    onChange={(e) => handleNameFilterChange(e.target.value)}
                  />
                </div>
                <div className={`license-filter-input-wrap${lateFilter ? " license-filter-input-wrap--active" : ""}`}>
                  <i className="pi pi-clock license-filter-icon" />
                  <Dropdown
                    value={lateFilter || null}
                    options={LATE_OPTIONS}
                    onChange={(e) => setLateFilter(e.value ?? "")}
                    placeholder="Llegó tarde"
                    showClear
                    className="license-filter-dropdown"
                    panelClassName="license-filter-dropdown-panel"
                  />
                </div>
              </div>
              {(fileFilter || nameFilter || lateFilter) && (
                <button type="button" className="license-filter-clear" onClick={clearFilters}>
                  <i className="pi pi-filter-slash" /> Limpiar filtros
                </button>
              )}
            </div>

            {isLoading && <ProgressBar mode="indeterminate" style={{ height: "6px" }} className="mb-3" />}

            <DataTable
              value={filtered}
              loading={isLoading}
              sortField="file"
              sortOrder={1}
              paginator
              rows={10}
              rowsPerPageOptions={[10, 25, 50]}
              className="p-datatable-sm license-table"
              emptyMessage={
                <div className="license-empty">
                  <i className="pi pi-inbox" />
                  <p>No hay fichadas para mostrar</p>
                </div>
              }
            >
              <Column header="LEGAJO" sortable field="file" style={{ width: "8%" }} body={(item) => <small>{item.file}</small>} />
              <Column header="NOMBRE" sortable field="lastname_name" body={(item) => <small>{item.lastname_name}</small>} />
              <Column
                header="LLEGÓ TARDE"
                sortable
                field="is_late_string"
                style={{ width: "10%" }}
                body={(item) => (
                  <span
                    className="badge rounded-pill"
                    style={{ background: item.is_late_string === "Si" ? "rgba(220,53,69,0.10)" : "rgba(5,150,105,0.10)", color: item.is_late_string === "Si" ? "#dc3545" : "#059669", border: "none", fontWeight: 600, padding: "4px 10px" }}
                  >
                    {item.is_late_string === "Si" ? "Sí" : "No"}
                  </span>
                )}
              />
              <Column header="TIEMPO EXCEDIDO" body={(item) => <small>{item.hour_in_diff}</small>} />
              <Column header="FICHADAS DEL DÍA" body={(item) => <small>{item.check}</small>} />
              <Column header="HORARIO LABORAL" body={(item) => <small>{item.working?.hour_in} - {item.working?.hour_out}</small>} />
            </DataTable>
          </div>
        </div>
      </div>
    </>
  );
}