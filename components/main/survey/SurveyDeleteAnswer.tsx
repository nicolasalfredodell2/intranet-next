"use client";

import { useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { Dialog } from "primereact/dialog";
import { ProgressBar } from "primereact/progressbar";
import { Trash2 } from "lucide-react";
import { deleteAnswer } from "@/lib/services/survey.service";

interface SurveyDeleteAnswerProps {
  visible: boolean;
  answer: any;
  onClose: () => void;
  onDeleted: (answer: any) => void;
}

export default function SurveyDeleteAnswer({ visible, answer, onClose, onDeleted }: SurveyDeleteAnswerProps) {
  const toast = useRef<Toast>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function closeModal() {
    if (isDeleting) return;
    onClose();
  }

  async function handleDelete() {
    if (isDeleting || !answer) return;
    setIsDeleting(true);
    try {
      await deleteAnswer(answer.id);
      toast.current?.show({ severity: "success", summary: "Respuesta eliminada" });
      onDeleted(answer);
      onClose();
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "No se pudo eliminar la respuesta",
        detail: "Verifique que la respuesta no haya hizo seleccionada ya en la encuesta",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  const deleteDialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fff1f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Trash2 size={18} color="#dc3545" />
      </div>
      <div>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>¿Eliminar respuesta?</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Esta acción no se puede deshacer</small>
      </div>
    </div>
  );

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />
      <Dialog
        header={deleteDialogHeader}
        visible={visible}
        modal
        draggable={false}
        resizable={false}
        dismissableMask
        style={{ width: "min(420px, 92vw)" }}
        onHide={closeModal}
        footer={
          <div>
            <div className="d-flex align-items-center" style={{ gap: "8px" }}>
              <button
                disabled={isDeleting}
                onClick={handleDelete}
                type="button"
                className="btn btn-danger d-flex align-items-center"
                style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
              >
                <Trash2 size={14} />
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </button>
              <button
                disabled={isDeleting}
                onClick={closeModal}
                type="button"
                className="btn btn-light text-muted ml-auto"
                style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
              >
                Volver
              </button>
            </div>
            {isDeleting && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
          </div>
        }
      >
        <p style={{ fontSize: "0.88rem", color: "#374151", margin: 0 }}>
          Está a punto de eliminar la respuesta <strong>{answer?.answer?.value}</strong>. Esta acción no se puede deshacer.
        </p>
      </Dialog>
    </>
  );
}