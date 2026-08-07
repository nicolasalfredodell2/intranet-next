"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { Dialog } from "primereact/dialog";
import { Chart } from "primereact/chart";
import { ChartPie } from "lucide-react";
import { loadSurveyReport } from "@/lib/services/survey.service";

interface ChartItem {
  title: string;
  type: string;
  itemsChart: any;
  optionsChart: any;
}

interface SurveyChartProps {
  visible: boolean;
  survey: any;
  onClose: () => void;
}

function deleteRepeatsAndCount(answers: any[]) {
  return answers.reduce((r: Record<string, any[]>, a: any) => {
    r[a.answer_id] = r[a.answer_id] || [];
    r[a.answer_id].push(a);
    return r;
  }, Object.create(null));
}

function generateGraphic(question: any): ChartItem {
  const results = deleteRepeatsAndCount(question.people_answers ?? []);

  const labels: any[] = [];
  const data: any[] = [];
  Object.values(results).forEach((result: any) => {
    labels.push(result[0].answer.value);
    data.push(result.length);
  });

  const itemsChart = {
    labels,
    datasets: [
      {
        label: "Veces seleccionada",
        data,
        fill: false,
        backgroundColor: "rgba(255, 159, 64, 0.2)",
        borderColor: "rgb(255, 159, 64)",
        borderWidth: 1,
      },
    ],
  };

  const optionsChart = {
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          callback: (value: number) => (Number.isInteger(value) ? value : ""),
        },
      },
    },
  };

  return { title: question?.name, type: "bar", itemsChart, optionsChart };
}

function getChartWidth(chart: ChartItem): string {
  const answersCount = chart.itemsChart?.labels?.length ?? 0;
  if (answersCount <= 2) return "33.33%";
  if (answersCount <= 6) return "66.66%";
  return "100%";
}

export default function SurveyChart({ visible, survey, onClose }: SurveyChartProps) {
  const toast = useRef<Toast>(null);
  const [charts, setCharts] = useState<ChartItem[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState(false);

  useEffect(() => {
    if (visible && survey) loadChart(survey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, survey]);

  async function loadChart(survey: any) {
    setCharts([]);
    setIsLoadingChart(true);
    try {
      const resp = await loadSurveyReport(survey.id);
      const questions = resp.questions ?? [];
      setCharts(questions.map((question: any) => generateGraphic(question)));
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo cargar el gráfico" });
    } finally {
      setIsLoadingChart(false);
    }
  }

  const chartDialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <ChartPie size={18} color="#0ea5e9" />
      </div>
      <div style={{ minWidth: 0 }}>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>
          {isLoadingChart ? "Cargando gráficos" : "Estadísticas"}
        </p>
      </div>
    </div>
  );

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />
      <Dialog
        header={chartDialogHeader}
        visible={visible}
        modal
        draggable={false}
        resizable={false}
        dismissableMask
        style={{ height: "75vh", width: "min(60vw, 96vw)" }}
        onHide={onClose}
      >
        <div className="row justify-content-center" style={{ minHeight: "70vh" }}>
          {isLoadingChart && (
            <div className="col-12 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "50vh", color: "#94a3b8" }}>
              <div className="spinner-border" role="status">
                <span className="sr-only">Cargando...</span>
              </div>
              <p className="mt-3">Cargando gráficos...</p>
            </div>
          )}

          {!isLoadingChart && charts.map((chart, idx) => (
            <div key={idx} className="text-center mb-4" style={{ width: getChartWidth(chart) }}>
              <h6 className="mb-3"><small>{chart.title}</small></h6>
              <Chart type={chart.type} data={chart.itemsChart} options={chart.optionsChart} />
            </div>
          ))}

          {!isLoadingChart && charts.length === 0 && (
            <div className="col-12 text-center" style={{ padding: "40px" }}>
              <p style={{ color: "#94a3b8" }}>No hay preguntas con respuestas para graficar.</p>
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
}