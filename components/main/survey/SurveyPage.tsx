"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { loadSurveys } from "@/lib/services/survey.service";
import SurveyCreate from "./SurveyCreate";
import SurveyList from "./SurveyList";

export default function SurveyPage() {
  const toast = useRef<Toast>(null);

  const [isLoadingSurveys, setIsLoadingSurveys] = useState(false);
  const [surveys, setSurveys] = useState<any[]>([]);

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadItems() {
    setIsLoadingSurveys(true);
    try {
      const resp = await loadSurveys();
      setSurveys(Array.isArray(resp) ? [...resp].reverse() : []);
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudieron cargar las encuestas" });
    } finally {
      setIsLoadingSurveys(false);
    }
  }

  function addSurvey(survey: any) {
    setSurveys((prev) => [survey, ...prev]);
  }

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />

      <div className="fadeIn animated">

        {/* Header card */}
        <div className="card profile-card">
          <div className="d-flex align-items-center flex-wrap px-3 pt-3 pb-3" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eef1ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-chart-bar" style={{ color: "#4a6cf7", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Encuestas</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Gestión de encuestas institucionales</small>
            </div>
            <button
              type="button"
              disabled={isLoadingSurveys}
              onClick={loadItems}
              className="btn btn-light d-flex align-items-center"
              style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.82rem", padding: "5px 14px", color: "#64748b" }}
            >
              <i className={isLoadingSurveys ? "pi pi-spin pi-spinner" : "pi pi-refresh"} style={{ fontSize: "0.78rem" }} />
              Recargar
            </button>
          </div>
        </div>

        <SurveyCreate onNewSurvey={addSurvey} />

        <SurveyList isLoadingSurveys={isLoadingSurveys} surveys={surveys} setSurveys={setSurveys} />
      </div>
    </>
  );
}