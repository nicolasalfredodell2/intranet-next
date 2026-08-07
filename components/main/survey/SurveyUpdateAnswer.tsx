"use client";

import { Dialog } from "primereact/dialog";

interface SurveyUpdateAnswerProps {
  visible: boolean;
  answer: any;
  question: any;
  onClose: () => void;
  onUpdated: (answer: any) => void;
}

export default function SurveyUpdateAnswer({ visible, answer, question, onClose, onUpdated }: SurveyUpdateAnswerProps) {
  void question;
  void onUpdated;

  return (
    <Dialog
      header="Modificar respuesta"
      visible={visible}
      modal
      draggable={false}
      resizable={false}
      dismissableMask
      style={{ width: "min(480px, 92vw)" }}
      onHide={onClose}
    >
      <p className="mb-0" style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
        Falta migrar el componente Angular <code>app-update-answers</code> ({answer?.answer?.value}).
      </p>
    </Dialog>
  );
}