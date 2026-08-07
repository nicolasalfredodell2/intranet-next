"use client";

import { Dialog } from "primereact/dialog";

interface SurveyUpdateQuestionProps {
  visible: boolean;
  question: any;
  survey: any;
  onClose: () => void;
  onUpdated: (question: any) => void;
}

export default function SurveyUpdateQuestion({ visible, question, survey, onClose, onUpdated }: SurveyUpdateQuestionProps) {
  void survey;
  void onUpdated;

  return (
    <Dialog
      header="Modificar pregunta"
      visible={visible}
      modal
      draggable={false}
      resizable={false}
      dismissableMask
      style={{ width: "min(480px, 92vw)" }}
      onHide={onClose}
    >
      <p className="mb-0" style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
        Falta migrar el componente Angular <code>app-update-questions</code> ({question?.name}).
      </p>
    </Dialog>
  );
}