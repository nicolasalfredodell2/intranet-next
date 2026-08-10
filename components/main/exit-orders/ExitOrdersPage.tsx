"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { ProgressBar } from "primereact/progressbar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Sidebar } from "primereact/sidebar";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
import { addLocale } from "primereact/api";
import { DoorOpen, FileSpreadsheet, FileText, Search, List } from "lucide-react";
import { loadExitOrdersMonthlyReport } from "@/lib/services/exit-orders-report.service";
import ExitOrdersDetailsDialog from "./ExitOrdersDetailsDialog";

addLocale("es", {
  firstDayOfWeek: 1,
  dayNames: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
  dayNamesShort: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
  dayNamesMin: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"],
  monthNames: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  monthNamesShort: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
  today: "Hoy",
  now: "Ahora",
  clear: "Limpiar",
});

const MIN_YEAR = 1990;

const MONTH_NAMES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

const ICON_BTN_STYLE = { background: "none", borderRadius: "8px", padding: "4px 8px", cursor: "pointer", display: "inline-flex", alignItems: "center" } as const;

const EXCEEDED_COLORS = {
  muted: { bg: "rgba(100,116,139,0.10)", color: "#64748b" },
  danger: { bg: "rgba(220,53,69,0.10)", color: "#dc3545" },
};

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

function formatMinutes(minutes: number | null | undefined): string {
  const value = Number(minutes) || 0;
  const h = Math.floor(value / 60);
  const m = value % 60;
  return `${h}:${m >= 0 && m < 10 ? `0${m}` : m} Hs.`;
}

function normalizeReport(report: any) {
  return {
    ...report,
    people_lastname_name: report.people?.lastname_name ?? "",
    minutesInNumber: Number(report.minutes) || 0,
    exceededInNumber: Number(report.exceeded) || 0,
    minutes: formatMinutes(report.minutes),
    exceeded: formatMinutes(report.exceeded),
  };
}

