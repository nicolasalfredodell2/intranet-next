"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { Dialog } from "primereact/dialog";
import { getDataUser } from "@/lib/services/perfil.service";
import { connectRemote } from "@/lib/services/remote.service";
import { loadDailyPart } from "@/lib/services/daily-part.service";
import { useTimeclock } from "@/lib/hooks/useTimeclock";
import { version as appVersion } from "@/package.json";

const LATE_THRESHOLD_MINS = 11;
const LATE_DIALOG_STORAGE_KEY = "late-arrival-dialog-shown-date";

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatMinutesLabel(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m} minutos`;
}

function decodeJWT(token: string): any {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

const STORAGE_KEYS = ["token", "token-workflow", "redirect", "redirect-question", "roles", "user"];
const REMOTE_COOLDOWN_S = 15;
const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export default function Navbar() {
  const toast = useRef<Toast>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const hlMenuRef = useRef<HTMLDivElement>(null);
  const [canRemoteAccess, setCanRemoteAccess] = useState(false);
  const [canActionRemote, setCanActionRemote] = useState(true);
  const [showRemoteModal, setShowRemoteModal] = useState(false);
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [userData, setUserData] = useState<{ first_name?: string; last_name?: string; email?: string; avatar?: string } | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [horario, setHorario] = useState<{ in: string; out: string } | null>(null);
  const [isLate, setIsLate] = useState<boolean>(false);
  const [hourInDiffMins, setHourInDiffMins] = useState<number>(0);
  const [showHLMenu, setShowHLMenu] = useState(false);
  const [showLateDialog, setShowLateDialog] = useState(false);
  const { groups: timeclockGroups, search: searchTimeclock } = useTimeclock();
  const fichadas = timeclockGroups[0]?.records ?? [];

  function fetchFichadas() {
    loadDailyPart({ user_authenticated: true })
      .then((resp) => {
        const row = Object.values(resp[0])[0] as any;
        if (row?.working?.hour_in && row?.working?.hour_out) {
          setHorario({ in: row.working.hour_in, out: row.working.hour_out });
        }
        const late = row?.is_late === 1;
        const diffMins = row?.hour_in_diff ?? 0;
        setIsLate(late);
        setHourInDiffMins(diffMins);

        if (late && diffMins >= LATE_THRESHOLD_MINS) {
          const today = todayStr();
          if (localStorage.getItem(LATE_DIALOG_STORAGE_KEY) !== today) {
            localStorage.setItem(LATE_DIALOG_STORAGE_KEY, today);
            setShowLateDialog(true);
          }
        }
      })
      .catch(() => {});
  }

  useEffect(() => {
    verifyTokenPermissions();
    getDataUser()
      .then((data) => setUserData(data))
      .catch(() => {});
    fetchFichadas();
    searchTimeclock();
    const interval = setInterval(() => { fetchFichadas(); searchTimeclock(); }, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    if (showUserMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (hlMenuRef.current && !hlMenuRef.current.contains(e.target as Node)) {
        setShowHLMenu(false);
      }
    }
    if (showHLMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showHLMenu]);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const interval = setInterval(() => {
      setCooldownLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownLeft]);

  function verifyTokenPermissions() {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) return;

    const decoded = decodeJWT(token);
    if (!decoded) return;

    if (new Date(decoded.exp * 1000) < new Date()) {
      STORAGE_KEYS.forEach((k) => {
        sessionStorage.removeItem(k);
        localStorage.removeItem(k);
      });
      return;
    }

    if (decoded.resource_access?.frontend_workflow?.roles?.includes("remote_access")) {
      setCanRemoteAccess(true);
    }
  }

  function toggleMobileSidebar() {
    if (window.innerWidth >= 768) return;
    document.body.classList.add("mini-sidebar");
    document.body.classList.toggle("show-sidebar");
  }

  async function handleConnectRemote() {
    setIsLoadingRemote(true);
    try {
      await connectRemote();
      setCanActionRemote(false);
      setCooldownLeft(REMOTE_COOLDOWN_S);
      setIsLoadingRemote(false);
      setShowRemoteModal(false);
      toast.current?.show({
        severity: "success",
        summary: "Fichada remota registrada con éxito",
        life: 3500,
      });
      setTimeout(() => setCanActionRemote(true), REMOTE_COOLDOWN_S * 1000);
    } catch {
      setIsLoadingRemote(false);
      toast.current?.show({
        severity: "error",
        summary: "No se pudo fichar remoto",
        detail: "Intentelo de nuevo, por favor",
        life: 3500,
      });
    }
  }

  const userInitials = (
    (userData?.first_name?.[0] ?? "") + (userData?.last_name?.[0] ?? "")
  ).toUpperCase();

  const fullName = [userData?.first_name, userData?.last_name].filter(Boolean).join(" ");

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />

      <header className="topbar fadeIn">
        <nav className="navbar top-navbar navbar-expand-md navbar-light">

          {/* Brand */}
          <div className="navbar-header pointer text-center">
            <Link className="navbar-brand" href="/institucional" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
              <img
                src="/img/trib-cuentas-escudo.png"
                alt="Tribunal de Cuentas de Río Negro"
                width="27"
                height="27"
              />
              <div className="d-none d-xl-flex flex-column" style={{ lineHeight: 1, textAlign: "left" }}>
                <span className="d-flex align-items-center" style={{ gap: "6px" }}>
                  <span style={{
                    fontWeight: 800,
                    fontSize: "0.92rem",
                    letterSpacing: "0.1em",
                    color: "#1a1a2e",
                  }}>
                    INTRANET
                  </span>
                  <span style={{ fontSize: "0.78rem", color: "#adb5bd", fontWeight: 600 }}>
                    v{appVersion}
                  </span>
                </span>
                <span style={{ fontSize: "0.58rem", color: "#adb5bd", letterSpacing: "0.03em", fontWeight: 500, marginTop: "2px" }}>
                  Tribunal de Cuentas de la provincia de Río Negro
                </span>
              </div>
            </Link>
          </div>

          <div className="navbar-collapse">
            {/* Mobile hamburger */}
            <ul className="navbar-nav mr-auto">
              <li className="nav-item d-md-none d-flex align-items-center">
                <button
                  type="button"
                  className="mobile-menu-btn"
                  onClick={toggleMobileSidebar}
                  aria-label="Abrir menú de navegación"
                >
                  <i className="mdi mdi-menu" />
                </button>
              </li>
            </ul>

            {/* Right actions */}
            <ul className="navbar-nav my-lg-0 align-items-center" style={{ gap: "4px" }}>

              {/* Chip horario laboral + dropdown fichadas */}
              {horario && (
                <li className="nav-item px-1">
                  <div ref={hlMenuRef} style={{ position: "relative" }}>
                    <button
                      type="button"
                      title="Historial Laboral"
                      onClick={() => setShowHLMenu((prev) => !prev)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        background: "#eef1ff",
                        color: "#4a6cf7",
                        borderRadius: "20px",
                        padding: "3px 10px",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        border: "none",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Fichadas de hoy
                      <i className="pi pi-chevron-down" style={{ fontSize: "0.6rem", opacity: 0.6 }} />
                    </button>

                    {showHLMenu && (
                      <div className="animated fadeIn" style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        right: 0,
                        background: "#fff",
                        borderRadius: "12px",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                        minWidth: "200px",
                        zIndex: 1000,
                        overflow: "hidden",
                      }}>
                        <div style={{ padding: "10px 14px 6px", borderBottom: "1px solid #f0f0f0" }}>
                          <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#aaa" }}>Horario laboral</p>
                          <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#6c757d" }}>{horario.in} - {horario.out}</p>
                        </div>

                        <div style={{ padding: "10px 14px 6px", borderBottom: "1px solid #f0f0f0" }}>
                          <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#aaa" }}>Fichadas del día</p>
                          
                          {fichadas.length === 0 ? (
                            <div style={{ padding: "12px 14px", textAlign: "center", color: "#aaa", fontSize: "0.8rem" }}>
                              Sin fichadas registradas
                            </div>
                          ) : (
                            <div style={{ padding: "6px 0" }}>
                              {fichadas.map((f, idx) => {
                                const isFirst = idx === 0;
                                const isLastItem = idx === fichadas.length - 1;
                                const firstColor = isLate ? "#dc3545" : "#28a745";
                                const firstBg = isLate ? "#fff5f5" : "#f0fff4";
                                const diffH = Math.floor(hourInDiffMins / 60);
                                const diffM = hourInDiffMins % 60;
                                const diffLabel = diffH > 0
                                  ? `+${diffH}h ${diffM.toString().padStart(2, "0")}m`
                                  : `+${diffM}m`;
                                return (
                                  <div key={idx} style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "5px 1px",
                                    fontSize: "0.82rem",
                                    color: isFirst ? firstColor : isLastItem ? "#4a6cf7" : "#2f3d4a",
                                    fontWeight: isFirst || isLastItem ? 600 : 400,
                                    background: f.host === "RF_OUT" ? "#fff5f5" : f.host === "RF_IN" ? "#f0fff4" : "transparent",
                                  }}>
                                    <i
                                      className={`pi ${f.host === "RF_OUT" ? "pi-arrow-up" : f.host === "RF_IN" ? "pi-arrow-down" : "pi-clock"}`}
                                      style={{ fontSize: "0.75rem", opacity: 0.6 }}
                                    />
                                    {f.time}
                                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "5px" }}>
                                      <span style={{ fontSize: "0.62rem", color: "#94a3b8", fontWeight: 500, whiteSpace: "nowrap" }}>
                                        {f.hostLabel}
                                      </span>
                                      {isFirst && hourInDiffMins > 0 && (
                                        <span style={{ fontSize: "0.68rem", background: isLate ? "#ffe5e5" : "#e5ffe9", color: firstColor, borderRadius: "20px", padding: "1px 6px", fontWeight: 700, whiteSpace: "nowrap" }}>
                                          {diffLabel}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div style={{ borderTop: "1px solid #f0f0f0", padding: "6px 8px" }}>
                          <Link
                            href="/main/income"
                            onClick={() => setShowHLMenu(false)}
                            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 6px", borderRadius: "8px", fontSize: "0.8rem", color: "#4a6cf7", textDecoration: "none", fontWeight: 500 }}
                          >
                            <i className="pi pi-external-link" style={{ fontSize: "0.75rem" }} />
                            Ver Fichadas Diarias
                          </Link>
                        </div>

                      </div>
                    )}
                  </div>
                </li>
              )}

               {/* Remote fichada */}
              {canRemoteAccess && (
                <li className="nav-item px-1">
                  <div className="d-flex flex-column align-items-center" style={{ gap: "1px" }}>
                    <button
                      onClick={() => canActionRemote && setShowRemoteModal(true)}
                      className={`btn-remote-circle ${canActionRemote ? "btn-remote-active" : "btn-remote-disabled"}`}
                      disabled={!canActionRemote}
                      title={canActionRemote ? "Fichar remotamente" : `Disponible en ${cooldownLeft}s`}
                    >
                      <i className="mdi mdi-fingerprint" style={{ fontSize: "1.7rem" }} />
                    </button>
                    {!canActionRemote && cooldownLeft > 0 && (
                      <span className="navbar-cooldown-badge">{cooldownLeft}s</span>
                    )}
                  </div>
                </li>
              )}

              {/* User identity + logout */}
              <li className="nav-item d-flex align-items-center pr-2" style={{ gap: "10px" }}>

                {/* Avatar with dropdown */}
                {userData && (
                  <div ref={userMenuRef} style={{ position: "relative" }}>
                    <button
                      type="button"
                      className="navbar-avatar-btn"
                      onClick={() => setShowUserMenu((prev) => !prev)}
                      title="Ver perfil"
                    >
                      {userData.avatar ? (
                        <img
                          src={`${API_URL}${userData.avatar}`}
                          alt="avatar"
                          className="navbar-avatar-img"
                        />
                      ) : (
                        <div className="navbar-user-avatar">
                          {userInitials || <i className="mdi mdi-account" />}
                        </div>
                      )}
                    </button>

                    {showUserMenu && (
                      <div className="navbar-user-dropdown animated fadeIn">
                        <div className="navbar-user-dropdown-header">
                          <div style={{ minWidth: 0 }}>
                            {fullName && <p className="navbar-user-dropdown-name">{fullName}</p>}
                            {userData.email && <p className="navbar-user-dropdown-email">{userData.email}</p>}
                          </div>
                        </div>
                        <div className="navbar-user-dropdown-divider" />
                        <Link href="/main/profile" className="navbar-user-dropdown-item" onClick={() => setShowUserMenu(false)}>
                          <i className="pi pi-user" style={{ fontSize: "0.85rem" }} />
                          Ver perfil
                        </Link>
                        <button
                          type="button"
                          className="navbar-user-dropdown-item navbar-user-dropdown-item--danger w-100"
                          onClick={() => { setShowUserMenu(false); window.dispatchEvent(new CustomEvent("open-logout")); }}
                        >
                          <i className="mdi mdi-logout" style={{ fontSize: "1rem" }} />
                          Cerrar sesión
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            </ul>
          </div>
        </nav>
      </header>

      {/* Remote fichada confirmation modal */}
      {showRemoteModal && (
        <div
          className="main-remote-overlay animated fadeIn"
          onClick={() => !isLoadingRemote && setShowRemoteModal(false)}
        >
          <div
            className="main-remote-dialog animated fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center pt-3 pb-2">
              <div className="mb-3">
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #eef1ff, #dde4ff)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                  <i className="mdi mdi-fingerprint" style={{ fontSize: "2.2rem", color: "#4a6cf7" }} />
                </div>
              </div>
              <h5 className="font-weight-bold text-dark mb-1">Fichada remota</h5>
              <p className="text-muted mb-0" style={{ fontSize: "0.88rem", lineHeight: 1.5 }}>
                Está a punto de registrar tu asistencia desde una ubicación remota.
              </p>
            </div>

            {isLoadingRemote ? (
              <div className="text-center my-4 animated fadeIn">
                <i className="pi pi-spin pi-spinner text-primary" style={{ fontSize: "1.5rem" }} />
                <p className="text-muted mt-2 mb-0" style={{ fontSize: "0.85rem", fontWeight: 600 }}>Registrando fichada...</p>
              </div>
            ) : (
              <div className="d-flex mt-4" style={{ gap: "10px" }}>
                <button
                  className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                  style={{ borderRadius: "10px", fontWeight: 600, gap: "6px" }}
                  onClick={handleConnectRemote}
                >
                  <i className="pi pi-check" style={{ fontSize: "0.85rem" }} />
                  Confirmar
                </button>

                <button
                  className="btn btn-light text-muted w-100"
                  style={{ borderRadius: "10px", fontWeight: 500 }}
                  onClick={() => setShowRemoteModal(false)}
                >
                  Volver
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Late arrival warning dialog */}
      <Dialog
        header={
          <div className="d-flex align-items-center" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fff4e6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-exclamation-triangle" style={{ color: "#fd7e14", fontSize: "1rem" }} />
            </div>
            <div>
              <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Llegada tardía</p>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Fichada de hoy</small>
            </div>
          </div>
        }
        visible={showLateDialog}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(440px, 92vw)" }}
        onHide={() => setShowLateDialog(false)}
        footer={
          <div className="d-flex align-items-center" style={{ gap: "8px" }}>
            <Link
              href="/main/absence-notices"
              onClick={() => setShowLateDialog(false)}
              className="btn btn-primary d-flex align-items-center"
              style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
            >
              <i className="pi pi-external-link" style={{ fontSize: "0.78rem" }} />
              Ir a Avisos
            </Link>
            <button
              type="button"
              onClick={() => setShowLateDialog(false)}
              className="btn btn-light text-muted ml-auto"
              style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
            >
              Desestimar
            </button>
          </div>
        }
      >
        <p style={{ fontSize: "0.88rem", color: "#374151", margin: 0 }}>
          Llegaste <strong>{formatMinutesLabel(hourInDiffMins)}</strong> tarde. Recordá generar el aviso correspondiente a Recursos Humanos por tu llegada tarde.
        </p>
        <p style={{ fontSize: "0.82rem", color: "#94a3b8", margin: "10px 0 0" }}>
          Si ya realizaste el aviso correspondiente, podés desestimar este mensaje.
        </p>
      </Dialog>
    </>
  );
}
