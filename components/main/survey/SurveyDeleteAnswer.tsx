"use client";

import { Dialog } from "primereact/dialog";

interface SurveyDeleteAnswerProps {
  visible: boolean;
  answer: any;
  onClose: () => void;
  onDeleted: (answer: any) => void;
}

export default function SurveyDeleteAnswer({ visible, answer, onClose, onDeleted }: SurveyDeleteAnswerProps) {
  void onDeleted;

  return (
    <Dialog
      header="Eliminar respuesta"
      visible={visible}
      modal
      draggable={false}
      resizable={false}
      dismissableMask
      style={{ width: "min(420px, 92vw)" }}
      onHide={onClose}
    >
      <p className="mb-0" style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
        Falta migrar el componente Angular <code>app-delete-answer</code> ({answer?.answer?.value}).
      </p>
    </Dialog>
  );
}