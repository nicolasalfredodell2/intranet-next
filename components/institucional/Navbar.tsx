"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Internal from "./Internal";
import CalendarWidget from "./CalendarWidget";
import Questions from "./Questions";

const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function Navbar() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [canRemoteAccess, setCanRemoteAccess] = useState(false);
  const [canActionRemote, setCanActionRemote] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);
  const [showRemoteModal, setShowRemoteModal] = useState(false);
  const [showAgendaModal, setShowAgendaModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [dataUser, setDataUser] = useState<any>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const dark = localStorage.getItem("darkMode") === "true";
    setIsDarkMode(dark);
    if (dark) document.body.classList.add("dark-mode");

    const token = localStorage.getItem("token");
    if (!token) return;
    setIsLogged(true);

    try {
      const decoded: any = jwtDecode(token);
      const exp = new Date(decoded.exp * 1000);
      if (exp < new Date()) {
        localStorage.removeItem("token");
        setIsLogged(false);
        return;
      }
      if (decoded.resource_access?.frontend_workflow?.roles?.includes("remote_access")) {
        setCanRemoteAccess(true);
      }
    } catch { /* invalid token */ }

    // Load user data
    fetch(`${API}people/profile`, { headers: authHeaders() })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setDataUser(data); })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem("darkMode", String(next));
    document.body.classList.toggle("dark-mode", next);
  };

  const startCountdown = (seconds: number) => {
    setCanActionRemote(false);
    setCountdown(seconds);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(countdownRef.current!);
          setCanActionRemote(true);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const connectRemote = async () => {
    setIsLoadingRemote(true);
    try {
      const res = await fetch(`${API}personal/cargar-fichada-remota`, { method: "POST", headers: authHeaders() });
      if (!res.ok) throw new Error();
      setShowRemoteModal(false);
      startCountdown(15);
    } catch {
      alert("No se pudo fichar remoto");
    } finally {
      setIsLoadingRemote(false);
    }
  };

  const apiUrl = API.replace(/\/api\/?$/, "");

  return (
    <>
      <nav className="navbar mx-auto custom-navbar flex-column">
        <div className="row h-100 w-100 flex-nowrap align-items-center justify-content-end m-0 px-4" style={{ minHeight: "98.9px" }}>

          {/* Logo */}
          <div className="col-auto d-flex align-items-center pointer brand-group pl-0 mr-auto" onClick={() => router.push("/institucional")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/trib-cuentas-escudo-white.png" alt="homepage" className="nav-logo" />
            <h1 className="title ml-3 mb-0 d-none d-md-block">INTRANET</h1>
          </div>

          {/* Mobile: dark toggle */}
          <label className="d-md-none theme-switch-wrapper mb-0" style={{ backgroundColor: isDarkMode ? "#000" : "#D8DBE2" }}>
            <input type="checkbox" checked={isDarkMode} onChange={toggleDarkMode} />
            <div className="slider">
              <i className={`fa fa-sun theme-icon ${isDarkMode ? "text-muted" : "text-dark"}`} />
              <i className={`fa fa-moon theme-icon ${isDarkMode ? "text-dark" : "text-muted"}`} />
            </div>
          </label>

          {/* Mobile: fingerprint */}
          {isLogged && canRemoteAccess && (
            <button
              onClick={() => setShowRemoteModal(true)}
              className={`d-md-none btn-action-circle btn-remote center-content pointer ${canActionRemote ? "btn-info" : "btn-muted"}`}
              disabled={!canActionRemote}
            >
              {canActionRemote
                ? <i className="mdi mdi-fingerprint fingerprint-icon" />
                : <span className="countdown-text">{countdown}s</span>
              }
            </button>
          )}

          {/* Mobile: profile */}
          {isLogged && (
            dataUser?.avatar
              ? <img onClick={() => router.push("/main/profile")} className="d-md-none pointer img-profile shadow-sm" src={`${apiUrl}/${dataUser.avatar}`} alt="perfil" />
              : <div className="d-md-none btn-action-circle btn-profile pointer shadow-sm center-content ml-2" onClick={() => router.push("/main/profile")}>
                  <i className="mdi mdi-account profile-icon text-white w-100 text-center" />
                </div>
          )}

          {/* Mobile: hamburger */}
          <button
            className="d-md-none btn-action-circle center-content pointer border-0 bg-transparent text-white ml-2"
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            style={{ width: "auto", height: "auto" }}
          >
            <i className={`fa ${isMobileMenuOpen ? "fa-bars-staggered" : "fa-bars"}`} style={{ fontSize: "1.8rem" }} />
          </button>

          {/* Desktop controls */}
          <div className="col-auto d-none d-md-flex align-items-center justify-content-end control-gap pr-0">
            <label className="theme-switch-wrapper mb-0" style={{ backgroundColor: isDarkMode ? "#000" : "#D8DBE2" }}>
              <input type="checkbox" checked={isDarkMode} onChange={toggleDarkMode} />
              <div className="slider">
                <i className={`fa fa-sun theme-icon ${isDarkMode ? "text-muted" : "text-dark"}`} />
                <i className={`fa fa-moon theme-icon ${isDarkMode ? "text-dark" : "text-muted"}`} />
              </div>
            </label>

            {isLogged && canRemoteAccess && (
              <button
                onClick={() => setShowRemoteModal(true)}
                className={`btn-action-circle btn-remote center-content pointer ${canActionRemote ? "btn-info" : "btn-muted"}`}
                disabled={!canActionRemote}
              >
                {canActionRemote
                  ? <i className="mdi mdi-fingerprint fingerprint-icon" />
                  : <span className="countdown-text">{countdown}s</span>
                }
              </button>
            )}

            {isLogged && (
              <>
                {dataUser?.avatar
                  ? <img className="pointer img-profile shadow-sm" onClick={() => router.push("/main/profile")} src={`${apiUrl}/${dataUser.avatar}`} alt="perfil" />
                  : <div className="btn-action-circle btn-profile pointer shadow-sm center-content" onClick={() => router.push("/main/profile")}>
                      <i className="mdi mdi-account profile-icon text-white" />
                    </div>
                }
                <strong className="text-white pointer mx-0 px-0" onClick={() => router.push("/main/profile")}>PERFIL</strong>
              </>
            )}
          </div>
        </div>

        {/* Mobile collapse menu */}
        <div className={`mobile-collapse-menu w-100 d-md-none${isMobileMenuOpen ? " open" : ""}`}>
          <div className="row m-0 py-0 w-100 align-items-stretch">
            {[
              { icon: "fa fa-phone", label: "Agenda", onClick: () => setShowAgendaModal(true) },
              { icon: "fa-regular fa-calendar", label: "Calendario", onClick: () => setShowCalendarModal(true) },
              { isChat: true, label: "Chat" },
              { icon: "fa fa-file-pen", label: "Encuesta", onClick: () => setShowQuestionsModal(true) },
            ].map((item: any, i) => (
              <div key={i} className="col-3 py-0 my-0 px-1 sector" onClick={item.isChat ? () => window.open("https://im.tribcuentasrionegro.gov.ar/livechat?mode=popout", "_blank") : item.onClick}>
                <div className="sector-container text-center pointer d-flex flex-column align-items-center justify-content-center h-100">
                  {item.isChat
                    ? <img src="/img/chat/logo.svg" className="sector-icon img-logo-caht" alt="Chat" />
                    : <i className={`sector-icon ${item.icon} text-white`} />
                  }
                  <p className="text-sector text-dark text-center mt-1 mb-2">{item.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="row px-1 py-2 mt-2">
            <div className="col-12">
              <button className="btn btn-info btn-rrhh w-100" onClick={() => router.push("/main/absence-notices")}>
                Avisos
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Remote modal */}
      {showRemoteModal && (
        <div className="custom-overlay" onClick={() => !isLoadingRemote && setShowRemoteModal(false)}>
          <div className="remote-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="text-center pt-3 pb-2 animated fadeIn">
              <div className="mb-3">
                <i className="fa-solid fa-laptop-house text-primary" style={{ fontSize: "3rem", opacity: 0.8 }} />
              </div>
              <h5 className="font-weight-bold text-dark mb-2">¿Registrar fichada remota?</h5>
              <p className="text-muted mb-0" style={{ fontSize: "0.95rem" }}>
                Estás a punto de registrar tu horario desde una ubicación remota.
              </p>
            </div>

            {isLoadingRemote && (
              <div className="text-center my-3">
                <i className="pi pi-spin pi-spinner mr-2" />
                <small className="text-muted font-weight-bold">Procesando conexión...</small>
              </div>
            )}

            {!isLoadingRemote && (
              <div className="d-flex justify-content-between w-100 mt-3 animated fadeIn">
                <button className="btn btn-light text-muted w-100 mr-2" style={{ borderRadius: "8px" }} onClick={() => setShowRemoteModal(false)}>
                  Cancelar
                </button>
                <button className="btn btn-primary shadow-sm w-100 ml-2" style={{ borderRadius: "8px" }} onClick={connectRemote}>
                  <i className="fa-solid fa-check mr-1" /> Confirmar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Agenda modal */}
      {showAgendaModal && (
        <div className="custom-overlay" onClick={() => setShowAgendaModal(false)}>
          <div className="elegant-dialog" onClick={(e) => e.stopPropagation()}>
            <button className="dialog-close-btn" onClick={() => setShowAgendaModal(false)}>&times;</button>
            <div className="row d-flex justify-content-center">
              <div className="col-12 col-md-10 mx-auto">
                <Internal />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar modal */}
      {showCalendarModal && (
        <div className="custom-overlay" onClick={() => setShowCalendarModal(false)}>
          <div className="elegant-dialog" onClick={(e) => e.stopPropagation()}>
            <button className="dialog-close-btn" onClick={() => setShowCalendarModal(false)}>&times;</button>
            <div className="row d-flex justify-content-center mb-5">
              <div className="col-10 mx-auto">
                <CalendarWidget />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Questions modal */}
      {showQuestionsModal && (
        <div className="custom-overlay" onClick={() => setShowQuestionsModal(false)}>
          <div className="elegant-dialog" onClick={(e) => e.stopPropagation()}>
            <button className="dialog-close-btn" onClick={() => setShowQuestionsModal(false)}>&times;</button>
            <div className="row d-flex justify-content-center mb-5">
              <div className="col-10 mx-auto">
                <Questions />
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .center-content { display: flex; align-items: center; justify-content: center; }
        .custom-navbar {
          background-color: #454C5C !important;
          border-bottom-left-radius: 39px;
          border-bottom-right-radius: 39px;
          width: 98vw;
          min-height: 98.9px;
          padding: 0.5rem 1rem !important;
          z-index: 10000;
          display: flex;
          align-items: stretch !important;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .nav-logo { height: clamp(35px, 6vw, 45px); width: auto; }
        .title {
          color: #FFF !important;
          font-size: clamp(24px, 3vw, 35px) !important;
          font-weight: 400 !important;
          letter-spacing: 3.5px;
          white-space: nowrap;
          line-height: clamp(28px, 3.5vw, 38.5px) !important;
        }
        .control-gap { gap: clamp(0.5rem, 2vw, 1.5rem); }
        .btn-action-circle {
          width: clamp(60px, 15vw, 60px);
          height: clamp(60px, 15vw, 60px);
          border-radius: 50%;
          border: none;
          flex-shrink: 0;
          transition: transform 0.2s;
        }
        .btn-info {
          background: linear-gradient(to bottom right, #4285F4, #1A5BC9) !important;
          border: 1.5px solid white !important;
          color: white;
        }
        .btn-muted {
          background-color: #555 !important;
          opacity: 0.6;
          border: 2px solid #888 !important;
        }
        .btn-profile { background-color: #3b4453; }
        .fingerprint-icon { font-size: 2.7rem !important; }
        .countdown-text { font-weight: bold; color: white; font-size: 1.1rem; }
        .img-profile {
          width: clamp(60px, 15vw, 60px);
          height: clamp(60px, 15vw, 60px);
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
        }
        .theme-switch-wrapper {
          height: clamp(42px, 4.5vw, 40px);
          width: clamp(80px, 8.5vw, 80px);
          position: relative;
          display: inline-block;
          border-radius: 30px;
          margin: 0;
          flex-shrink: 0 !important;
        }
        .theme-switch-wrapper input { display: none; }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          border-radius: 34px;
          display: flex;
          align-items: center;
          justify-content: space-around;
          transition: .4s;
        }
        .slider:before {
          content: "";
          position: absolute;
          background-color: #FFF;
          height: 80%; width: 40%;
          left: 5%; bottom: 10%;
          border-radius: 50%;
          z-index: 2;
          transition: .4s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        input:checked + .slider:before { transform: translateX(120%); }
        .theme-icon { font-size: 1.5rem !important; z-index: 1; }
        .mobile-collapse-menu {
          max-height: 0;
          overflow: hidden;
          opacity: 0;
          transition: max-height 0.35s ease-in-out, opacity 0.35s ease-in-out;
        }
        .mobile-collapse-menu.open { max-height: 250px; opacity: 1; }
        .btn-rrhh {
          font-weight: bold;
          font-size: 16px;
          border: none !important;
          border-top-left-radius: 0 !important;
          border-top-right-radius: 0 !important;
          border-bottom-left-radius: 15px !important;
          border-bottom-right-radius: 15px !important;
        }
        .sector-icon {
          font-size: 30px;
          padding: 15px;
          border-radius: 50%;
          background-color: #34373E;
          margin-top: 15px;
        }
        .sector { padding-bottom: 30px; padding-top: 30px; }
        .img-logo-caht { height: 62.5px; width: 62.5px; padding: 10px; }
        .sector-container {
          background-color: #8994A7;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 147px;
          width: 100%;
        }
        .text-sector { font-size: 12px; }
        .custom-overlay {
          position: fixed;
          top: 0; left: 0;
          width: 100vw; height: 100vh;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
        }
        .remote-dialog {
          background: #fff;
          border-radius: 12px;
          padding: 1.5rem;
          width: 400px;
          max-width: 90vw;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        .elegant-dialog {
          background: #4B5667;
          border-radius: 12px;
          padding: 2rem;
          width: 50vw;
          max-width: 90vw;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          position: relative;
          max-height: 80vh;
          overflow-y: auto;
        }
        .dialog-close-btn {
          position: absolute;
          top: 10px; right: 15px;
          background: #dc3545;
          color: #fff;
          border: none;
          border-radius: 50%;
          width: 32px; height: 32px;
          font-size: 1.2rem;
          cursor: pointer;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @media (max-width: 576px) {
          .custom-navbar { width: 100vw; border-radius: 0 0 25px 25px !important; padding: 0.5rem !important; }
          .elegant-dialog { width: 90vw; }
          .text-sector { font-size: 12.5px; }
        }
        @media (max-width: 850px) {
          .btn-action-circle {
            width: clamp(60px, 15vw, 40px);
            height: clamp(60px, 15vw, 40px);
          }
        }
      `}</style>
    </>
  );
}
