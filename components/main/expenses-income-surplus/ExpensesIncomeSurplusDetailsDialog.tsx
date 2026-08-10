"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Clock } from "lucide-react";
import { changeJustified, loadDetailReportForIncomeAndExpenses } from "@/lib/services/expenses-income-surplus.service";

const STATUS_BADGE_COLORS: Record<string, { bg: string; color: string }> = {
  success: { bg: "rgba(5,150,105,0.10)", color: "#059669" },
  danger: { bg: "rgba(220,53,69,0.10)", color: "#dc3545" },
};

function formatDate(dateStr: string): string {
  const datePart = dateStr.split(/[T ]/)[0];
  const [y, m, d] = datePart.split("-");
  return `${d}/${m}/${y}`;
}

function addTime(horaStr: string, minutos: number, segundos: number): Date {
  const [horas, mins, secs] = horaStr.split(":").map(Number);
  const fecha = new Date();
  fecha.setHours(horas, mins, secs, 0);
  fecha.setMinutes(fecha.getMinutes() + minutos);
  fecha.setSeconds(fecha.getSeconds() + segundos);
  return fecha;
}

function compareHours(horaStr1: string, horaStr2: string): boolean {
  const [h1, m1, s1] = horaStr1.split(":").map(Number);
  const [h2, m2, s2] = horaStr2.split(":").map(Number);
  const fecha1 = new Date();
  fecha1.setHours(h1, m1, s1, 0);
  const fecha2 = new Date();
  fecha2.setHours(h2, m2, s2, 0);
  return fecha1 <= fecha2;
}

function filterDetails(data: any[]): any[] {
  return data
    .filter((arrival: any) => {
      if (arrival.difference_minutes != 0 && arrival.difference_minutes != null) return true;

      const createdAt = new Date(arrival.created_at);
      const today = new Date();
      const isToday =
        today.getFullYear() === createdAt.getFullYear() &&
        today.getMonth() === createdAt.getMonth() &&
        today.getDate() === createdAt.getDate();
      if (!isToday) return false;

      const limit = addTime(arrival.hour_in, 10, 59).toTimeString().slice(0, 8);
      return !compareHours(arrival.hours, limit);
    })
    .reverse();
}

interface Props {
  visible: boolean;
  onHide: () => void;
  user: any;
  year: number;
  month: number;
}

export default function ExpensesIncomeSurplusDetailsDialog({ visible, onHide, user, year, month }: Props) {
  const toast = useRef<Toast>(null);

  const [detailsUser, setDetailsUser] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChangingJustified, setIsChangingJustified] = useState(false);

  async function loadUserDetail() {
    setIsLoading(true);
    try {
      const resp = await loadDetailReportForIncomeAndExpenses({ user_id: user.id, year, month });
      setDetailsUser(filterDetails(resp[0] ?? []));
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudieron cargar detalles de los reportes del usuario", detail: err.message });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!visible || !user) return;
    loadUserDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, user, year, month]);

  async function changeNotified(userDetail: any) {
    setIsChangingJustified(true);
    try {
      await changeJustified(userDetail.id);
      setDetailsUser((prev) => prev.map((d) => (d.id === userDetail.id ? { ...d, justified: d.justified ? 0 : 1 } : d)));
      toast.current?.show({ severity: "success", summary: "Cambio realizado" });
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo cambiar", detail: "Inténtelo de nuevo" });
    } finally {
      setIsChangingJustified(false);
    }
  }

  const dialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Clock size={18} color="#eab308" />
      </div>
      <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>
        {isLoading ? "Cargando detalles de" : "Detalles de"} {user?.lastname_name}
      </p>
    </div>
  );

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />

      <Dialog header={dialogHeader} visible={visible} draggable={false} modal dismissableMask onHide={onHide} style={{ width: "95vw" }}>
        <DataTable
          value={detailsUser}
          loading={isLoading}
          scrollable
          scrollHeight="400px"
          className="p-datatable-sm license-table"
          emptyMessage={
            <div className="license-empty">
              <i className="pi pi-inbox" />
              <p>No hay detalles para mostrar</p>
            </div>
          }
        >
          <Column header="DÍA" body={(detail) => <small>{detail.date && formatDate(detail.date)}</small>} />
          <Column header="HORARIO LABORAL" body={(detail) => <small>{detail.hour_in} / {detail.hour_out}</small>} />
          <Column header="INGRESO" body={(detail) => <small>{detail.hours}</small>} />
          <Column header="DIFERENCIA" body={(detail) => <small>{detail.difference_minutes}</small>} />
          <Column
            header="JUSTIFICADA"
            body={(detail) =>
              isChangingJustified ? (
                <i className="pi pi-spin pi-spinner" />
              ) : (
                <span
                  className="badge rounded-pill pointer"
                  onClick={() => changeNotified(detail)}
                  style={{
                    background: (detail.justified ? STATUS_BADGE_COLORS.success : STATUS_BADGE_COLORS.danger).bg,
                    color: (detail.justified ? STATUS_BADGE_COLORS.success : STATUS_BADGE_COLORS.danger).color,
                    border: "none",
                    fontWeight: 600,
                    padding: "4px 10px",
                  }}
                >
                  {detail.justified ? "Sí" : "No"}
                </span>
              )
            }
          />
        </DataTable>
      </Dialog>
    </>
  );
}
