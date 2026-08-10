"use client";

import { useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { Dialog } from "primereact/dialog";
import { ProgressBar } from "primereact/progressbar";
import { Trash2 } from "lucide-react";
import { deleteCompensation } from "@/lib/services/compensations.service";

interface Props {
  visible: boolean;
  onHide: () => void;
  compensation: any;
  onDeleted: (compensation: any) => void;
}

export default function CompensationsDeleteDialog({ visible, onHide, compensation, onDeleted }: Props) {
  const toast = useRef<Toast>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function closeModal() {
    if (isDeleting) return;
    onHide();
  }

  async function handleDelete() {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteCompensation(compensation.work_planner_id);
      toast.current?.show({ severity: "success", summary: "Compensación eliminada" });
      onDeleted(compensation);
      onHide();
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo eliminar la compensación" });
    } finally {
      setIsDeleting(false);
    }
  }

  const dialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fff1f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Trash2 size={18} color="#dc3545" />
      </div>
      <div>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Eliminar compensación</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Esta acción no se puede deshacer</small>
      </div>
    </div>
  );

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />

      <Dialog
        header={dialogHeader}
        visible={visible}
        modal
        draggable={false}
        resizable={false}
        closable={false}
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
                <i className={isDeleting ? "pi pi-spin pi-spinner" : "pi pi-trash"} style={{ fontSize: "0.78rem" }} />
                {isDeleting ? "Eliminando..." : "Sí, eliminar"}
              </button>
              <button
                disabled={isDeleting}
                onClick={closeModal}
                type="button"
                className="btn btn-light text-muted ml-auto"
                style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
              >
                No
              </button>
            </div>
            {isDeleting && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
          </div>
        }
      >
        <p style={{ fontSize: "0.88rem", color: "#374151", margin: 0 }}>
          Está a punto de eliminar la compensación. Esta acción no se puede deshacer.
        </p>
      </Dialog>
    </>
  );
}
