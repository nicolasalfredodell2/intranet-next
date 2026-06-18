"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { loadLicenses } from "@/lib/services/license.service";

interface Filters {
  articulo: string;
  descripcion: string;
  norma_aprobatoria: string;
  anio_ref: string;
  cant: string;
}

function formatDate(d: string) {
  return d.split("-").reverse().join("/").replace("-", "/").replace("-", "/");
}

export default function LicensePage() {
  const toast = useRef<Toast>(null);
  const [loading, setLoading] = useState(false);
  const [licensesCompact, setLicensesCompact] = useState<any[]>([]);
  const [licensesTotal, setLicensesTotal] = useState<any[]>([]);
  const [licensesForDetail, setLicensesForDetail] = useState<any[]>([]);
  const [showDetail, setShowDetail] = useState(false);
  const [filters, setFilters] = useState<Filters>({ articulo: "", descripcion: "", norma_aprobatoria: "", anio_ref: "", cant: "" });

  useEffect(() => { loadData(); }, []);

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

        if (temp.length === 0) { license.cant = license.dias_computados; temp.push(license); return; }

        let isRepeat = false;
        temp.forEach((t: any) => {
          if (t.articulo === license.articulo && t.anio_ref === license.anio_ref) {
            isRepeat = true;
            t.cant += license.dias_computados;
          }
        });

        if (!isRepeat) { license.cant = license.dias_computados; temp.push(license); }
      });

      setLicensesCompact(temp.reverse());
      setLicensesTotal(licenses);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudieron cargar las licencias", detail: err.message });
    } finally {
      setLoading(false);
    }
  }

  function openDetail(license: any) {
    setLicensesForDetail(
      licensesTotal.filter((l: any) => l.articulo === license.articulo && l.anio_ref === license.anio_ref).reverse()
    );
    setShowDetail(true);
  }

  const filtered = licensesCompact.filter((l) =>
    (!filters.articulo || String(l.articulo).toLowerCase().includes(filters.articulo.toLowerCase())) &&
    (!filters.descripcion || l.descripcion?.toLowerCase().includes(filters.descripcion.toLowerCase())) &&
    (!filters.norma_aprobatoria || l.norma_aprobatoria?.toLowerCase().includes(filters.norma_aprobatoria.toLowerCase())) &&
    (!filters.anio_ref || String(l.anio_ref).includes(filters.anio_ref)) &&
    (!filters.cant || String(l.cant).includes(filters.cant))
  );

  return (
    <>
      <Toast ref={toast} position="bottom-center" />

      <div className="animated fadeIn">
        <div className="row page-titles">
          <div className="align-self-center col-md-5">
            <h3 className="text-themecolor">Licencias</h3>
          </div>
          <div className="align-self-center col-md-7">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="javascript:void(0)">Inicio</a></li>
              <li className="breadcrumb-item">Licencias</li>
            </ol>
          </div>
        </div>

        <div className="row">
          <div className="col-md-12">
            <div className="card card-body">
              {loading ? (
                <div className="animated fadeIn"><i className="pi pi-spin pi-spinner" /> Cargando licencias</div>
              ) : (
                <div className="animated fadeIn">
                  {/* Filter row */}
                  <div className="row mb-2">
                    {(["articulo", "descripcion", "norma_aprobatoria", "anio_ref", "cant"] as (keyof Filters)[]).map((field) => (
                      <div key={field} className="col">
                        <input
                          className="form-control form-control-sm"
                          placeholder={field.replace("_", " ").toUpperCase()}
                          value={filters[field]}
                          onChange={(e) => setFilters((p) => ({ ...p, [field]: e.target.value }))}
                        />
                      </div>
                    ))}
                    <div className="col" />
                  </div>

                  <DataTable value={filtered} className="p-datatable-sm p-datatable-striped" emptyMessage="No hay licencias.">
                    <Column field="articulo" header="ARTÍCULO" style={{ width: "10%" }} body={(r) => <small>{r.articulo}</small>} sortable />
                    <Column field="descripcion" header="DESCRIPCIÓN" style={{ width: "22.5%", textAlign: "left" }} body={(r) => <small>{r.descripcion}</small>} sortable />
                    <Column field="norma_aprobatoria" header="NORMA" style={{ width: "22.5%", textAlign: "left" }} body={(r) => <small>{r.norma_aprobatoria}</small>} sortable />
                    <Column field="anio_ref" header="AÑO" style={{ width: "10%" }} body={(r) => <small>{r.anio_ref}</small>} sortable />
                    <Column field="cant" header="DÍAS TOTALES" style={{ width: "15%" }} body={(r) => <small>{r.cant}</small>} sortable />
                    <Column header="ACCIONES" body={(r) => (
                      <small className="pointer text-primary" onClick={() => openDetail(r)}>Ver detalle</small>
                    )} />
                  </DataTable>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog
        header={`Detalles de ${licensesForDetail[0]?.descripcion} (${licensesForDetail[0]?.anio_ref})`}
        visible={showDetail}
        draggable={false}
        modal
        style={{ width: "95vw" }}
        onHide={() => setShowDetail(false)}
      >
        <DataTable value={licensesForDetail} className="p-datatable-sm p-datatable-striped" paginator rows={10} showCurrentPageReport>
          <Column field="fecha_inicio" header="FECHA INICIO" />
          <Column field="fecha_finaliz" header="FECHA FIN" />
          <Column field="dias_computados" header="DÍAS COMPUTADOS" />
          <Column field="norma_aprobatoria" header="NORMA APROBATORIA" />
        </DataTable>
      </Dialog>
    </>
  );
}
