"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  BarElement,
  ArcElement,
  Legend,
  Tooltip as ChartTooltip,
  type TooltipItem,
} from "chart.js";
import { Bar, Doughnut, Pie, PolarArea } from "react-chartjs-2";
import { ChartPie } from "lucide-react";
import { loadSurveyReport } from "@/lib/services/survey.service";

ChartJS.register(CategoryScale, LinearScale, RadialLinearScale, BarElement, ArcElement, Legend, ChartTooltip);

const ANSWER_PALETTE = ["#4a6cf7", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#4a3aa7", "#0ea5e9", "#e34948"];

const MAX_LABEL_LENGTH = 22;

function truncateLabel(label: string): string {
  if (!label || label.length <= MAX_LABEL_LENGTH) return label;
  return `${label.slice(0, MAX_LABEL_LENGTH - 1).trimEnd()}…`;
}

const CHART_TYPE_STORAGE_KEY = "survey-chart-type";

type ChartType = "bar" | "bar-horizontal" | "doughnut" | "pie" | "polarArea";

const CHART_TYPE_OPTIONS: { label: string; value: ChartType }[] = [
  { label: "Barras verticales", value: "bar" },
  { label: "Barras horizontales", value: "bar-horizontal" },
  { label: "Dona", value: "doughnut" },
  { label: "Torta", value: "pie" },
  { label: "Área polar", value: "polarArea" },
];

function getStoredChartType(): ChartType {
  if (typeof window === "undefined") return "bar";
  const stored = localStorage.getItem(CHART_TYPE_STORAGE_KEY);
  return (CHART_TYPE_OPTIONS.find((o) => o.value === stored)?.value ?? "bar") as ChartType;
}

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

const TOOLTIP_BASE = {
  backgroundColor: "#1e293b",
  padding: 10,
  cornerRadius: 8,
  titleFont: { size: 12, weight: 600 as const },
  bodyFont: { size: 11 },
  callbacks: {
    label: (item: TooltipItem<any>) => {
      const v = Number(item.raw);
      return ` ${v} ${v === 1 ? "vez" : "veces"}`;
    },
  },
};

const LEGEND_BASE = {
  position: "bottom" as const,
  labels: { color: "#475569", font: { size: 10.5 }, boxWidth: 10, boxHeight: 10, padding: 10 },
};

function ChartFor({ chartType, chart }: { chartType: ChartType; chart: ChartItem }) {
  const colors = chart.labels.map((_, i) => ANSWER_PALETTE[i % ANSWER_PALETTE.length]);
  const displayLabels = chart.labels.map(truncateLabel);
  const tooltip = {
    ...TOOLTIP_BASE,
    callbacks: {
      ...TOOLTIP_BASE.callbacks,
      title: (items: TooltipItem<any>[]) => chart.labels[items[0]?.dataIndex ?? 0] ?? "",
    },
  };

  if (chartType === "bar" || chartType === "bar-horizontal") {
    const isHorizontal = chartType === "bar-horizontal";
    const categoryAxis = { ticks: { font: { size: 11 }, color: "#475569" }, grid: { display: false } };
    const valueAxis = {
      beginAtZero: true,
      ticks: { stepSize: 1, font: { size: 10 }, color: "#94a3b8", callback: (v: number) => (Number.isInteger(v) ? v : "") },
      grid: { color: "rgba(0,0,0,0.05)" },
    };
    return (
      <Bar
        data={{ labels: displayLabels, datasets: [{ label: "Veces seleccionada", data: chart.data, backgroundColor: colors, borderWidth: 0, borderRadius: 6, maxBarThickness: 48 }] }}
        options={{
          indexAxis: isHorizontal ? "y" : "x",
          responsive: true,
          scales: (isHorizontal ? { x: valueAxis, y: categoryAxis } : { x: categoryAxis, y: valueAxis }) as any,
          plugins: { legend: { display: false }, tooltip },
        }}
      />
    );
  }

  const pieData = { labels: displayLabels, datasets: [{ data: chart.data, backgroundColor: colors, borderColor: "#fff", borderWidth: 2 }] };
  const pieOptions = { responsive: true, plugins: { legend: LEGEND_BASE, tooltip } };

  if (chartType === "doughnut") return <Doughnut data={pieData} options={pieOptions} />;
  if (chartType === "pie") return <Pie data={pieData} options={pieOptions} />;

  return (
    <PolarArea
      data={pieData}
      options={{
        responsive: true,
        scales: { r: { ticks: { display: false }, grid: { color: "rgba(0,0,0,0.05)" }, angleLines: { color: "rgba(0,0,0,0.05)" } } },
        plugins: { legend: LEGEND_BASE, tooltip },
      }}
    />
  );
}

export default function SurveyChart({ visible, survey, onClose }: SurveyChartProps) {
  const toast = useRef<Toast>(null);
  const [charts, setCharts] = useState<ChartItem[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [chartType, setChartType] = useState<ChartType>(getStoredChartType);

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

  function handleChartTypeChange(value: ChartType) {
    setChartType(value);
    if (typeof window !== "undefined") localStorage.setItem(CHART_TYPE_STORAGE_KEY, value);
  }

  const chartDialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px", width: "100%", paddingRight: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <ChartPie size={18} color="#0ea5e9" />
      </div>
      <div className="flex-grow-1" style={{ minWidth: 0 }}>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>
          {isLoadingChart ? "Cargando gráficos" : "Estadísticas"}
        </p>
      </div>
      {!isLoadingChart && charts.length > 0 && (
        <Dropdown
          value={chartType}
          options={CHART_TYPE_OPTIONS}
          onChange={(e) => handleChartTypeChange(e.value)}
          className="chart-type-select"
          panelClassName="license-filter-dropdown-panel"
          style={{ width: 190, border: "1.5px solid #dbeafe", borderRadius: "8px" }}
        />
      )}
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
        <div>
          {isLoadingChart && (
            <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "50vh", color: "#94a3b8" }}>
              <div className="spinner-border" role="status">
                <span className="sr-only">Cargando...</span>
              </div>
              <p className="mt-3">Cargando gráficos...</p>
            </div>
          )}

          {!isLoadingChart && charts.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginTop: "16px" }}>
              {charts.map((chart, idx) => (
                <div key={idx} className="card profile-card" style={{ padding: "16px" }}>
                  <h6 className="mb-3" style={{ textAlign: "left", fontWeight: 700 }}>{chart.title}</h6>
                  <ChartFor chartType={chartType} chart={chart} />
                </div>
              ))}
            </div>
          )}

          {!isLoadingChart && charts.length === 0 && (
            <div className="text-center" style={{ padding: "40px" }}>
              <p style={{ color: "#94a3b8" }}>No hay preguntas con respuestas para graficar.</p>
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
}