"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { loadTimeclockRecords } from "@/lib/services/timeclock.service";

interface Props {
  visible: boolean;
  onHide: () => void;
  overtime: any;
}

export default function OvertimesTimeStampsDialog({ visible, onHide, overtime }: Props) {
  const toast = useRef<Toast>(null);
  const [timeStamps, setTimeStamps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function loadTimeStamps(currentOvertime: any) {
    setIsLoading(true);
    try {
      const date = currentOvertime.start_time.split(/[T ]/)[0];
      const file = currentOvertime.people?.file;
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
    if (!overtime) return;
    loadTimeStamps(overtime);
  }, [overtime]);

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />

      <Dialog header=" " visible={visible} position="bottom" draggable onHide={onHide} style={{ width: "30vw" }}>
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
          <Column header="RELOJ" body={(timeStamp) => timeStamp.host ? timeStamp.host : "AUTOMÁTICO"} />
          <Column header="HORARIO" body={(timeStamp) => timeStamp.hours} />
        </DataTable>
      </Dialog>
    </>
  );
}