"use client";

import { useState, useEffect } from "react";
import { Calendar, CalendarDateTemplateEvent, CalendarMonthChangeEvent } from "primereact/calendar";
import { addLocale } from "primereact/api";
import { getAllDates } from "@/lib/services/calendar.service";

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

export default function CalendarWidget() {
  const [dates, setDates] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    getAllDates().then(setDates).catch(() => {});
  }, []);

  const getDayEvents = (day: number, month: number, year: number) =>
    dates.filter((d: any) => {
      const dt = new Date(d.date);
      return dt.getFullYear() === year && dt.getMonth() === month && dt.getDate() === day;
    });

  const dateTemplate = (e: CalendarDateTemplateEvent) => {
    const events = getDayEvents(e.day, e.month, e.year);
    return (
      <span style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {e.day}
        {events.length > 0 && (
          <span style={{
            display: "block",
            width: "4px",
            height: "4px",
            background: "#7dd3fc",
            borderRadius: "50%",
            marginTop: "1px",
          }} />
        )}
      </span>
    );
  };

  const onMonthChange = (e: CalendarMonthChangeEvent) => {
    // month is 1-based from PrimeReact
    const filtered = dates.filter((d: any) => {
      const dt = new Date(d.date);
      return dt.getMonth() + 1 === e.month && dt.getFullYear() === e.year;
    });
    void filtered;
  };

  return (
    <div className="animate__animated animate__fadeIn calendar-widget-wrapper mb-3">
      <Calendar
        inline
        showWeek={false}
        locale="es"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.value as Date)}
        onMonthChange={onMonthChange}
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
        }

        .calendar-widget-wrapper .p-datepicker-month.p-link {
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

        .calendar-widget-wrapper .p-datepicker table td > span {
          color: #fff !important;
        }

        .calendar-widget-wrapper .p-datepicker table td.p-datepicker-today > span {
          background-color: #fff !important;
          color: #4B5667 !important;
          font-weight: bold !important;
          border-radius: 50% !important;
        }

        .calendar-widget-wrapper .p-datepicker-inline {
          width: 100% !important;
        }

        .calendar-widget-wrapper .p-datepicker-prev-icon,
        .calendar-widget-wrapper .p-datepicker-next-icon {
          color: #657187 !important;
        }

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
        }

        .calendar-widget-wrapper .p-datepicker table td,
        .calendar-widget-wrapper .p-datepicker table th {
          padding: 0.15rem !important;
          text-align: center !important;
        }

        /* Day headers (Do, Lu, Ma…) */
        .calendar-widget-wrapper .p-datepicker table th > span {
          color: rgba(255, 255, 255, 0.6) !important;
          font-size: clamp(10px, 2.5vw, 14px) !important;
          overflow: hidden;
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
        }

        /* Selected day */
        .calendar-widget-wrapper .p-datepicker table td > span.p-highlight {
          background-color: #4285F4 !important;
          color: #fff !important;
        }

        /* Disabled / other-month days */
        .calendar-widget-wrapper .p-datepicker table td.p-datepicker-other-month > span {
          color: rgba(255,255,255,0.3) !important;
        }
      `}</style>
    </div>
  );
}
