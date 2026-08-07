"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { Dialog } from "primereact/dialog";
import { ProgressBar } from "primereact/progressbar";
import { Pencil } from "lucide-react";
import { updateSurvey } from "@/lib/services/survey.service";

interface SurveyUpdateProps {
  visible: boolean;
  survey: any;
  onClose: () => void;
  onUpdated: (survey: any) => void;
}

export default function SurveyUpdate({ visible, survey, onClose, onUpdated }: SurveyUpdateProps) {
  const toast = useRef<Toast>(null);

  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (survey) {
      setName(survey.name ?? "");
      setTouched(false);
    }
  }, [survey]);

  function closeModal() {
    if (isUpdating) return;
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!name || !survey) return;

    setIsUpdating(true);
    try {
      await updateSurvey({ name }, survey.id);
      toast.current?.show({ severity: "success", summary: "Encuesta modificada" });
      onUpdated({ ...survey, name });
      onClose();
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo relaizar el cambio" });
    } finally {
      setIsUpdating(false);
    }
  }

  const updateDialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Pencil size={18} color="#3b82f6" />
      </div>
      <div style={{ minWidth: 0 }}>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Modificación de encuesta</p>
      </div>
    </div>
  );

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />
      <Dialog
        header={updateDialogHeader}
        visible={visible}
        modal
        draggable={false}
        resizable={false}
        dismissableMask
        style={{ width: "min(480px, 92vw)" }}
        onHide={closeModal}
        footer={
          <div>
            <div className="d-flex align-items-center" style={{ gap: "8px" }}>
              <button
                form="update-survey-form"
                disabled={isUpdating || !name}
                type="submit"
                className="btn btn-primary d-flex align-items-center"
                style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
              >
                <Pencil size={14} />
                {isUpdating ? "Modificando..." : "Modificar"}
              </button>
              <button
                disabled={isUpdating}
                onClick={closeModal}
                type="button"
                className="btn btn-light text-muted ml-auto"
                style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
              >
                Volver
              </button>
            </div>
            {isUpdating && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
          </div>
        }
      >
        <form id="update-survey-form" onSubmit={handleSubmit} noValidate>
          <label className="profile-field-label">Nombre *</label>
          <input
            className="profile-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {touched && !name && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
        </form>
      </Dialog>
    </>
  );
}