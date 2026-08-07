"use client";

import { Dialog } from "primereact/dialog";

interface SurveyAnswersProps {
  visible: boolean;
  question: any;
  onClose: () => void;
}

export default function SurveyAnswers({ visible, question, onClose }: SurveyAnswersProps) {
  return (
    <Dialog
      header="Respuestas"
      visible={visible}
      modal
      draggable={false}
      resizable={false}
      dismissableMask
      style={{ width: "min(600px, 94vw)" }}
      onHide={onClose}
    >
      <p className="mb-0" style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
        Falta migrar el componente Angular <code>app-list-answers</code> ({question?.name}).
      </p>
    </Dialog>
  );
}