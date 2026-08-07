"use client";

import { Dialog } from "primereact/dialog";

interface SurveyUpdateProps {
  visible: boolean;
  survey: any;
  onClose: () => void;
  onUpdated: (survey: any) => void;
}

export default function SurveyUpdate({ visible, survey, onClose, onUpdated }: SurveyUpdateProps) {
  void onUpdated;

  return (
    <Dialog
      header="Modificar encuesta"
      visible={visible}
      modal
      draggable={false}
      resizable={false}
      dismissableMask
      style={{ width: "min(480px, 92vw)" }}
      onHide={onClose}
    >
      <p className="mb-0" style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
        Falta migrar el componente Angular <code>app-update</code> ({survey?.name}).
      </p>
    </Dialog>
  );
}