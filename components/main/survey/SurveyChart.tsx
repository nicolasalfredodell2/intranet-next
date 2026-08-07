"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { Dialog } from "primereact/dialog";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip as ChartTooltip, type TooltipItem } from "chart.js";
import { Bar } from "react-chartjs-2";
import { ChartPie } from "lucide-react";
import { loadSurveyReport } from "@/lib/services/survey.service";

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTooltip);

const ANSWER_PALETTE = ["#4a6cf7", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#4a3aa7", "#0ea5e9", "#e34948"];

interface ChartItem {
  title: string;
  labels: string[];
  data: number[];
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

  const labels: string[] = [];
  const data: number[] = [];
  Object.values(results).forEach((result: any) => {
    labels.push(result[0].answer.value);
    data.push(result.length);
  });

  return { title: question?.name, labels, data };
}

function getChartWidth(chart: ChartItem): string {
  const answersCount = chart.labels.length;
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
            <div key={idx} className="text-center" style={{ width: getChartWidth(chart), padding: "16px" }}>
              <h6 className="mb-3"><small>{chart.title}</small></h6>
              <div style={{ height: 260, width: "100%" }}>
                <Bar
                  data={{
                    labels: chart.labels,
                    datasets: [
                      {
                        label: "Veces seleccionada",
                        data: chart.data,
                        backgroundColor: chart.labels.map((_, i) => ANSWER_PALETTE[i % ANSWER_PALETTE.length]),
                        borderWidth: 0,
                        borderRadius: 6,
                        maxBarThickness: 48,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: {
                        ticks: { font: { size: 11 }, color: "#475569" },
                        grid: { display: false },
                      },
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1,
                          font: { size: 10 },
                          color: "#94a3b8",
                          callback: (value) => (Number.isInteger(value) ? value : ""),
                        },
                        grid: { color: "rgba(0,0,0,0.05)" },
                      },
                    },
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: "#1e293b",
                        padding: 10,
                        cornerRadius: 8,
                        titleFont: { size: 12, weight: 600 },
                        bodyFont: { size: 11 },
                        callbacks: {
                          label: (item: TooltipItem<"bar">) => `${item.formattedValue} ${Number(item.raw) === 1 ? "vez" : "veces"}`,
                        },
                      },
                    },
                  }}
                />
              </div>
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