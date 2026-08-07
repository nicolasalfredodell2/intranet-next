"use client";

import { useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { enableSurvey, disableSurvey } from "@/lib/services/survey.service";
import SurveyUpdate from "./SurveyUpdate";
import SurveyQuestions from "./SurveyQuestions";
import SurveyDelete from "./SurveyDelete";
import SurveyChart from "./SurveyChart";

const ICON_BTN_STYLE = { background: "none", borderRadius: "8px", padding: "4px 8px", cursor: "pointer", display: "inline-flex", alignItems: "center" } as const;

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  return (
    <span
      style={{ display: "inline-flex" }}
      onMouseEnter={(e) => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setPos({ top: r.top, left: r.left + r.width / 2 });
      }}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {pos && (
        <div style={{ position: "fixed", top: pos.top - 10, left: pos.left, transform: "translateX(-50%) translateY(-100%)", background: "#1e293b", color: "#fff", padding: "5px 11px", borderRadius: "7px", fontSize: "0.71rem", fontWeight: 500, whiteSpace: "nowrap", pointerEvents: "none", zIndex: 9999, boxShadow: "0 4px 14px rgba(0,0,0,0.18)", letterSpacing: "0.01em" }}>
          {label}
          <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", borderWidth: "5px", borderStyle: "solid", borderColor: "#1e293b transparent transparent transparent" }} />
        </div>
      )}
    </span>
  );
}

