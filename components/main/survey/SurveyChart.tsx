"use client";

import { Dialog } from "primereact/dialog";

interface SurveyChartProps {
  visible: boolean;
  survey: any;
  onClose: () => void;
}

export default function SurveyChart({ visible, survey, onClose }: SurveyChartProps) {
  return (
    <Dialog
      header="Gráfico"
      visible={visible}
      modal
      draggable={false}
      resizable={false}
      dismissableMask
      style={{ width: "min(720px, 94vw)" }}
      onHide={onClose}
    >
      <p className="mb-0" style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
        Falta migrar el componente Angular <code>app-chart</code> ({survey?.name}).
      </p>
    </Dialog>
  );
}