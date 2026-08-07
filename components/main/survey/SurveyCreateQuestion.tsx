"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { createQuestion } from "@/lib/services/survey.service";

interface SurveyCreateQuestionProps {
  survey: any;
  onNewQuestion: (question: any) => void;
}

export default function SurveyCreateQuestion({ survey, onNewQuestion }: SurveyCreateQuestionProps) {
  const toast = useRef<Toast>(null);

  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (survey) {
      setName("");
      setTouched(false);
    }
  }, [survey]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!name || !survey) return;

    setIsCreating(true);
    try {
      const resp = await createQuestion({ name, survey_id: survey.id });
      onNewQuestion(resp);
      setName("");
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo crear la pregunta" });
    } finally {
      setIsCreating(false);
    }
  }

  function limpiar() {
    setName("");
    setTouched(false);
  }

  return (
    <form className="animated fadeIn" onSubmit={handleSubmit} noValidate>
      <AppToast ref={toast} position="bottom-center" />

      <div className="row">
        <div className="col-12 mb-3">
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

      <div className="d-flex align-items-center" style={{ gap: "8px" }}>
        <button
          disabled={isCreating || !name}
          type="submit"
          className="btn btn-primary d-flex align-items-center"
          style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
        >
          <i className={isCreating ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
          {isCreating ? "Creando pregunta..." : "Crear pregunta"}
        </button>
        <button
          type="button"
          disabled={isCreating}
          onClick={limpiar}
          className="btn btn-light text-muted ml-auto"
          style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
        >
          Limpiar
        </button>
      </div>
    </form>
  );
}