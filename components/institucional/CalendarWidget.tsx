"use client";

import { useCallback, useEffect, useState } from "react";
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
  clear: "Limpiar",
});

/* ── Types ── */

interface EventEntry {
  description: string;
  color: string;
}

interface DayEvent {
  type: "birthday" | "holiday";
  color: string;
  entries: EventEntry[];
}

type EventMap = Record<string, DayEvent[]>;

export interface CalendarDetail {
  title: string;
  date: string;
  data: EventEntry[];
}

interface Props {
  onDetails?: (details: CalendarDetail[] | null) => void;
}

/* ── Pure helpers ── */

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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

/**
 * Replica la lógica de transformDataBirthdays del componente Angular.
 * Itera year-1, year, year+1 para cubrir cumpleaños que caen en meses limítrofes.
 */
function transformBirthdays(birthdayDates: any[], map: EventMap): void {
  const base = new Date().getFullYear();

  [base - 1, base, base + 1].forEach((year) => {
    birthdayDates.forEach((person: any) => {
      if (!person.datebirth) return;

      const lastTwo = person.datebirth.slice(-2);
      const withYear = `${year}${person.datebirth.substring(4)}`;
      const d = new Date(withYear);
      if (isNaN(d.getTime())) return;

      let month = d.getMonth();
      // Ajuste de borde: si el día es "01" (UTC offset) sumar 2 en lugar de 1
      month = lastTwo !== "01" ? month + 1 : month + 2;
      if (month < 1 || month > 12) return;

      const key = dateKey(year, month, d.getDate());
      upsertEvent(map, key, "birthday", "#9EB0CE", {
        description: person.lastname_name,
        color: "#9EB0CE",
      });
    });
  });
}

/**
 * Replica la lógica de transformDatesImportant del componente Angular.
 */
function transformImportantDates(importantDates: any[], map: EventMap): void {
  importantDates.forEach((item: any) => {
    if (!item.date) return;

    const lastTwo = item.date.slice(-2);
    const d = new Date(item.date);
    if (isNaN(d.getTime())) return;

    let month = d.getMonth();
    month = lastTwo !== "01" ? month + 1 : month + 2;
    if (month < 1 || month > 12) return;

    const color = item.colour ?? item.category?.colour ?? "#4CAF50";
    const key = dateKey(d.getFullYear(), month, d.getDate());
    upsertEvent(map, key, "holiday", color, { description: item.event, color });
  });
}

/* ── Component ── */

export default function CalendarWidget({ onDetails }: Props) {
  const [eventMap, setEventMap] = useState<EventMap>({});

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

  const handleMonthChange = useCallback((_e: CalendarMonthChangeEvent) => {
    onDetails?.(null);
  }, [onDetails]);

  const dateTemplate = useCallback((e: CalendarDateTemplateEvent) => {
    if (e.otherMonth) {
      return <span style={{ opacity: 0.3 }}>{e.day}</span>;
    }

    const key = dateKey(e.year, e.month + 1, e.day);
    const events = eventMap[key];

    if (!events?.length) {
      return (
        <span onMouseEnter={() => onDetails?.(null)}>
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
      title: ev.type === "birthday" ? "Cumpleaños" : "Día del profesional",
      date: key,
      data: ev.entries,
    }));

    return (
      <span
        style={{ background, color: "#fff", borderRadius: "50%", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        onMouseEnter={() => onDetails?.(details)}
        onMouseLeave={() => onDetails?.(null)}
      >
        {e.day}
      </span>
    );
  }, [eventMap, onDetails]);

  return (
    <div className="animate__animated animate__fadeIn calendar-widget-wrapper mb-3">
      <Calendar
        inline
        showWeek={false}
        locale="es"
        onMonthChange={handleMonthChange}
        dateTemplate={dateTemplate}
      />

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

        /* Table layout */
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

        /* Day headers */
        .calendar-widget-wrapper .p-datepicker table th > span {
          color: rgba(255, 255, 255, 0.6) !important;
          font-size: clamp(10px, 2.5vw, 14px) !important;
        }

        /* Day cells — circular, fluid */
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
        }

        /* Today */
        .calendar-widget-wrapper .p-datepicker table td.p-datepicker-today > span {
          background-color: #fff !important;
          color: #4B5667 !important;
          font-weight: bold !important;
        }

        /* Selected */
        .calendar-widget-wrapper .p-datepicker table td > span.p-highlight {
          background-color: #4285F4 !important;
          color: #fff !important;
        }

        /* Other-month days */
        .calendar-widget-wrapper .p-datepicker table td.p-datepicker-other-month > span {
          color: rgba(255, 255, 255, 0.3) !important;
        }
      `}</style>
    </div>
  );
}