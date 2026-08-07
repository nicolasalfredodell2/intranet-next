"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Pencil, Trash2 } from "lucide-react";
import SurveyCreateAnswer from "./SurveyCreateAnswer";
import SurveyUpdateAnswer from "./SurveyUpdateAnswer";
import SurveyDeleteAnswer from "./SurveyDeleteAnswer";

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

interface SurveyAnswersProps {
  visible: boolean;
  question: any;
  onClose: () => void;
}

export default function SurveyAnswers({ visible, question, onClose }: SurveyAnswersProps) {
  const toast = useRef<Toast>(null);

  const [answers, setAnswers] = useState<any[]>([]);
  const [isLoadingAnswers, setIsLoadingAnswers] = useState(false);

  const [isOpenModalUpdateAnswer, setIsOpenModalUpdateAnswer] = useState(false);
  const [answerSelectedForUpdate, setAnswerSelectedForUpdate] = useState<any>(null);

  const [isOpenModalDeleteAnswer, setIsOpenModalDeleteAnswer] = useState(false);
  const [answerSelectedForDelete, setAnswerSelectedForDelete] = useState<any>(null);

  useEffect(() => {
    if (question) loadAnswersOfQuestion(question);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question]);

  function loadAnswersOfQuestion(question: any) {
    setIsLoadingAnswers(true);
    setAnswers(question.question_answers ?? []);
    setIsLoadingAnswers(false);
  }

  function addAnswer(answer: any) {
    toast.current?.show({ severity: "success", summary: "Respuesta creada" });
    setAnswers((prev) => [answer, ...prev]);
  }

  function openModalUpdateAnswer(answer: any) {
    setAnswerSelectedForUpdate(answer);
    setIsOpenModalUpdateAnswer(true);
  }

  function setUpdatedAnswer(answer: any) {
    setAnswers((prev) => prev.map((a) => (a.id === answer.id ? { ...a, answer: { ...a.answer, value: answer.answer.value } } : a)));
  }

  function removeAnswer(answer: any) {
    setAnswers((prev) => prev.filter((a) => a.id !== answer.id));
  }

  function openModalDeleteAnswer(answer: any) {
    setAnswerSelectedForDelete(answer);
    setIsOpenModalDeleteAnswer(true);
  }

  function closeModal() {
    if (question) question.question_answers = answers;
    onClose();
  }

  const dialogHeader = isLoadingAnswers ? "Cargando reseputas de la pregunta" : "Listado de respuestas";

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
        onHide={closeModal}
      >
        <SurveyCreateAnswer question={question} onNewAnswer={addAnswer} />

        <DataTable
          value={answers}
          loading={isLoadingAnswers}
          className="p-datatable-sm license-table mt-3"
          emptyMessage={
            <div className="license-empty">
              <i className="pi pi-inbox" />
              <p>No hay respuestas creadas para esta pregunta</p>
            </div>
          }
        >
          <Column header="RESPUESTA" body={(answer) => <small>{answer?.answer?.value}</small>} />
          <Column
            header=""
            style={{ width: "15%" }}
            body={(answer) => (
              <div className="d-flex align-items-center" style={{ gap: "6px" }}>
                <Tooltip label="Modificar">
                  <button type="button" onClick={() => openModalUpdateAnswer(answer)} style={{ ...ICON_BTN_STYLE, border: "1.5px solid #dbeafe", color: "#3b82f6" }}>
                    <Pencil size={14} />
                  </button>
                </Tooltip>
                <Tooltip label="Eliminar">
                  <button type="button" onClick={() => openModalDeleteAnswer(answer)} style={{ ...ICON_BTN_STYLE, border: "1.5px solid #fecdd3", color: "#dc3545" }}>
                    <Trash2 size={14} />
                  </button>
                </Tooltip>
              </div>
            )}
          />
        </DataTable>
      </Dialog>

      <SurveyUpdateAnswer
        visible={isOpenModalUpdateAnswer}
        answer={answerSelectedForUpdate}
        question={question}
        onClose={() => setIsOpenModalUpdateAnswer(false)}
        onUpdated={setUpdatedAnswer}
      />
      <SurveyDeleteAnswer
        visible={isOpenModalDeleteAnswer}
        answer={answerSelectedForDelete}
        onClose={() => setIsOpenModalDeleteAnswer(false)}
        onDeleted={removeAnswer}
      />
    </>
  );
}