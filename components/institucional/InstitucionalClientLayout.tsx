"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Internal from "./Internal";
import Birthday from "./Birthday";
import BirthdayDialog from "./BirthdayDialog";
import Banners from "./Banners";
import ImportantEvents from "./ImportantEvents";
import Questions from "./Questions";
import CalendarWidget from "./CalendarWidget";
import AreasScroll from "./AreasScroll";
import Shorts from "./Shorts";
import ChatSoporteButton from "@/components/common/ChatSoporteButton";

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
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setIsDarkMode(localStorage.getItem("darkMode") === "true");
  }, []);

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem("darkMode", String(next));
  };

  useEffect(() => {
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
    <div className={`animate__animated animate__fadeIn institucional-shell${isDarkMode ? " dark-mode" : ""}`}>
      <Navbar isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

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

                  <div className="d-none d-xl-block mt-4 justify-content-center col-12">
                    <ImportantEvents banners={banners} />
                  </div>

                  <div className="col-11 col-lg-12 d-none d-xl-block mt-2">
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

      <ChatSoporteButton />

      <style jsx>{`
        .pt-custom { padding-top: 50px; }
        .row-main { margin-left: 2.7rem; margin-right: 2.7rem; }
        @media (max-width: 768px) {
          .pt-custom { padding-top: 25px; }
          .row-main { margin-left: -15px; margin-right: -15px; }
        }
      `}</style>
    </div>
  );
}
