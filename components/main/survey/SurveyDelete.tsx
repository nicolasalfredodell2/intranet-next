"use client";

import { Dialog } from "primereact/dialog";

interface SurveyDeleteProps {
  visible: boolean;
  survey: any;
  onClose: () => void;
  onDeleted: (survey: any) => void;
}

export default function SurveyDelete({ visible, survey, onClose, onDeleted }: SurveyDeleteProps) {
  void onDeleted;

  return (
    <Dialog
      header="Eliminar encuesta"
      visible={visible}
      modal
      draggable={false}
      resizable={false}
      dismissableMask
      style={{ width: "min(420px, 92vw)" }}
      onHide={onClose}
    >
      <p className="mb-0" style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
        Falta migrar el componente Angular <code>app-delete</code> ({survey?.name}).
      </p>
    </Dialog>
  );
}