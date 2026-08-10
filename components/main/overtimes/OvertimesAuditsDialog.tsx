"use client";

import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

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

function formatShortDate(value: string): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getColumnLabel(audit: any): string {
  if (audit.event === "created") return "Todas";
  if (audit.new_values?.status) return "Estado";
  if (audit.new_values?.start_time) return "Ingreso";
  if (audit.new_values?.end_time) return "Egreso";
  if (audit.new_values?.shift) return "Tipo";
  return "";
}

function getValueLabel(audit: any): string {
  if (audit.event === "created") return "Creación overtime";
  if (audit.new_values?.status) return STATUS_LABELS[audit.new_values.status] ?? audit.new_values.status;
  if (audit.new_values?.start_time) return formatLongDate(audit.new_values.start_time);
  if (audit.new_values?.end_time) return formatLongDate(audit.new_values.end_time);
  if (audit.new_values?.shift) return audit.new_values.shift;
  return "";
}

interface Props {
  visible: boolean;
  onHide: () => void;
  audits: any[];
}

export default function OvertimesAuditsDialog({ visible, onHide, audits }: Props) {
  return (
    <Dialog header="Auditorías" visible={visible} position="bottom" draggable={false} onHide={onHide} style={{ width: "60vw" }}>
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
