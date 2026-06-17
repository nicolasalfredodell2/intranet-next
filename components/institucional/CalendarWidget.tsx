"use client";

import { useState, useEffect } from "react";
import { getAllDates } from "@/lib/services/calendar.service";

export default function CalendarWidget() {
  const [dates, setDates] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDetails, setSelectedDetails] = useState<any | null>(null);

  useEffect(() => {
    getAllDates().then(setDates).catch(() => {});
  }, []);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const getDayEvents = (day: number) =>
    dates.filter((d: any) => {
      const dt = new Date(d.date);
      return dt.getFullYear() === year && dt.getMonth() === month && dt.getDate() === day;
    });

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const DAYS = ["Do","Lu","Ma","Mi","Ju","Vi","Sa"];

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayNum = new Date().getDate();
  const isCurrentMonth = new Date().getMonth() === month && new Date().getFullYear() === year;

  return (
    <div className="calendar-widget mb-3">
      <div className="cal-header d-flex align-items-center justify-content-between px-3 py-2">
        <button className="cal-nav" onClick={prevMonth}><i className="fas fa-chevron-left" /></button>
        <span className="text-white font-weight-bold">{MONTHS[month]} {year}</span>
        <button className="cal-nav" onClick={nextMonth}><i className="fas fa-chevron-right" /></button>
      </div>

      <div className="cal-grid px-2 pb-2">
        {DAYS.map((d) => (
          <div key={d} className="cal-day-label">{d}</div>
        ))}

        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />;
          const events = getDayEvents(day);
          const isToday = isCurrentMonth && day === todayNum;
          const isSelected = day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();

          return (
            <div
              key={idx}
              className={`cal-day ${isToday ? "today" : ""} ${isSelected ? "selected" : ""} ${events.length > 0 ? "has-event" : ""}`}
              onClick={() => {
                setSelectedDate(new Date(year, month, day));
                if (events.length > 0) setSelectedDetails(events[0]);
                else setSelectedDetails(null);
              }}
            >
              {day}
              {events.length > 0 && <span className="event-dot" />}
            </div>
          );
        })}
      </div>

      {selectedDetails && (
        <div className="cal-detail px-3 py-2 animated fadeIn">
          <p className="text-white mb-1" style={{ fontSize: "0.85rem", fontWeight: "bold" }}>
            {selectedDetails.title}
          </p>
          {selectedDetails.description && (
            <p className="text-white mb-0" style={{ fontSize: "0.78rem", opacity: 0.85 }}>
              {selectedDetails.description}
            </p>
          )}
          <button
            className="btn-close-detail"
            onClick={() => setSelectedDetails(null)}
          >
            <i className="fas fa-times" />
          </button>
        </div>
      )}

      <style jsx>{`
        .calendar-widget {
          background-color: #4B5667;
          border-radius: 15px;
          overflow: hidden;
          color: white;
        }
        .cal-header { background-color: #4B5667; }
        .cal-nav {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 0.85rem;
          padding: 4px 8px;
        }
        .cal-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
        }
        .cal-day-label {
          text-align: center;
          font-size: 0.7rem;
          color: rgba(255,255,255,0.6);
          padding: 4px 0;
        }
        .cal-day {
          text-align: center;
          font-size: 0.78rem;
          padding: 5px 2px;
          border-radius: 6px;
          cursor: pointer;
          position: relative;
          transition: background 0.15s;
        }
        .cal-day:hover { background: rgba(255,255,255,0.12); }
        .cal-day.today { background: rgba(66,133,244,0.35); font-weight: bold; }
        .cal-day.selected { background: #4285F4; font-weight: bold; }
        .cal-day.has-event { color: #7dd3fc; }
        .event-dot {
          display: block;
          width: 4px;
          height: 4px;
          background: #4285F4;
          border-radius: 50%;
          margin: 2px auto 0;
        }
        .cal-detail {
          border-top: 1px solid rgba(255,255,255,0.15);
          position: relative;
        }
        .btn-close-detail {
          background: none;
          border: none;
          color: rgba(255,255,255,0.6);
          position: absolute;
          top: 8px; right: 8px;
          cursor: pointer;
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  );
}
