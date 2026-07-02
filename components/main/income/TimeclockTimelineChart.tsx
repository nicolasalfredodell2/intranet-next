"use client";

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, type TooltipItem, type Plugin } from "chart.js";
import { Bar } from "react-chartjs-2";
import { summarizeDay, timeToMinutes, TimeclockGroup, TimeclockDaySummary } from "@/lib/hooks/useTimeclock";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const COLOR_COMPLETE = "#4a6cf7";
const COLOR_COMPLETE_BG = "rgba(74,108,247,0.75)";
const COLOR_INCOMPLETE = "#94a3b8";
const COLOR_INCOMPLETE_BG = "rgba(148,163,184,0.18)";
const COLOR_TEMP_EXIT = "#f59e0b";
const COLOR_TEMP_RETURN = "#8b5cf6";

const TEMP_EXIT_TYPE = 2;
const TEMP_RETURN_TYPE = 3;

const STUB_MINUTES = 25;
const DEFAULT_MIN_MINUTES = 7 * 60;
const DEFAULT_MAX_MINUTES = 20 * 60;

const SHORT_MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function minutesToHHMM(totalMinutes: number): string {
  const m = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function formatDurationLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

function formatAxisDate(dateStr: string): string {
  try {
    const date = new Date(`${dateStr}T00:00:00`);
    return `${date.getDate()} ${SHORT_MONTHS[date.getMonth()]}`;
  } catch {
    return dateStr;
  }
}

interface BarSpan {
  range: [number, number] | null;
  status: "complete" | "entry-only" | "exit-only" | "empty";
}

function toBarSpan(summary: TimeclockDaySummary): BarSpan {
  if (summary.isComplete && summary.entryMinutes != null && summary.exitMinutes != null) {
    return { range: [summary.entryMinutes, summary.exitMinutes], status: "complete" };
  }
  if (summary.entryMinutes != null) {
    return { range: [summary.entryMinutes, summary.entryMinutes + STUB_MINUTES], status: "entry-only" };
  }
  if (summary.exitMinutes != null) {
    return { range: [summary.exitMinutes - STUB_MINUTES, summary.exitMinutes], status: "exit-only" };
  }
  return { range: null, status: "empty" };
}

interface TempMarker {
  minutes: number;
  time: string;
  typeId: 2 | 3;
}

function extractTempMarkers(group: TimeclockGroup): TempMarker[] {
  return group.records
    .filter((r) => r.typeId === TEMP_EXIT_TYPE || r.typeId === TEMP_RETURN_TYPE)
    .map((r) => ({ minutes: timeToMinutes(r.time), time: r.time, typeId: r.typeId as 2 | 3 }))
    .filter((m): m is TempMarker => m.minutes != null);
}

function drawDiamond(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  const r = 4.5;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r, y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 1.25;
  ctx.strokeStyle = "#fff";
  ctx.stroke();
}

export default function TimeclockTimelineChart({ groups }: { groups: TimeclockGroup[] }) {
  if (groups.length === 0) return null;

  // Most recent date first, same order as groups (and the per-day cards below).
  const orderedGroups = groups;
  const summaries = orderedGroups.map(summarizeDay);
  const spans = summaries.map(toBarSpan);
  const tempMarkersByDay = orderedGroups.map(extractTempMarkers);

  const tempMarkersPlugin: Plugin<"bar"> = {
    id: "tempMarkers",
    afterDatasetsDraw(chart) {
      const { ctx, scales } = chart;
      const xScale = scales.x;
      const yScale = scales.y;
      if (!xScale || !yScale) return;
      ctx.save();
      tempMarkersByDay.forEach((markers, index) => {
        const y = yScale.getPixelForValue(index);
        markers.forEach((m) => {
          const x = xScale.getPixelForValue(m.minutes);
          drawDiamond(ctx, x, y, m.typeId === TEMP_EXIT_TYPE ? COLOR_TEMP_EXIT : COLOR_TEMP_RETURN);
        });
      });
      ctx.restore();
    },
  };

  const allMinutes = summaries.flatMap((s) => [s.entryMinutes, s.exitMinutes]).filter((v): v is number => v != null);
  const dataMin = allMinutes.length ? Math.min(...allMinutes) : DEFAULT_MIN_MINUTES;
  const dataMax = allMinutes.length ? Math.max(...allMinutes) : DEFAULT_MAX_MINUTES;
  const xMin = Math.floor(Math.min(DEFAULT_MIN_MINUTES, dataMin - 30) / 60) * 60;
  const xMax = Math.ceil(Math.max(DEFAULT_MAX_MINUTES, dataMax + 30) / 60) * 60;

  const chartData = {
    labels: summaries.map((s) => formatAxisDate(s.date)),
    datasets: [
      {
        label: "Jornada laboral",
        data: spans.map((s) => s.range),
        backgroundColor: spans.map((s) => (s.status === "complete" ? COLOR_COMPLETE_BG : COLOR_INCOMPLETE_BG)),
        borderColor: spans.map((s) => (s.status === "complete" ? COLOR_COMPLETE : COLOR_INCOMPLETE)),
        borderWidth: spans.map((s) => (s.status === "complete" ? 0 : 1.5)),
        borderDash: spans.map((s) => (s.status === "complete" ? [] : [5, 4])),
        borderRadius: 6,
        borderSkipped: false,
        barThickness: 18,
        maxBarThickness: 20,
      },
    ],
  };

  const chartOptions = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        min: xMin,
        max: xMax,
        ticks: {
          stepSize: 60,
          callback: (value: string | number) => minutesToHHMM(Number(value)),
          font: { size: 10 },
          color: "#94a3b8",
        },
        grid: { color: "rgba(0,0,0,0.05)" },
      },
      y: {
        ticks: { font: { size: 11, weight: 600 as const }, color: "#475569" },
        grid: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e293b",
        padding: 10,
        cornerRadius: 8,
        titleFont: { size: 12, weight: 600 as const },
        bodyFont: { size: 11 },
        callbacks: {
          title: (items: TooltipItem<"bar">[]) => summaries[items[0].dataIndex]?.date ? formatAxisDate(summaries[items[0].dataIndex].date) : "",
          label: (item: TooltipItem<"bar">) => {
            const s = summaries[item.dataIndex];
            if (!s) return "";
            const lines: string[] = [];
            if (s.isComplete && s.entryTime && s.exitTime && s.durationMinutes != null) {
              lines.push(`Entrada: ${s.entryTime}`, `Salida: ${s.exitTime}`, `Duración: ${formatDurationLabel(s.durationMinutes)}`);
            } else if (s.entryTime && !s.exitTime) {
              lines.push(`Entrada: ${s.entryTime}`, "Sin salida registrada");
            } else if (!s.entryTime && s.exitTime) {
              lines.push("Sin entrada registrada", `Salida: ${s.exitTime}`);
            } else {
              lines.push("Sin fichadas ese día");
            }
            (tempMarkersByDay[item.dataIndex] ?? []).forEach((m) => {
              lines.push(m.typeId === TEMP_EXIT_TYPE ? `Salida temporal: ${m.time}` : `Regreso: ${m.time}`);
            });
            return lines;
          },
        },
      },
    },
  };

  return (
    <div className="card profile-card mt-4 fadeIn animated">
      <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
        <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <i className="pi pi-chart-bar" style={{ color: "#4a6cf7", fontSize: "1rem" }} />
        </div>
        <div className="flex-grow-1">
          <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Resumen de jornada</h5>
          <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Entrada y salida por día</small>
        </div>
      </div>
      <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />
      <div className="card-body" style={{ padding: "16px 20px 20px" }}>
        <div style={{ height: Math.max(120, summaries.length * 42), width: "100%" }}>
          <Bar data={chartData} options={chartOptions} plugins={[tempMarkersPlugin]} />
        </div>
        <div className="d-flex align-items-center mt-3" style={{ gap: "16px", flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "#64748b" }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: COLOR_COMPLETE, display: "inline-block" }} />
            Jornada completa
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "#64748b" }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, border: `1.5px dashed ${COLOR_INCOMPLETE}`, display: "inline-block" }} />
            Jornada incompleta
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "#64748b" }}>
            <span style={{ width: 9, height: 9, background: COLOR_TEMP_EXIT, display: "inline-block", transform: "rotate(45deg)" }} />
            Salida temporal
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "#64748b" }}>
            <span style={{ width: 9, height: 9, background: COLOR_TEMP_RETURN, display: "inline-block", transform: "rotate(45deg)" }} />
            Regreso temporal
          </span>
        </div>
      </div>
    </div>
  );
}
