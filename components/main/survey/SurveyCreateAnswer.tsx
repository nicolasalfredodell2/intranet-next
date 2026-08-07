"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { createAnswer } from "@/lib/services/survey.service";

interface SurveyCreateAnswerProps {
  question: any;
  onNewAnswer: (answer: any) => void;
}

export default function SurveyCreateAnswer({ question, onNewAnswer }: SurveyCreateAnswerProps) {
  const toast = useRef<Toast>(null);

  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (question) {
      setValue("");
      setTouched(false);
    }
  }, [question]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!value || !question) return;

    setIsCreating(true);
    try {
      const resp = await createAnswer({ value, question_id: question.id });
      onNewAnswer(resp);
      setValue("");
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo crear la respuesta" });
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <form className="animated fadeIn" onSubmit={handleSubmit} noValidate>
      <AppToast ref={toast} position="bottom-center" />

      <div className="row">
        <div className="col-12 mb-3">
          <label className="profile-field-label">Respuesta *</label>
          <input
            className="profile-input"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          {touched && !value && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
        </div>
      </div>

      <button
        disabled={isCreating || !value}
        type="submit"
        className="btn btn-primary d-flex align-items-center"
        style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
      >
        <i className={isCreating ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
        {isCreating ? "Creando respuesta..." : "Crear respuesta"}
      </button>
    </form>
  );
}