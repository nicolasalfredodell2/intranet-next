"use client";

import { Dialog } from "primereact/dialog";

interface SurveyQuestionsProps {
  visible: boolean;
  survey: any;
  onClose: () => void;
}

export default function SurveyQuestions({ visible, survey, onClose }: SurveyQuestionsProps) {
  return (
    <Dialog
      header="Preguntas"
      visible={visible}
      modal
      draggable={false}
      resizable={false}
      dismissableMask
      style={{ width: "min(720px, 94vw)" }}
      onHide={onClose}
    >
      <p className="mb-0" style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
        Falta migrar el componente Angular <code>app-list-questions</code> ({survey?.name}).
      </p>
    </Dialog>
  );
}