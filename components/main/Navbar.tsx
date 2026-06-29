"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Toast } from "primereact/toast";
import { getDataUser } from "@/lib/services/perfil.service";
import { connectRemote } from "@/lib/services/remote.service";
import { loadDailyPart } from "@/lib/services/daily-part.service";

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
  const [fichadas, setFichadas] = useState<string[]>([]);
  const [isLate, setIsLate] = useState<boolean>(false);
  const [hourInDiffMins, setHourInDiffMins] = useState<number>(0);
  const [showHLMenu, setShowHLMenu] = useState(false);

  function fetchFichadas() {
    loadDailyPart({ user_authenticated: true })
      .then((resp) => {
        const row = Object.values(resp[0])[0] as any;
        if (row?.working?.hour_in && row?.working?.hour_out) {
          setHorario({ in: row.working.hour_in, out: row.working.hour_out });
        }
        if (row?.check) {
          const items = (row.check as string).split(",").map((t: string) => t.trim()).filter(Boolean);
          setFichadas(items);
        }
        setIsLate(row?.is_late === 1);
        setHourInDiffMins(row?.hour_in_diff ?? 0);
      })
      .catch(() => {});
  }

  useEffect(() => {
    verifyTokenPermissions();
    getDataUser()
      .then((data) => setUserData(data))
      .catch(() => {});
    fetchFichadas();
    const interval = setInterval(fetchFichadas, 3 * 60 * 1000);
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
      <Toast ref={toast} position="bottom-center" />

      <header className="topbar fadeIn">
        <nav className="navbar top-navbar navbar-expand-md navbar-light">

          {/* Brand */}
          <div className="navbar-header pointer text-center">
            <Link className="navbar-brand" href="/institucional">
              <img
                src="/img/trib-cuentas-escudo.png"
                alt="Tribunal de Cuentas de Río Negro"
                width="30"
                height="30"
              />
              <span className="d-none d-xl-inline ml-2">
                <strong>INTRANET</strong>
              </span>
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
                                    background: isFirst ? firstBg : isLastItem && !isFirst ? "#f5f7ff" : "transparent",
                                  }}>
                                    <i className="pi pi-clock" style={{ fontSize: "0.75rem", opacity: 0.6 }} />
                                    {f}
                                    {isFirst && hourInDiffMins > 0 && (
                                      <span style={{ marginLeft: "auto", fontSize: "0.68rem", background: isLate ? "#ffe5e5" : "#e5ffe9", color: firstColor, borderRadius: "20px", padding: "1px 6px", fontWeight: 700 }}>
                                        {diffLabel}
                                      </span>
                                    )}
                                    {!isFirst && isLastItem && (
                                      <span style={{ marginLeft: "auto", fontSize: "0.68rem", background: "#eef1ff", color: "#4a6cf7", borderRadius: "20px", padding: "1px 6px" }}>última</span>
                                    )}
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
                          <div className="navbar-user-dropdown-avatar">
                            {userData.avatar ? (
                              <img src={`${API_URL}${userData.avatar}`} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                            ) : (
                              <span>{userInitials}</span>
                            )}
                          </div>
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
                          data-toggle="modal"
                          data-target="#modal-sesion"
                          onClick={() => setShowUserMenu(false)}
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
    </>
  );
}
