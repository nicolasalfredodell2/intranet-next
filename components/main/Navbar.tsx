"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Toast } from "primereact/toast";
import { getDataUser } from "@/lib/services/perfil.service";
import { connectRemote } from "@/lib/services/remote.service";

function decodeJWT(token: string): any {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

const STORAGE_KEYS = ["token", "token-workflow", "redirect", "redirect-question", "roles", "user"];
const REMOTE_COOLDOWN_S = 15;

export default function Navbar() {
  const toast = useRef<Toast>(null);
  const [canRemoteAccess, setCanRemoteAccess] = useState(false);
  const [canActionRemote, setCanActionRemote] = useState(true);
  const [showRemoteModal, setShowRemoteModal] = useState(false);
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [userData, setUserData] = useState<{ first_name?: string; last_name?: string } | null>(null);

  useEffect(() => {
    verifyTokenPermissions();
    getDataUser()
      .then((data) => setUserData(data))
      .catch(() => {});
  }, []);

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

  const userName = userData?.first_name
    ? `${userData.first_name}${userData.last_name ? " " + userData.last_name.split(" ")[0] : ""}`
    : null;

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

              {/* Divider */}
              <li className="nav-item mx-2 d-none d-md-flex align-items-center">
                <div style={{ width: 1, height: 26, background: "#e0e0e0" }} />
              </li>

              {/* User identity + logout */}
              <li className="nav-item d-flex align-items-center pr-2" style={{ gap: "10px" }}>
                {/* User initials pill */}
                {userInitials && (
                  <Link href="/perfil" className="navbar-user-pill" title={userName ?? "Ver perfil"}>
                    <div className="navbar-user-avatar">
                      {userInitials}
                    </div>
                    {userName && (
                      <span className="navbar-user-name d-none d-lg-inline">{userName}</span>
                    )}
                  </Link>
                )}

                {/* Logout */}
                <button
                  type="button"
                  className="navbar-logout-btn"
                  data-toggle="modal"
                  data-target="#modal-sesion"
                  title="Cerrar sesión"
                >
                  <i className="mdi mdi-logout" style={{ fontSize: "1.35rem" }} />
                  <span className="navbar-logout-label">Salir</span>
                </button>
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
                Estás a punto de registrar tu asistencia desde una ubicación remota.
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
                  className="btn btn-light text-muted w-100"
                  style={{ borderRadius: "10px", fontWeight: 500 }}
                  onClick={() => setShowRemoteModal(false)}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                  style={{ borderRadius: "10px", fontWeight: 600, gap: "6px" }}
                  onClick={handleConnectRemote}
                >
                  <i className="pi pi-check" style={{ fontSize: "0.85rem" }} />
                  Confirmar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
