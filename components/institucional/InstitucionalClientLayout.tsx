"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Internal from "./Internal";
import Birthday from "./Birthday";
import BirthdayDialog from "./BirthdayDialog";
import Banners from "./Banners";
import Questions from "./Questions";
import CalendarWidget from "./CalendarWidget";
import AreasScroll from "./AreasScroll";
import Shorts from "./Shorts";

import { getTodayBirthdays } from "@/lib/services/calendar.service";
import { getActivatedBanners } from "@/lib/services/banners.service";
import { listAreas } from "@/lib/services/areas.service";
import { getActivatedShorts } from "@/lib/services/shorts.service";

function todayBirthdaysFilter(list: any[]): any[] {
  const now = new Date();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  return list.filter((p) => {
    const [, pm, pd] = (p.datebirth || "").split("-").map(Number);
    return pm === m && pd === d;
  });
}

function shouldShowBirthdayDialog(): boolean {
  const stored = localStorage.getItem("last_birthday_dialog_shown");
  if (!stored) return true;
  const now = new Date();
  return stored !== `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

function markBirthdayDialogShown() {
  const now = new Date();
  localStorage.setItem("last_birthday_dialog_shown", `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`);
}

export default function InstitucionalClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isRoot = !pathname.includes("/institucional/");

  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [shorts, setShorts] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogged, setIsLogged] = useState(false);

  useEffect(() => {
    setIsLogged(!!localStorage.getItem("token"));

    Promise.all([
      getTodayBirthdays().catch(() => []),
      getActivatedBanners().catch(() => []),
      listAreas().catch(() => []),
      getActivatedShorts().catch(() => []),
    ]).then(([bdays, bans, arrs, shts]) => {
      const filtered = todayBirthdaysFilter(bdays);
      setBirthdays(filtered);
      setBanners(bans);
      setAreas(arrs);
      setShorts(shts);
      setIsLoading(false);

      if (filtered.length > 0 && shouldShowBirthdayDialog()) {
        setTimeout(() => {
          setShowDialog(true);
          markBirthdayDialogShown();
        }, 500);
      }
    });
  }, []);

  return (
    <div className="animate__animated animate__fadeIn">
      <Navbar />

      {showDialog && isRoot && (
        <BirthdayDialog birthdays={birthdays} onClose={() => setShowDialog(false)} />
      )}

      <div className="row row-main pt-custom">
        <div className="col-12 col-main">
          <div className="row d-flex justify-content-center">

            {/* Left sidebar — xl only, root only */}
            {isRoot && (
              <div className="animate__animated animate__fadeInLeft col-12 col-xl-2">
                <div className="row px-2">
                  <div className="d-none d-xl-block justify-content-center col-12">
                    <Internal />
                  </div>

                  {birthdays.length > 0 && (
                    <div className="d-none d-xl-block justify-content-center col-12 px-2 mx-0 mt-4">
                      <Birthday
                        birthdays={birthdays}
                        isLoading={isLoading}
                        onShowDialog={() => setShowDialog(true)}
                      />
                    </div>
                  )}

                  {banners.length > 0 && (
                    <div className="d-none d-xl-block mt-4 justify-content-center col-12">
                      <Banners banners={banners} />
                    </div>
                  )}

                  <div className={`col-11 col-lg-12 d-none d-xl-block ${banners.length > 0 ? "mt-2" : "mt-4"}`}>
                    <Questions />
                  </div>
                </div>
              </div>
            )}

            {/* Center — main content */}
            <div className={`col-12 ${isRoot ? "col-xl-8" : "col-xl-12"} pl-lg-1 pr-lg-3`}>
              {children}
            </div>

            {/* Right sidebar — xl only, root only */}
            {isRoot && (
              <div className="animate__animated animate__fadeInRight col-12 col-xl-2 mt-2 mt-lg-0 pl-1">
                <div className="d-none d-xl-block mb-3 row">
                  <div className="col-12">
                    <CalendarWidget />
                  </div>
                </div>

                {isLogged && (
                  <div className="d-none d-xl-block div-soporte row mt-4 pt-2 px-3">
                    <div
                      className="col-12 pointer text-center pt-2 chat-card"
                      onClick={() => window.open("https://im.tribcuentasrionegro.gov.ar/livechat?mode=popout", "_blank")}
                      style={{ boxShadow: "rgba(0,0,0,0.16) 0px 3px 6px, rgba(0,0,0,0.23) 0px 3px 6px" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/img/chat/logo.svg" className="chat-logo" alt="Logo Soporte" />
                      <div className="badge bg-white p-2 text-dark chat-badge shadow-sm">
                        <strong>Chat soporte</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Areas scroll */}
          {isRoot && (
            <div className="d-flex justify-content-center row mb-3">
              <div className="col-12 col-xl-8 mx-0 pl-2 pr-3">
                <AreasScroll areas={areas} />
              </div>
            </div>
          )}

          {/* Shorts */}
          {isRoot && shorts.length > 0 && (
            <div className="d-flex justify-content-center row mt-5">
              <div className="col-12 col-xl-8">
                <Shorts shorts={shorts} />
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .pt-custom { padding-top: 50px; }
        .row-main { margin-left: 2.7rem; margin-right: 2.7rem; }
        .chat-card {
          background: linear-gradient(to bottom right, #4285F4, #1A5BC9);
          border-radius: 10px;
          transition: transform 0.2s ease-in-out;
          margin-top: -0.5rem !important;
          cursor: pointer;
        }
        .chat-logo {
          width: 55%;
        }
        .chat-badge {
          border-radius: 50px;
          margin-top: clamp(0.4rem, 6%, 0.75rem);
          margin-bottom: clamp(0.4rem, 6%, 0.75rem);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: clamp(0.8rem, 1.1vw, 0.9rem) !important;
          white-space: normal;
          width: 60%;
        }
        .chat-icon {
          font-size: clamp(1rem, 1.5vw, 1.25rem);
        }
        @media (max-width: 768px) {
          .pt-custom { padding-top: 25px; }
          .row-main { margin-left: 0; margin-right: 0; }
        }
      `}</style>
    </div>
  );
}
