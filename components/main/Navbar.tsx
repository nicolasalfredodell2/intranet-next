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

export default function Navbar() {
  const toast = useRef<Toast>(null);
  const [canRemoteAccess, setCanRemoteAccess] = useState(false);
  const [canActionRemote, setCanActionRemote] = useState(true);
  const [showRemoteModal, setShowRemoteModal] = useState(false);
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);

  useEffect(() => {
    verifyTokenPermissions();
    getDataUser().catch(() => {});
  }, []);

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
      setIsLoadingRemote(false);
      setShowRemoteModal(false);
      toast.current?.show({
        severity: "success",
        summary: "Fichada remota registrada con éxito",
        life: 3500,
      });
      setTimeout(() => setCanActionRemote(true), 15000);
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

  return (
    <>
      <Toast ref={toast} position="bottom-center" />

      <header className="topbar fadeIn">
        <nav className="navbar top-navbar navbar-expand-md navbar-light">
          <div className="navbar-header pointer text-center">
            <Link className="navbar-brand" href="/institucional">
              <img
                src="/img/trib-cuentas-escudo.png"
                alt="homepage"
                width="30"
                height="30"
              />
              <span className="d-none d-xl-inline ml-2">
                <strong>INTRANET</strong>
              </span>
            </Link>
          </div>

          <div className="navbar-collapse">
            <ul className="navbar-nav mr-auto">
              <li className="nav-item d-md-none d-flex align-items-center">
                <button
                  type="button"
                  className="mobile-menu-btn"
                  onClick={toggleMobileSidebar}
                  aria-label="Abrir menu de navegacion"
                >
                  <i className="mdi mdi-menu" />
                </button>
              </li>
            </ul>

            <ul className="navbar-nav my-lg-0">
              {canRemoteAccess && (
                <li className="m-3 nav-item">
                  <button
                    onClick={() => setShowRemoteModal(true)}
                    className={`btn-remote-circle ${canActionRemote ? "btn-remote-active" : "btn-remote-disabled"}`}
                    disabled={!canActionRemote}
                  >
                    <i className="mdi mdi-fingerprint" style={{ fontSize: "1.9rem" }} />
                  </button>
                </li>
              )}

              <li className="pt-3 nav-item text-center">
                <a
                  href="#"
                  className="text-danger"
                  data-toggle="modal"
                  data-target="#modal-sesion"
                >
                  <i className="mdi mdi-logout" style={{ fontSize: "1.9rem" }} />
                  <br />
                  <p style={{ fontSize: "0.55rem" }}>CERRAR SESIÓN</p>
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </header>

      {showRemoteModal && (
        <div className="main-remote-overlay" onClick={() => !isLoadingRemote && setShowRemoteModal(false)}>
          <div className="main-remote-dialog animated fadeIn" onClick={(e) => e.stopPropagation()}>
            <div className="text-center pt-3 pb-2">
              <div className="mb-3">
                <i className="fa-solid fa-laptop-house text-primary" style={{ fontSize: "3rem", opacity: 0.8 }} />
              </div>
              <h5 className="font-weight-bold text-dark mb-2">¿Registrar fichada remota?</h5>
              <p className="text-muted mb-0" style={{ fontSize: "0.95rem" }}>
                Estás a punto de registrar tu horario desde una ubicación remota.
              </p>
            </div>

            {isLoadingRemote && (
              <div className="text-center my-3 animated fadeIn">
                <i className="pi pi-spin pi-spinner mr-2" />
                <small className="text-muted font-weight-bold">Procesando conexión...</small>
              </div>
            )}

            {!isLoadingRemote && (
              <div className="d-flex justify-content-between w-100 mt-3 animated fadeIn">
                <button className="btn btn-light text-muted w-100 mr-2" style={{ borderRadius: "8px" }} onClick={() => setShowRemoteModal(false)}>
                  Cancelar
                </button>
                <button className="btn btn-primary shadow-sm w-100 ml-2" style={{ borderRadius: "8px" }} onClick={handleConnectRemote}>
                  <i className="fa-solid fa-check mr-1" /> Confirmar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
