"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, CalendarDateTemplateEvent, CalendarMonthChangeEvent } from "primereact/calendar";
import { addLocale } from "primereact/api";
import { getAllDates, getBirthdays } from "@/lib/services/calendar.service";

addLocale("es", {
  firstDayOfWeek: 1,
  dayNames: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
  dayNamesShort: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
  dayNamesMin: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"],
  monthNames: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  monthNamesShort: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
  today: "Hoy",
  now: "Ahora",
  clear: "Limpiar",
});

const MONTHS_ES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

/* ── Types ── */

interface EventEntry {
  description: string;
  color: string;
}

interface DayEvent {
  type: "birthday" | "holiday";
  color: string;
  label?: string;
  categoryTitle?: string;
  entries: EventEntry[];
}

type EventMap = Record<string, DayEvent[]>;

export interface CalendarDetail {
  title: string;
  date: string;
  data: EventEntry[];
}

interface HoverInfo {
  details: CalendarDetail[];
  x: number;
  y: number;
}

/* ── Pure helpers ── */

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Parsea "YYYY-MM-DD" sin pasar por Date constructor (evita desfase UTC). */
function parseDateParts(dateStr: string): { year: number; month: number; day: number } | null {
  const parts = dateStr.split("-");
  if (parts.length < 3) return null;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return { year, month, day };
}

function upsertEvent(map: EventMap, key: string, type: "birthday" | "holiday", color: string, entry: EventEntry) {
  if (!map[key]) map[key] = [];
  const slot = map[key].find((e) => e.type === type);
  if (slot) {
    slot.entries.push(entry);
  } else {
    map[key].push({ type, color, entries: [entry] });
  }
}

function transformBirthdays(birthdayDates: any[], map: EventMap): void {
  const base = new Date().getFullYear();

  [base - 1, base, base + 1].forEach((year) => {
    birthdayDates.forEach((person: any) => {
      if (!person.datebirth) return;
      // datebirth is "AAAA-MM-DD" — tomamos solo mes y día
      const parts = person.datebirth.split("-");
      if (parts.length < 3) return;
      const month = Number(parts[1]);
      const day = Number(parts[2]);
      if (!month || !day) return;
      const key = dateKey(year, month, day);
      upsertEvent(map, key, "birthday", "#9EB0CE", {
        description: person.lastname_name ?? person.name ?? "—",
        color: "#9EB0CE",
      });
    });
  });
}

function transformImportantDates(importantDates: any[], map: EventMap): void {
  importantDates.forEach((item: any) => {
    if (!item.date) return;
    const parsed = parseDateParts(item.date);
    if (!parsed) return;
    const { year, month, day } = parsed;
    const color = item.category?.colour ?? item.colour ?? item.color ?? "#4CAF50";
    const categoryTitle = item.category?.descript ?? item.category?.description ?? item.category?.name ?? "Día especial";
    const label = item.event ?? item.title ?? "Día especial";
    const key = dateKey(year, month, day);
    // Cada evento importante queda como su propio grupo (no se mezcla con otros del mismo
    // día), para que cada uno muestre su propio nombre y el color de su categoría.
    if (!map[key]) map[key] = [];
    map[key].push({ type: "holiday", color, label, categoryTitle, entries: [{ description: label, color }] });
  });
}

function formatDateLabel(key: string): string {
  const parts = key.split("-");
  if (parts.length < 3) return key;
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  return `${day} de ${MONTHS_ES[month - 1] ?? ""}`;
}

/* ── Tooltip ── */

