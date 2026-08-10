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

function formatLongDate(value: string): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleString("es-AR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatDate(value: string): string {
  const datePart = value.split(/[T ]/)[0];
  const [y, m, d] = datePart.split("-");
  return `${d}/${m}/${y}`;
}

function formatShortDate(value: string): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function parseValues(value: unknown): Record<string, any> {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  return value as Record<string, any>;
}

function getColumnLabel(audit: any): string {
  if (audit.event === "created") return "Todas";
  const newValues = parseValues(audit.new_values);
  if (newValues.status) return "Estado";
  if (newValues.start_time) return "Ingreso";
  if (newValues.end_time) return "Egreso";
  if (newValues.shift) return "Tipo";
  return "";
}

function getValueLabel(audit: any): string {
  if (audit.event === "created") return "Creación overtime";
  const newValues = parseValues(audit.new_values);
  if (newValues.status) return STATUS_LABELS[newValues.status] ?? newValues.status;
  if (newValues.start_time) return formatLongDate(newValues.start_time);
  if (newValues.end_time) return formatLongDate(newValues.end_time);
  if (newValues.shift) return newValues.shift;
  return "";
}

interface Props {
  visible: boolean;
  onHide: () => void;
  audits: any[];
  date?: string;
}

export default function OvertimesAuditsDialog({ visible, onHide, audits, date }: Props) {
  const dialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <History size={18} color="#eab308" />
      </div>
      <div style={{ minWidth: 0 }}>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Auditorías</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{date ? formatDate(date) : ""}</small>
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
