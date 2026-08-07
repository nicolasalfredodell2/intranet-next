"use client";

import { Dialog } from "primereact/dialog";

interface SurveyDeleteQuestionProps {
  visible: boolean;
  question: any;
  onClose: () => void;
  onDeleted: (question: any) => void;
}

export default function SurveyDeleteQuestion({ visible, question, onClose, onDeleted }: SurveyDeleteQuestionProps) {
  void onDeleted;

  return (
    <Dialog
      header="Eliminar pregunta"
      visible={visible}
      modal
      draggable={false}
      resizable={false}
      dismissableMask
      style={{ width: "min(420px, 92vw)" }}
      onHide={onClose}
    >
      <p className="mb-0" style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
        Falta migrar el componente Angular <code>app-delete-question</code> ({question?.name}).
      </p>
    </Dialog>
  );
}