function EventTooltip({ info }: { info: HoverInfo }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: info.x, top: info.y });

  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    let left = info.x - rect.width / 2;
    let top = info.y - rect.height - 12;
    if (left < 8) left = 8;
    if (left + rect.width > window.innerWidth - 8) left = window.innerWidth - rect.width - 8;
    if (top < 8) top = info.y + 20;
    setPos({ left, top });
  }, [info.x, info.y]);

  return createPortal(
    <div
      ref={ref}
      className="calendar-event-tooltip"
      style={{
        position: "fixed",
        left: pos.left,
        top: pos.top,
        zIndex: 9999,
        background: "rgba(30, 37, 51, 0.9)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        color: "#f1f5f9",
        borderRadius: "12px",
        padding: "12px 16px",
        minWidth: "180px",
        maxWidth: "260px",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 12px 36px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04)",
        pointerEvents: "none",
        fontSize: "0.8rem",
        lineHeight: 1.5,
      }}
    >
      {info.details.map((group, gi) => (
        <div key={gi} style={{ marginBottom: gi < info.details.length - 1 ? 10 : 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
            {group.title === "Cumpleaños" ? (
              <span style={{ fontSize: "0.85rem", lineHeight: 1 }}>🎁</span>
            ) : (
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: group.data[0]?.color ?? "#9EB0CE",
                  flexShrink: 0,
                  boxShadow: `0 0 6px ${group.data[0]?.color ?? "#9EB0CE"}99`,
                }}
              />
            )}
            <span style={{ fontWeight: 600, fontSize: "0.75rem", color: "#e2e8f0" }}>{group.title}</span>
          </div>
          {group.data.map((entry, ei) => (
            <div key={ei} style={{ paddingLeft: "14px", color: "#cbd5e1", fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {entry.description}
            </div>
          ))}
        </div>
      ))}

      <style jsx>{`
        .calendar-event-tooltip {
          animation: tooltipPop 0.16s ease-out;
        }
        @keyframes tooltipPop {
          from {
            opacity: 0;
            transform: translateY(4px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>,
    document.body
  );
}

/* ── Next-day summary card (debajo del calendario) ── */

function DaySectionSubtitle({ dotColor, children }: { dotColor?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
      {dotColor && (
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, flexShrink: 0, boxShadow: `0 0 6px ${dotColor}99` }} />
      )}
      <span style={{ fontWeight: 700, fontSize: "0.68rem", letterSpacing: "0.08em", color: "#94a3b8", textTransform: "uppercase" }}>
        {children}
      </span>
    </div>
  );
}

function DaySectionItem({ dotColor, children }: { dotColor?: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        paddingLeft: "13px",
        paddingTop: "2px",
        paddingBottom: "2px",
        color: "#e2e8f0",
        fontSize: "0.8rem",
        fontWeight: 600,
      }}
    >
      {dotColor && (
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0, boxShadow: `0 0 6px ${dotColor}99` }} />
      )}
      {children}
    </div>
  );
}

function NextDayCard({ date, birthdayEntries, holidayEvents }: { date: string; birthdayEntries: EventEntry[]; holidayEvents: DayEvent[] }) {
  return (
    <div style={{ marginTop: "8px" }}>
      <div style={{ background: "#1e2533", borderRadius: "12px", padding: "12px 14px", color: "#f1f5f9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "10px" }}>
          <span style={{ fontSize: "0.85rem", lineHeight: 1 }}>📅</span>
          <span style={{ fontWeight: 700, fontSize: "0.83rem", color: "#f1f5f9" }}>{date}</span>
        </div>

        {birthdayEntries.length > 0 && (
          <div style={{ marginBottom: holidayEvents.length ? "10px" : 0 }}>
            <DaySectionSubtitle>🎁 Cumpleaños</DaySectionSubtitle>
            {birthdayEntries.map((entry, i) => (
              <DaySectionItem key={`b-${i}`} dotColor="#9EB0CE">{entry.description}</DaySectionItem>
            ))}
          </div>
        )}

        {holidayEvents.map((ev, i) => (
          <div key={`h-${i}`} style={{ marginTop: i > 0 || birthdayEntries.length > 0 ? "10px" : 0 }}>
            <DaySectionSubtitle dotColor={ev.color}>{ev.categoryTitle ?? "Día especial"}</DaySectionSubtitle>
            <DaySectionItem>{ev.label}</DaySectionItem>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Component ── */

export default function CalendarWidget() {
  const [eventMap, setEventMap] = useState<EventMap>({});
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getAllDates(), getBirthdays()])
      .then(([importantDates, birthdayDates]) => {
        if (cancelled) return;
        const map: EventMap = {};
        transformBirthdays(birthdayDates, map);
        transformImportantDates(importantDates, map);
        setEventMap(map);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, []);

  const nextBirthday = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (let i = 1; i <= 366; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = dateKey(d.getFullYear(), d.getMonth() + 1, d.getDate());
      const dayEvents = eventMap[key];
      const bday = dayEvents?.find((ev) => ev.type === "birthday");
      if (bday) {
        const holidays = dayEvents?.filter((ev) => ev.type === "holiday") ?? [];
        return { date: key, entries: bday.entries, holidays };
      }
    }
    return null;
  }, [eventMap]);

  const handleMonthChange = useCallback((_e: CalendarMonthChangeEvent) => {
    setHoverInfo(null);
  }, []);

  const dateTemplate = useCallback((e: CalendarDateTemplateEvent) => {
    if (e.otherMonth) {
      return <span style={{ opacity: 0.3 }}>{e.day}</span>;
    }

    const key = dateKey(e.year, e.month + 1, e.day);
    const events = eventMap[key];

    if (!events?.length) {
      return (
        <span
          className="cal-day-plain"
          onClick={(ev) => ev.stopPropagation()}
          onMouseEnter={() => setHoverInfo(null)}
        >
          {e.day}
        </span>
      );
    }

    const hasBirthday = events.some((ev) => ev.type === "birthday");
    const hasHoliday = events.some((ev) => ev.type === "holiday");
    const holidayColor = events.find((ev) => ev.type === "holiday")?.color ?? "#4CAF50";

    let background: string;
    if (hasBirthday && hasHoliday) {
      background = `linear-gradient(135deg, ${holidayColor} 50%, #9EB0CE 51%)`;
    } else if (hasBirthday) {
      background = "#9EB0CE";
    } else {
      background = holidayColor;
    }

    const details: CalendarDetail[] = events.map((ev) => ({
      title: ev.type === "birthday" ? "Cumpleaños" : (ev.categoryTitle ?? "Día especial"),
      date: key,
      data: ev.entries,
    }));

    return (
      <span
        style={{ background, color: "#fff", borderRadius: "50%", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "default" }}
        onClick={(ev) => ev.stopPropagation()}
        onMouseEnter={(ev) => setHoverInfo({ details, x: ev.clientX, y: ev.clientY })}
        onMouseLeave={() => setHoverInfo(null)}
      >
        {e.day}
      </span>
    );
  }, [eventMap]);

  return (
    <div className="animate__animated animate__fadeIn calendar-widget-wrapper mb-3">
      <Calendar
        inline
        showWeek={false}
        showOtherMonths={false}
        locale="es"
        onMonthChange={handleMonthChange}
        dateTemplate={dateTemplate}
      />

      {hoverInfo && <EventTooltip info={hoverInfo} />}

      {nextBirthday && (
        <NextDayCard
          date={formatDateLabel(nextBirthday.date)}
          birthdayEntries={nextBirthday.entries}
          holidayEvents={nextBirthday.holidays}
        />
      )}

      <style jsx global>{`
        .calendar-widget-wrapper .p-calendar {
          border-radius: 10px !important;
          height: auto !important;
          width: 100% !important;
          display: block;
        }

        .calendar-widget-wrapper .p-datepicker-title {
          color: #657187 !important;
          font-size: 15px !important;
          line-height: 29px !important;
          font-weight: bold !important;
          font-family: 'Montserrat', sans-serif !important;
          text-transform: uppercase !important;
        }

        .calendar-widget-wrapper .p-datepicker-month,
        .calendar-widget-wrapper .p-datepicker-year {
          pointer-events: none !important;
          cursor: default !important;
          color: #000 !important;
          text-transform: uppercase !important;
        }

        .calendar-widget-wrapper .p-datepicker {
          padding-bottom: 2px !important;
          border: none !important;
          border-radius: 15px !important;
          box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px !important;
          background-color: #4B5667 !important;
          width: 100% !important;
          min-width: 100% !important;
          height: auto !important;
        }

        .calendar-widget-wrapper .p-datepicker-inline {
          width: 100% !important;
        }

        .calendar-widget-wrapper .p-datepicker-prev-icon,
        .calendar-widget-wrapper .p-datepicker-next-icon,
        .calendar-widget-wrapper .p-datepicker-prev,
        .calendar-widget-wrapper .p-datepicker-next {
          color: #657187 !important;
        }

        .calendar-widget-wrapper .p-datepicker-prev:hover,
        .calendar-widget-wrapper .p-datepicker-next:hover {
          background-color: rgba(101, 113, 135, 0.15) !important;
        }

        .calendar-widget-wrapper .p-datepicker-header {
          border-radius: 15px !important;
          background-color: #fff !important;
          border-bottom: none !important;
          color: #657187 !important;
          padding: 0px !important;
        }

        .calendar-widget-wrapper .p-datepicker table {
          width: 100% !important;
          table-layout: fixed !important;
          border-collapse: separate !important;
          border-spacing: 2px !important;
        }

        .calendar-widget-wrapper .p-datepicker table td,
        .calendar-widget-wrapper .p-datepicker table th {
          padding: 0.15rem !important;
          text-align: center !important;
        }

        .calendar-widget-wrapper .p-datepicker table th > span {
          color: rgba(255, 255, 255, 0.6) !important;
          font-size: clamp(10px, 2.5vw, 14px) !important;
        }

        .calendar-widget-wrapper .p-datepicker table td > span {
          width: 100% !important;
          max-width: 40px !important;
          height: auto !important;
          aspect-ratio: 1 / 1 !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          margin: 0 auto !important;
          border-radius: 50% !important;
          font-size: clamp(11px, 3vw, 15px) !important;
          white-space: nowrap !important;
          color: #fff !important;
          cursor: default !important;
        }

        .calendar-widget-wrapper .p-datepicker table td.p-datepicker-today > span {
          background-color: #fff !important;
          color: #4B5667 !important;
          font-weight: bold !important;
        }

        .calendar-widget-wrapper .p-datepicker table td > span.p-highlight {
          background-color: #4285F4 !important;
          color: #fff !important;
        }

        .calendar-widget-wrapper .p-datepicker table td.p-datepicker-other-month > span {
          color: rgba(255, 255, 255, 0.3) !important;
        }

        .calendar-widget-wrapper .p-datepicker table td > span.cal-day-plain:hover {
          background: transparent !important;
        }
      `}</style>
    </div>
  );
}