interface SurveyListProps {
  isLoadingSurveys: boolean;
  surveys: any[];
  setSurveys: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function SurveyList({ isLoadingSurveys, surveys, setSurveys }: SurveyListProps) {
  const toast = useRef<Toast>(null);

  const [isLoadingActionChangeEnableSurvey, setIsLoadingActionChangeEnableSurvey] = useState(false);
  const [surveySelectedForChangeEnable, setSurveySelectedForChangeEnable] = useState<any>(null);

  const [isOpenModalUpdateSurvey, setIsOpenModalUpdateSurvey] = useState(false);
  const [surveySelectedForUpdate, setSurveySelectedForUpdate] = useState<any>(null);

  const [isOpenModalListQuestionsOfSurvey, setIsOpenModalListQuestionsOfSurvey] = useState(false);
  const [surveySelectedForShowQuestions, setSurveySelectedForShowQuestions] = useState<any>(null);

  const [isOpenModalDeleteSurvey, setIsOpenModalDeleteSurvey] = useState(false);
  const [surveySelectedForDelete, setSurveySelectedForDelete] = useState<any>(null);

  const [isOpenModalShowChartSurvey, setIsOpenModalShowChartSurvey] = useState(false);
  const [surveySelectedForShowChartSurvey, setSurveySelectedForShowChartSurvey] = useState<any>(null);

  function changeEnable(survey: any) {
    if (isLoadingActionChangeEnableSurvey) return;

    setSurveySelectedForChangeEnable(survey);
    setIsLoadingActionChangeEnableSurvey(true);

    if (survey.enable == 1) disabledSurvey(survey);
    else enabledSurvey(survey);
  }

  async function disabledSurvey(survey: any) {
    try {
      await disableSurvey(survey.id);
      toast.current?.show({ severity: "success", summary: "Encuesta deshabilitada" });
      setSurveys((prev) => prev.map((s) => (s.id === survey.id ? { ...s, enable: 0 } : s)));
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo relaizar el cambio" });
    } finally {
      setIsLoadingActionChangeEnableSurvey(false);
      setSurveySelectedForChangeEnable(null);
    }
  }

  async function enabledSurvey(survey: any) {
    try {
      await enableSurvey(survey.id);
      toast.current?.show({ severity: "success", summary: "Encuesta habilitada" });
      setSurveys((prev) => prev.map((s) => (s.id === survey.id ? { ...s, enable: 1 } : s)));
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo relaizar el cambio" });
    } finally {
      setIsLoadingActionChangeEnableSurvey(false);
      setSurveySelectedForChangeEnable(null);
    }
  }

  function openModalUpdateSurvey(survey: any) {
    setSurveySelectedForUpdate(survey);
    setIsOpenModalUpdateSurvey(true);
  }

  function openModalListQuestionsOfSurvey(survey: any) {
    setSurveySelectedForShowQuestions(survey);
    setIsOpenModalListQuestionsOfSurvey(true);
  }

  function openModalDeleteSurvey(survey: any) {
    setSurveySelectedForDelete(survey);
    setIsOpenModalDeleteSurvey(true);
  }

  function openModalShowChartSurvey(survey: any) {
    setSurveySelectedForShowChartSurvey(survey);
    setIsOpenModalShowChartSurvey(true);
  }

  function setUpdatedSurvey(survey: any) {
    setSurveys((prev) => prev.map((s) => (s.id === survey.id ? { ...s, name: survey.name } : s)));
  }

  function removeSurvey(survey: any) {
    setSurveys((prev) => prev.filter((s) => s.id !== survey.id));
  }

  return (
    <div className="card profile-card mt-4">
      <AppToast ref={toast} position="bottom-center" />

      <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
        <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <i className="pi pi-list" style={{ color: "#eab308", fontSize: "1rem" }} />
        </div>
        <div className="flex-grow-1">
          <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Listado de encuestas</h5>
          <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{surveys.length} {surveys.length === 1 ? "encuesta en total" : "encuestas totales"}</small>
        </div>
      </div>
      <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />

      <div className="card-body" style={{ padding: "16px 20px 20px" }}>
        <DataTable
          value={surveys}
          loading={isLoadingSurveys}
          stripedRows
          rowHover
          className="p-datatable-sm"
          emptyMessage={
            <div className="license-empty">
              <i className="pi pi-inbox" />
              <p>No hay encuestas creadas</p>
            </div>
          }
        >
          <Column header="NOMBRE" body={(survey) => <small>{survey?.name}</small>} />
          <Column
            header="HABILITADO"
            style={{ width: "10%" }}
            body={(survey) => {
              const isChanging = surveySelectedForChangeEnable === survey && isLoadingActionChangeEnableSurvey;
              return (
                <small
                  onClick={() => changeEnable(survey)}
                  className={`pointer p-1 ${survey?.enable == 1 ? "status-success" : "status-danger"}`}
                >
                  {!isChanging && <span className="animated fadeIn">{survey?.enable == 1 ? "SI" : "NO"}</span>}
                  {isChanging && <span className="animated fadeIn text-dark">Realizando cambio</span>}
                </small>
              );
            }}
          />
          <Column
            header="ACCIONES"
            style={{ width: "10%" }}
            body={(survey) => (
              <div className="d-flex align-items-center" style={{ gap: "6px" }}>
                <Tooltip label="Modificar">
                  <button type="button" onClick={() => openModalUpdateSurvey(survey)} style={{ ...ICON_BTN_STYLE, border: "1.5px solid #dbeafe", color: "#3b82f6" }}>
                    <i className="fa-regular fa-pen-to-square" style={{ fontSize: "0.85rem" }} />
                  </button>
                </Tooltip>
                <Tooltip label="Preguntas">
                  <button type="button" onClick={() => openModalListQuestionsOfSurvey(survey)} style={{ ...ICON_BTN_STYLE, border: "1.5px solid #e0d9f7", color: "#4a3aa7" }}>
                    <i className="fa-solid fa-clipboard-question" style={{ fontSize: "0.85rem" }} />
                  </button>
                </Tooltip>
                <Tooltip label="Gráfico">
                  <button type="button" onClick={() => openModalShowChartSurvey(survey)} style={{ ...ICON_BTN_STYLE, border: "1.5px solid #bae6fd", color: "#0ea5e9" }}>
                    <i className="fa-solid fa-chart-pie" style={{ fontSize: "0.85rem" }} />
                  </button>
                </Tooltip>
                <Tooltip label="Eliminar">
                  <button type="button" onClick={() => openModalDeleteSurvey(survey)} style={{ ...ICON_BTN_STYLE, border: "1.5px solid #fecdd3", color: "#dc3545" }}>
                    <i className="fa-regular fa-circle-xmark" style={{ fontSize: "0.85rem" }} />
                  </button>
                </Tooltip>
              </div>
            )}
          />
        </DataTable>
      </div>

      <SurveyUpdate
        visible={isOpenModalUpdateSurvey}
        survey={surveySelectedForUpdate}
        onClose={() => setIsOpenModalUpdateSurvey(false)}
        onUpdated={setUpdatedSurvey}
      />
      <SurveyQuestions
        visible={isOpenModalListQuestionsOfSurvey}
        survey={surveySelectedForShowQuestions}
        onClose={() => setIsOpenModalListQuestionsOfSurvey(false)}
      />
      <SurveyDelete
        visible={isOpenModalDeleteSurvey}
        survey={surveySelectedForDelete}
        onClose={() => setIsOpenModalDeleteSurvey(false)}
        onDeleted={removeSurvey}
      />
      <SurveyChart
        visible={isOpenModalShowChartSurvey}
        survey={surveySelectedForShowChartSurvey}
        onClose={() => setIsOpenModalShowChartSurvey(false)}
      />
    </div>
  );
}