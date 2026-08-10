"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Clock } from "lucide-react";
import { loadTimeclockRecords } from "@/lib/services/timeclock.service";

function formatDate(dateStr: string): string {
  const datePart = dateStr.split(/[T ]/)[0];
  const [y, m, d] = datePart.split("-");
  return `${d}/${m}/${y}`;
}

function hostLabel(host: string | undefined | null): string {
  if (host === "RF_IN") return "Reloj de Entrada";
  if (host === "RF_OUT") return "Reloj de salida";
  return host ? host : "AUTOMÁTICO";
}

interface Props {
  visible: boolean;
  onHide: () => void;
  exitOrder: any;
}

export default function ExitOrdersTimeStampsDialog({ visible, onHide, exitOrder }: Props) {
  const toast = useRef<Toast>(null);
  const [timeStamps, setTimeStamps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function loadTimeStamps(current: any) {
    setIsLoading(true);
    try {
      const date = current.departure_hour.split(/[T ]/)[0];
      const file = current.people?.file;
      const resp = await loadTimeclockRecords({ date, limit: 500 });
      const records = (resp.data ?? []).filter((r: any) => {
        const recordFile = r.file ?? r.people?.file;
        return String(recordFile) === String(file) && Number(r.group) !== 3;
      });
      setTimeStamps(records);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudieron cargar detalles", detail: err.message });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!exitOrder) return;
    loadTimeStamps(exitOrder);
  }, [exitOrder]);

  const dialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Clock size={18} color="#eab308" />
      </div>
      <div style={{ minWidth: 0 }}>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Fichadas del día</p>
        <div className="d-flex align-items-center flex-wrap" style={{ gap: "6px" }}>
          {exitOrder?.people?.lastname_name && <span className="license-dialog-year-badge">{exitOrder.people.lastname_name}</span>}
          {exitOrder?.departure_hour && <span className="license-dialog-year-badge">{formatDate(exitOrder.departure_hour)}</span>}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />

      <Dialog header={dialogHeader} visible={visible} position="bottom" draggable={false} dismissableMask onHide={onHide} style={{ width: "30vw" }}>
        <DataTable
          value={timeStamps}
          loading={isLoading}
          scrollable
          scrollHeight="400px"
          className="p-datatable-sm license-table"
          emptyMessage={
            <div className="license-empty">
              <i className="pi pi-inbox" />
              <p>No hay fichadas</p>
            </div>
          }
        >
          <Column header="RELOJ" body={(timeStamp) => hostLabel(timeStamp.host)} />
          <Column header="HORARIO" body={(timeStamp) => timeStamp.hours} />
        </DataTable>
      </Dialog>
    </>
  );
}
