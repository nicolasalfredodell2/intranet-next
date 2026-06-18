"use client";

import { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { loadDailyPart } from "@/lib/services/daily-part.service";

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function IncomePage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const day = now.getDate();
  const month = now.getUTCMonth();
  const year = now.getFullYear();

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    if (loading) return;
    setLoading(true);
    try {
      const resp = await loadDailyPart({ user_authenticated: true });
      let rows: any[] = Object.values(resp[0]);
      rows = rows.map((r: any) => {
        r.is_late_string = r.is_late == 1 ? "Si" : "No";
        r.hour_in_diff = r.hour_in_diff
          ? `${Math.floor(r.hour_in_diff / 60)}:${r.hour_in_diff % 60 >= 0 && r.hour_in_diff % 60 < 10 ? `0${r.hour_in_diff % 60}` : r.hour_in_diff % 60} Hs.`
          : "0:00 Hs.";
        r.check = r.check.replaceAll(",", " / ");
        return r;
      });
      setItems(rows);
    } catch {
      // silently fail - just show empty table
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animated fadeIn">
      <div className="row page-titles">
        <div className="align-self-center col-md-5">
          <h3 className="text-themecolor">Fichadas Diarias</h3>
        </div>
      </div>

      <div className="row">
        <div className="col-md-12">
          <div className="card card-body">
            <p className="mt-3">Parte diario de hoy, {day} de {MONTHS[month]} de {year}</p>
            <DataTable value={items} loading={loading} className="p-datatable-sm" rows={1} showGridlines>
              <Column field="file" header="Legajo" body={(r) => <small>{r.file}</small>} />
              <Column field="lastname_name" header="Nombre" body={(r) => <small>{r.lastname_name}</small>} />
              <Column field="is_late_string" header="Llegó tarde" body={(r) => <small>{r.is_late_string}</small>} />
              <Column field="hour_in_diff" header="Tiempo excedido" body={(r) => <small>{r.hour_in_diff}</small>} />
              <Column field="check" header="Fichadas del día" body={(r) => <small>{r.check}</small>} />
              <Column header="Horario laboral" body={(r) => <small>{r.working?.hour_in} - {r.working?.hour_out}</small>} />
            </DataTable>
          </div>
        </div>
      </div>
    </div>
  );
}
