"use client";

import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { History } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  Done: "Finalizado",
  Waiting: "En espera",
  Pending: "Pendiente de aprobación",
  Cancel: "Cancelado",
};

const TYPE_LABELS: Record<string, string> = {
  Unexpected: "Sin orden de salida",
  Individuals: "Particular",
  Officials: "Oficial",
  Guild_Meeting_Attendance: "Asamblea",
  Education: "Licencia por estudio/capacitación",
  Health: "Salud o cuidado familiar",
  Maternity_Breastfeeding: "Lactancia - Maternidad",
  Others_Justify: "Otras justificaciones",
};

function formatDate(value: string): string {
  const datePart = value.split(/[T ]/)[0];
  const [y, m, d] = datePart.split("-");
  return `${d}/${m}/${y}`;
}

function formatLongDate(value: string): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleString("es-AR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatShortDate(value: string): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getColumnLabel(audit: any): string {
  if (audit.event === "created") return "Todas";
  if (audit.new_values?.status) return "Estado";
  if (audit.new_values?.arrival_hour) return "Ingreso";
  if (audit.new_values?.departure_hour) return "Egreso";
  if (audit.new_values?.type) return "Tipo";
  return "";
}

function getValueLabel(audit: any): string {
  if (audit.event === "created") return "Creación orden de salida";
  if (audit.new_values?.status) return STATUS_LABELS[audit.new_values.status] ?? audit.new_values.status;
  if (audit.new_values?.arrival_hour) return formatLongDate(audit.new_values.arrival_hour);
  if (audit.new_values?.departure_hour) return formatLongDate(audit.new_values.departure_hour);
  if (audit.new_values?.type) return TYPE_LABELS[audit.new_values.type] ?? audit.new_values.type;
  return "";
}

interface Props {
  visible: boolean;
  onHide: () => void;
  audits: any[];
  date?: string;
  agentName?: string;
}

export default function ExitOrdersAuditsDialog({ visible, onHide, audits, date, agentName }: Props) {
  const dialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <History size={18} color="#eab308" />
      </div>
      <div style={{ minWidth: 0 }}>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Auditorías</p>
        <div className="d-flex align-items-center flex-wrap" style={{ gap: "6px" }}>
          {agentName && <span className="license-dialog-year-badge">{agentName}</span>}
          {date && <span className="license-dialog-year-badge">{formatDate(date)}</span>}
        </div>
      </div>
    </div>
  );

  return (
    <Dialog header={dialogHeader} visible={visible} position="bottom" draggable={false} dismissableMask onHide={onHide} style={{ width: "60vw" }}>
      <DataTable
        value={audits}
        scrollable
        scrollHeight="400px"
        className="p-datatable-sm license-table"
        emptyMessage={
          <div className="license-empty">
            <i className="pi pi-inbox" />
            <p>No hay auditorías</p>
          </div>
        }
      >
        <Column header="COLUMNA" body={(audit) => getColumnLabel(audit)} />
        <Column header="ESTADO ACTUAL" body={(audit) => getValueLabel(audit)} />
        <Column header="USUARIO ACTUALIZÓ" body={(audit) => (audit.user_name === "Sistema" ? "Automático" : audit.user_name)} />
        <Column header="FECHA/HORA ACTUALIZACIÓN" body={(audit) => formatShortDate(audit.updated_at)} />
      </DataTable>
    </Dialog>
  );
}