export default function ExitOrdersPage() {
  const toast = useRef<Toast>(null);

  const now = new Date();
  const actuallyYear = now.getFullYear();

  const [year, setYear] = useState<number>(actuallyYear);
  const [month, setMonth] = useState<number>(now.getMonth() + 1);

  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nameFilter, setNameFilter] = useState("");
  const [onlyExceeded, setOnlyExceeded] = useState(false);
  const [first, setFirst] = useState(0);

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const [isOpenModalDetails, setIsOpenModalDetails] = useState(false);
  const [userSelected, setUserSelected] = useState<any>(null);

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadReports() {
    if (!year || !month) return;
    setIsLoading(true);
    setFirst(0);
    setNameFilter("");
    try {
      const resp = await loadExitOrdersMonthlyReport({ year, month });
      const data = Array.isArray(resp) ? resp : [];
      setReports(data.map(normalizeReport));
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudo cargar los reportes de las órdenes de salida", detail: err.message });
    } finally {
      setIsLoading(false);
    }
  }

  const filtered = reports.filter((item) => {
    if (nameFilter && !String(item.people_lastname_name ?? "").toLowerCase().includes(nameFilter.toLowerCase())) return false;
    if (onlyExceeded && item.exceededInNumber === 0) return false;
    return true;
  });

  function buildExportRows() {
    return filtered.map((item) => ({
      "Agente": item.people_lastname_name,
      "Suma total de salidas": item.minutes,
      "Tiempo excedido": item.exceeded,
    }));
  }

  async function exportExcel() {
    const ExcelJS = await import("exceljs");
    const rows = buildExportRows();
    const headers = rows.length > 0 ? Object.keys(rows[0]) : ["Agente", "Suma total de salidas", "Tiempo excedido"];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Órdenes de salidas");

    worksheet.columns = headers.map((header) => {
      const maxLen = rows.reduce((max, row) => Math.max(max, String((row as any)[header] ?? "").length), header.length);
      return { header, key: header, width: Math.min(Math.max(maxLen + 2, 10), 40) };
    });

    rows.forEach((row) => worksheet.addRow(row));

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { color: { argb: "FF64748B" }, bold: true };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Órdenes de salidas de ${MONTH_NAMES[month - 1]} de ${year}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function loadAsDataUrl(path: string): Promise<string | null> {
    try {
      const res = await fetch(path);
      const blob = await res.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  async function exportPdf() {
    setIsGeneratingPdf(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF();
      const logo = await loadAsDataUrl("/img/trib-cuentas-escudo.png");
      const fontDataUrl = await loadAsDataUrl("/fonts/Montserrat-Variable.ttf");
      const fontBase64 = fontDataUrl?.split(",")[1] ?? null;

      let fontName = "helvetica";
      if (fontBase64) {
        doc.addFileToVFS("Montserrat.ttf", fontBase64);
        doc.addFont("Montserrat.ttf", "Montserrat", "normal");
        fontName = "Montserrat";
      }
      doc.setFont(fontName, "normal");

      const pageWidth = doc.internal.pageSize.getWidth();
      const marginX = 14;
      const textX = marginX + (logo ? 20 : 0);

      if (logo) doc.addImage(logo, "PNG", marginX, 10, 16, 16);

      doc.setFontSize(15);
      doc.setTextColor(30, 41, 59);
      doc.text("Tribunal de Cuentas de Río Negro", textX, 17);

      doc.setFontSize(10.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Órdenes de salidas de ${MONTH_NAMES[month - 1]} de ${year}`, textX, 23.5);

      doc.setDrawColor(100, 116, 139);
      doc.setLineWidth(0.6);
      doc.line(marginX, 29, pageWidth - marginX, 29);

      autoTable(doc, {
        startY: 35,
        head: [["Agente", "Suma total de salidas", "Tiempo excedido"]],
        body: buildExportRows().map((r) => Object.values(r)),
        margin: { left: marginX, right: marginX },
        styles: { font: fontName, fontSize: 8.5, cellPadding: 3, textColor: [51, 65, 85] },
        headStyles: { fillColor: [100, 116, 139], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      const blob = doc.output("blob");
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(URL.createObjectURL(blob));
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo generar el PDF" });
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  function closePdfPreview() {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
  }

  function openModalDetails(report: any) {
    setUserSelected(report.people);
    setIsOpenModalDetails(true);
  }

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />

      <div className="fadeIn animated">

        {/* Header card */}
        <div className="card profile-card">
          <div className="d-flex align-items-center flex-wrap px-3 pt-3 pb-3" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <DoorOpen size={18} color="#eab308" />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Órdenes de salidas</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Tiempo excedido en salidas por agente</small>
            </div>
            {!isLoading && reports.length > 0 && (
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
                  disabled={isGeneratingPdf}
                  onClick={exportPdf}
                  className="btn btn-light d-flex align-items-center"
                  style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.82rem", padding: "5px 14px", color: "#dc3545" }}
                >
                  {isGeneratingPdf ? <i className="pi pi-spin pi-spinner" style={{ fontSize: "0.78rem" }} /> : <FileText size={14} />}
                  PDF
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filters card */}
        <div className="card profile-card mt-4">
          <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Search size={18} color="#eab308" />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Buscar órdenes de salidas</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Seleccioná el año y mes para consultar el listado</small>
            </div>
          </div>
          <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />
          <div className="card-body" style={{ padding: "16px 20px 20px" }}>
            <div className="row">
              <div className="col-12 col-md-6 mb-3">
                <label className="profile-field-label">Mes y año *</label>
                <div className="license-filter-input-wrap profile-birthdate-wrap">
                  <i className="pi pi-calendar license-filter-icon" />
                  <Calendar
                    value={year && month ? new Date(year, month - 1, 1) : null}
                    onChange={(e) => {
                      const date = e.value as Date | null;
                      setYear(date ? date.getFullYear() : 0);
                      setMonth(date ? date.getMonth() + 1 : 0);
                    }}
                    view="month"
                    dateFormat="mm/yy"
                    locale="es"
                    minDate={new Date(MIN_YEAR, 0, 1)}
                    maxDate={new Date(actuallyYear, now.getMonth(), 1)}
                    placeholder="Mes y año"
                    className="license-filter-dropdown"
                    panelClassName="license-filter-dropdown-panel license-filter-calendar-panel"
                  />
                </div>
              </div>
            </div>

            <div className="d-flex align-items-center mt-2" style={{ gap: "8px" }}>
              <button
                type="button"
                disabled={isLoading || !year || !month || month < 1 || month > 12}
                onClick={loadReports}
                className="btn btn-primary d-flex align-items-center"
                style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
              >
                <i className={isLoading ? "pi pi-spin pi-spinner" : "pi pi-search"} style={{ fontSize: "0.78rem" }} />
                {isLoading ? "Buscando..." : "Buscar"}
              </button>
            </div>
          </div>
        </div>

        {/* List card */}
        <div className="card profile-card mt-4">
          <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <List size={18} color="#eab308" />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Listado de órdenes de salidas</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Suma total de salidas y tiempo excedido por agente</small>
            </div>
            <button
              type="button"
              disabled={isLoading}
              onClick={loadReports}
              className="btn btn-light d-flex align-items-center"
              style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.82rem", padding: "5px 14px", color: "#64748b" }}
            >
              <i className={isLoading ? "pi pi-spin pi-spinner" : "pi pi-refresh"} style={{ fontSize: "0.78rem" }} />
              Recargar
            </button>
          </div>
          <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />
          <div className="card-body" style={{ padding: "16px 20px 20px" }}>
            <div className="license-filter-bar mb-3">
              <div className="license-filter-bar-inputs">
                <div className={`license-filter-input-wrap${nameFilter ? " license-filter-input-wrap--active" : ""}`}>
                  <i className="pi pi-search license-filter-icon" />
                  <input
                    className="license-filter-input"
                    style={{ paddingLeft: "32px" }}
                    placeholder="Buscar por nombre…"
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                  />
                </div>
                <div className="d-flex align-items-center" style={{ gap: "8px" }}>
                  <Checkbox inputId="onlyExceeded" checked={onlyExceeded} onChange={(e) => setOnlyExceeded(!!e.checked)} />
                  <label htmlFor="onlyExceeded" style={{ fontSize: "0.82rem", color: "#374151", cursor: "pointer", marginBottom: 0 }}>
                    Solo excedidos
                  </label>
                </div>
              </div>
              {nameFilter && (
                <button type="button" className="license-filter-clear" onClick={() => setNameFilter("")}>
                  <i className="pi pi-filter-slash" /> Limpiar filtros
                </button>
              )}
            </div>

            {isLoading && <ProgressBar mode="indeterminate" style={{ height: "6px" }} className="mb-3" />}

            <DataTable
              value={filtered}
              loading={isLoading}
              sortField="people_lastname_name"
              sortOrder={1}
              paginator
              first={first}
              onPage={(e) => setFirst(e.first)}
              rows={10}
              rowsPerPageOptions={[10, 25, 50]}
              paginatorRight={
                <span style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 500 }}>
                  {filtered.length} {filtered.length === 1 ? "agente" : "agentes"}
                </span>
              }
              className="p-datatable-sm license-table"
              emptyMessage={
                <div className="license-empty">
                  <i className="pi pi-inbox" />
                  <p>No hay órdenes de salidas para el mes y año</p>
                </div>
              }
            >
              <Column header="AGENTE" sortable field="people_lastname_name" body={(item) => <small>{item.people_lastname_name}</small>} />
              <Column header="SUMA TOTAL DE SALIDAS" sortable field="minutesInNumber" style={{ width: "16%" }} body={(item) => <small className="p-1">{item.minutes}</small>} />
              <Column
                header="TIEMPO EXCEDIDO"
                sortable
                field="exceededInNumber"
                style={{ width: "16%" }}
                body={(item) => {
                  const colors = item.exceededInNumber === 0 ? EXCEEDED_COLORS.muted : EXCEEDED_COLORS.danger;
                  return (
                    <span className="badge rounded-pill" style={{ background: colors.bg, color: colors.color, border: "none", fontWeight: 600, padding: "4px 10px" }}>
                      {item.exceeded}
                    </span>
                  );
                }}
              />
              <Column
                header=""
                style={{ width: "12%" }}
                body={(item) =>
                  item.minutesInNumber !== 0 || item.exceededInNumber !== 0 ? (
                    <Tooltip label="Ver detalle">
                      <button type="button" onClick={() => openModalDetails(item)} style={{ ...ICON_BTN_STYLE, border: "1.5px solid #e2e8f0", color: "#64748b" }}>
                        <i className="pi pi-external-link" style={{ fontSize: "0.85rem" }} />
                      </button>
                    </Tooltip>
                  ) : null
                }
              />
            </DataTable>
          </div>
        </div>
      </div>

      <Sidebar
        visible={!!pdfUrl}
        onHide={closePdfPreview}
        position="right"
        dismissable
        style={{ width: "min(700px, 92vw)", display: "flex", flexDirection: "column" }}
        header={
          <div className="d-flex align-items-center" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fff1f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <FileText size={18} color="#dc3545" />
            </div>
            <div style={{ minWidth: 0 }}>
              <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Órdenes de salidas</p>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{MONTH_NAMES[month - 1]} de {year}</small>
            </div>
          </div>
        }
        pt={{ content: { style: { flex: 1, padding: 0, display: "flex", height: "100%" } } }}
      >
        {pdfUrl && <iframe src={pdfUrl} style={{ flex: 1, width: "100%", border: "none" }} title="Órdenes de salidas PDF" />}
      </Sidebar>

      <ExitOrdersDetailsDialog
        visible={isOpenModalDetails}
        onHide={() => setIsOpenModalDetails(false)}
        user={userSelected}
        year={year}
        month={month}
      />
    </>
  );
}