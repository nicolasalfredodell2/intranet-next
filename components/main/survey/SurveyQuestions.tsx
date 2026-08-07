"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Pencil, List, Trash2 } from "lucide-react";
import { loadSurveyQuestions } from "@/lib/services/survey.service";
import SurveyCreateQuestion from "./SurveyCreateQuestion";
import SurveyUpdateQuestion from "./SurveyUpdateQuestion";
import SurveyAnswers from "./SurveyAnswers";
import SurveyDeleteQuestion from "./SurveyDeleteQuestion";

const ICON_BTN_STYLE = { background: "none", borderRadius: "8px", padding: "4px 8px", cursor: "pointer", display: "inline-flex", alignItems: "center" } as const;

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  return (
    <span
      style={{ display: "inline-flex" }}
      onMouseEnter={(e) => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setPos({ top: r.top, left: r.left + r.width / 2 });
      }}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {pos && (
        <div style={{ position: "fixed", top: pos.top - 10, left: pos.left, transform: "translateX(-50%) translateY(-100%)", background: "#1e293b", color: "#fff", padding: "5px 11px", borderRadius: "7px", fontSize: "0.71rem", fontWeight: 500, whiteSpace: "nowrap", pointerEvents: "none", zIndex: 9999, boxShadow: "0 4px 14px rgba(0,0,0,0.18)", letterSpacing: "0.01em" }}>
          {label}
          <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", borderWidth: "5px", borderStyle: "solid", borderColor: "#1e293b transparent transparent transparent" }} />
        </div>
      )}
    </span>
  );
}

interface SurveyQuestionsProps {
  visible: boolean;
  survey: any;
  onClose: () => void;
}

export default function SurveyQuestions({ visible, survey, onClose }: SurveyQuestionsProps) {
  const toast = useRef<Toast>(null);

  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  const [isOpenModalUpdateQuestion, setIsOpenModalUpdateQuestion] = useState(false);
  const [questionSelectedForUpdate, setQuestionSelectedForUpdate] = useState<any>(null);

  const [isOpenModalListAnswers, setIsOpenModalListAnswers] = useState(false);
  const [questionSelectedForShowAnswers, setQuestionSelectedForShowAnswers] = useState<any>(null);

  const [isOpenModalDeleteQuestion, setIsOpenModalDeleteQuestion] = useState(false);
  const [questionSelectedForDelete, setQuestionSelectedForDelete] = useState<any>(null);

  useEffect(() => {
    if (visible && survey) loadQuestions(survey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, survey]);

  async function loadQuestions(survey: any) {
    setIsLoadingQuestions(true);
    try {
      const resp = await loadSurveyQuestions(survey.id);
      setQuestions(resp.questions ?? []);
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudieron cargar las preguntas" });
      setQuestions([]);
    } finally {
      setIsLoadingQuestions(false);
    }
  }

  function addQuestion(question: any) {
    toast.current?.show({ severity: "success", summary: "Pregunta creada" });
    setQuestions((prev) => [question, ...prev]);
  }

  function openModalUpdateQuestion(question: any) {
    setQuestionSelectedForUpdate(question);
    setIsOpenModalUpdateQuestion(true);
  }

  function setUpdatedQuestion(question: any) {
    setQuestions((prev) => prev.map((q) => (q.id === question.id ? { ...q, name: question.name } : q)));
  }

  function removeQuestion(question: any) {
    setQuestions((prev) => prev.filter((q) => q.id !== question.id));
  }

  function openModalListAnswersOfQuestion(question: any) {
    setQuestionSelectedForShowAnswers(question);
    setIsOpenModalListAnswers(true);
  }

  function openModalDeleteQuestion(question: any) {
    setQuestionSelectedForDelete(question);
    setIsOpenModalDeleteQuestion(true);
  }

  const dialogHeader = isLoadingQuestions ? "Cargando preguntas de la encuesta" : "Listado de preguntas";

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />
      <Dialog
        header={dialogHeader}
        visible={visible}
        modal
        draggable={false}
        resizable={false}
        dismissableMask
        style={{ width: "min(65vw, 96vw)" }}
        onHide={onClose}
      >
        <SurveyCreateQuestion survey={survey} onNewQuestion={addQuestion} />

        <DataTable
          value={questions}
          loading={isLoadingQuestions}
          className="p-datatable-sm license-table mt-3"
          emptyMessage={
            <div className="license-empty">
              <i className="pi pi-inbox" />
              <p>No hay preguntas creadas para esta encuesta</p>
            </div>
          }
        >
          <Column header="PREGUNTA" body={(question) => <small>{question?.name}</small>} />
          <Column
            header=""
            style={{ width: "15%" }}
            body={(question) => (
              <div className="d-flex align-items-center" style={{ gap: "6px" }}>
                <Tooltip label="Modificar">
                  <button type="button" onClick={() => openModalUpdateQuestion(question)} style={{ ...ICON_BTN_STYLE, border: "1.5px solid #dbeafe", color: "#3b82f6" }}>
                    <Pencil size={14} />
                  </button>
                </Tooltip>
                <Tooltip label="Respuestas">
                  <button type="button" onClick={() => openModalListAnswersOfQuestion(question)} style={{ ...ICON_BTN_STYLE, border: "1.5px solid #e2e8f0", color: "#64748b" }}>
                    <List size={14} />
                  </button>
                </Tooltip>
                <Tooltip label="Eliminar">
                  <button type="button" onClick={() => openModalDeleteQuestion(question)} style={{ ...ICON_BTN_STYLE, border: "1.5px solid #fecdd3", color: "#dc3545" }}>
                    <Trash2 size={14} />
                  </button>
                </Tooltip>
              </div>
            )}
          />
        </DataTable>
      </Dialog>

      <SurveyUpdateQuestion
        visible={isOpenModalUpdateQuestion}
        question={questionSelectedForUpdate}
        survey={survey}
        onClose={() => setIsOpenModalUpdateQuestion(false)}
        onUpdated={setUpdatedQuestion}
      />
      <SurveyAnswers
        visible={isOpenModalListAnswers}
        question={questionSelectedForShowAnswers}
        onClose={() => setIsOpenModalListAnswers(false)}
      />
      <SurveyDeleteQuestion
        visible={isOpenModalDeleteQuestion}
        question={questionSelectedForDelete}
        onClose={() => setIsOpenModalDeleteQuestion(false)}
        onDeleted={removeQuestion}
      />
    </>
  );
}