"use client";

import { useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { Message } from "primereact/message";
import { ProgressBar } from "primereact/progressbar";
import { createSurvey } from "@/lib/services/survey.service";

interface SurveyCreateProps {
  onNewSurvey: (survey: any) => void;
}

export default function SurveyCreate({ onNewSurvey }: SurveyCreateProps) {
  const toast = useRef<Toast>(null);

  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!name) return;

    setLoading(true);
    try {
      const resp = await createSurvey({ enable: "0", name });
      setName("");
      toast.current?.show({ severity: "success", summary: "Encuesta creada" });
      onNewSurvey(resp);
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo crear la encuesta" });
    } finally {
      setLoading(false);
    }
  }

  function limpiar() {
    setName("");
    setTouched(false);
  }

  return (
    <div className="card profile-card mt-4">
      <AppToast ref={toast} position="bottom-center" />

      <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
        <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <i className="pi pi-plus-circle" style={{ color: "#eab308", fontSize: "1rem" }} />
        </div>
        <div className="flex-grow-1">
          <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Nueva encuesta</h5>
          <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Creá una encuesta para luego agregarle preguntas</small>
        </div>
      </div>
      <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />

      <div className="card-body" style={{ padding: "16px 20px 20px" }}>
        <form className="animated fadeIn" onSubmit={handleSubmit} noValidate>
          <div className="row">
            <div className="col-12 col-lg-4 mb-3">
              <label className="profile-field-label">Nombre *</label>
              <input
                className="profile-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {touched && !name && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
            </div>
          </div>

          <Message
            severity="info"
            className="mb-3 w-100"
            style={{ justifyContent: "flex-start" }}
            text="Las encuestas creadas están deshabilitadas por defecto. Debe crear preguntas para la encuesta y luego habilitarla."
          />

          <div className="d-flex align-items-center" style={{ gap: "8px" }}>
            <button
              disabled={loading}
              type="submit"
              className="btn btn-primary d-flex align-items-center"
              style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
            >
              <i className={loading ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
              {loading ? "Creando encuesta..." : "Crear encuesta"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={limpiar}
              className="btn btn-light text-muted ml-auto"
              style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
            >
              Limpiar
            </button>
          </div>

          {loading && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
        </form>
      </div>
    </div>
  );
}