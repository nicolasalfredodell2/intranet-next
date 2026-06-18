"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Dialog } from "primereact/dialog";
import { ProgressBar } from "primereact/progressbar";
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
                    className={`btn m-1 p-1 rounded-circle ${canActionRemote ? "btn-primary" : "btn-muted"}`}
                    disabled={!canActionRemote}
                  >
                    <i className="mdi mdi-fingerprint" style={{ fontSize: "1.5rem" }} />
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
                  <i className="mdi mdi-logout" style={{ fontSize: "1.5rem" }} />
                  <br />
                  <p style={{ fontSize: "0.55rem" }}>CERRAR SESIÓN</p>
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </header>

      <Dialog
        header="¿Fichar remoto?"
        visible={showRemoteModal}
        style={{ width: "50vw" }}
        baseZIndex={10000}
        modal
        onHide={() => setShowRemoteModal(false)}
      >
        {isLoadingRemote ? (
          <div className="animated fadeIn">
            <ProgressBar style={{ height: "4px" }} mode="indeterminate" />
          </div>
        ) : (
          <div className="animated fadeIn d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-info py-2" onClick={handleConnectRemote}>
              Si
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setShowRemoteModal(false)}
            >
              Volver
            </button>
          </div>
        )}
      </Dialog>
    </>
  );
}
