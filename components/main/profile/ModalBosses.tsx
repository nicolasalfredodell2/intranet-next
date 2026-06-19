"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { MultiSelect } from "primereact/multiselect";
import { Chip } from "primereact/chip";
import { ProgressBar } from "primereact/progressbar";
import { getInternals } from "@/lib/services/internal.service";
import { setBosses } from "@/lib/services/perfil.service";

interface Props {
  show: boolean;
  user: any;
  onHide: () => void;
  onBossesAssigned: (bosses: any[]) => void;
}

export default function ModalBosses({ show, user, onHide, onBossesAssigned }: Props) {
  const [internalsSearch, setInternalsSearch] = useState<any[]>([]);
  const [selectedInternals, setSelectedInternals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [msg, setMsg] = useState<{ severity: string; text: string } | null>(null);
  const [isFirstSelect, setIsFirstSelect] = useState(false);
  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!show) return;
    loadInternals("");

    const bosses = user?.bosses ?? [];
    if (bosses.length === 0) {
      setIsFirstSelect(true);
    } else {
      setIsFirstSelect(false);
      setSelectedInternals(
        bosses.map((b: any) => ({
          cuil: b.people?.cuil ?? b.cuil,
          lastname_name: b.people?.lastname_name ?? b.lastname_name,
        }))
      );
    }
  }, [show]);

  function showMsg(severity: string, text: string) {
    setMsg({ severity, text });
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMsg(null), 5000);
  }

  async function loadInternals(search: string) {
    setLoading(true);
    try {
      const data = await getInternals(search);
      const userCuil = localStorage.getItem("user");
      setInternalsSearch(data.filter((u: any) => u.cuil !== userCuil));
    } catch {
      showMsg("error", "No se pudieron cargar los usuarios indicados.");
    } finally {
      setLoading(false);
    }
  }

  function removeInternal(internal: any) {
    setSelectedInternals((prev) => prev.filter((i) => i !== internal));
  }

  function dismiss(emitBosses = false) {
    if (emitBosses) onBossesAssigned(selectedInternals);
    setInternalsSearch([]);
    setLoading(false);
    onHide();
  }

  async function handleSetBosses() {
    if (selectedInternals.length === 0) {
      showMsg("info", "Debe seleccionar al menos un jefe.");
      return;
    }

    setLoading(true);
    setLoadingAction(true);
    try {
      const resp = await setBosses(selectedInternals);
      showMsg("success", selectedInternals.length > 1 ? "Jefes asignados." : "Jefe asignado.");
      setTimeout(() => dismiss(true), 2000);
    } catch (err: any) {
      showMsg("error", `No se pudo asignar los jefes. ${err?.message ?? ""}`);
    } finally {
      setLoading(false);
      setLoadingAction(false);
    }
  }

  const footer = (
    <div>
      <button
        disabled={loading || selectedInternals.length === 0}
        type="button"
        className="btn btn-primary waves-effect waves-light"
        onClick={handleSetBosses}
      >
        {loadingAction
          ? "Modificando jefes"
          : "Modificar jefes"}
      </button>

      {!isFirstSelect && (
        <button
          disabled={loading}
          type="button"
          className="btn btn-default waves-effect ml-2"
          onClick={() => dismiss(false)}
        >
          Volver
        </button>
      )}

      {loadingAction && (
        <ProgressBar
          className="animated fadeIn mt-2"
          mode="indeterminate"
          style={{ height: "6px" }}
        />
      )}
    </div>
  );

  return (
    <Dialog
      header=""
      visible={show}
      style={{ width: "80vw" }}
      draggable={false}
      resizable={false}
      closable={false}
      modal
      onHide={() => {}}
      footer={footer}
    >
      <div className="modal-header my-0 py-0">
        <h4 className="modal-title">Jefes</h4>
      </div>

      {isFirstSelect && (
        <div className="row mt-2">
          <div className="col-12">
            <div className="alert alert-info">Seleccione su jefe/s para seguir navegando.</div>
          </div>
        </div>
      )}

      <div className={`mb-4 row ${!isFirstSelect ? "mt-3" : ""}`}>
        <div className="col-12 col-lg-6">
          <MultiSelect
            value={selectedInternals}
            options={internalsSearch}
            onChange={(e) => setSelectedInternals(e.value)}
            optionLabel="lastname_name"
            placeholder="Seleccionar jefe/s"
            emptyFilterMessage="Sin resultados"
            emptyMessage="Buscar por Apellido"
            display="chip"
            filter
            resetFilterOnHide
            onFilter={(e) => loadInternals(e.filter)}
            scrollHeight="90px"
            className="w-100"
          />
        </div>

        <div className="col-12 col-lg-6 mt-2 mt-lg-0">
          <h6 className="h6 mt-2">
            {selectedInternals.length > 1 ? "Jefes seleccionados" : "Jefe seleccionado"}
          </h6>
          <div className="d-flex flex-wrap">
            {selectedInternals.map((internal) => (
              <Chip
                key={internal.cuil}
                label={internal.lastname_name}
                removable
                onRemove={() => { removeInternal(internal); return true; }}
                className="animated fadeIn mr-2 mt-2 custom-chip-internal"
              />
            ))}
          </div>
        </div>
      </div>

      {msg && (
        <div className={`mb-4 row`}>
          <div className="col-12">
            <div className={`alert alert-${msg.severity === "error" ? "danger" : msg.severity === "success" ? "success" : "info"}`}>
              {msg.text}
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
