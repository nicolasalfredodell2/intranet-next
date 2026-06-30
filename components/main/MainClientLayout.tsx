"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "./Navbar";
import NavbarLateral from "./NavbarLateral";

export default function MainClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      document.querySelectorAll<HTMLAnchorElement>("#sidebarnav a").forEach((link) => {
        const label = (link.textContent || "").replace(/\s+/g, " ").trim();
        if (label) link.setAttribute("title", label);
      });
    }, 1000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const handler = () => setShowLogoutModal(true);
    window.addEventListener("open-logout", handler);
    return () => window.removeEventListener("open-logout", handler);
  }, []);

  function logout() {
    const keys = ["token", "token-workflow", "redirect", "redirect-question", "roles", "user"];
    keys.forEach((k) => {
      sessionStorage.removeItem(k);
      localStorage.removeItem(k);
    });
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";
    router.push("/auth/login");
  }

  return (
    <div className="fadeIn animated">
      <Navbar />
      <NavbarLateral />

      <div className="page-wrapper">
        <div className="container-fluid">{children}</div>
      </div>

      {showLogoutModal && (
        <div
          className="main-remote-overlay animated fadeIn"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="main-remote-dialog animated fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center pt-3 pb-2">
              <div className="mb-3">
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #fff1f1, #ffdde0)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                  <i className="pi pi-power-off" style={{ fontSize: "1.8rem", color: "#dc3545" }} />
                </div>
              </div>
              <h5 className="font-weight-bold text-dark mb-1">Cerrar sesión</h5>
              <p className="text-muted mb-0" style={{ fontSize: "0.88rem", lineHeight: 1.5 }}>
                ¿Estás seguro que deseas cerrar tu sesión actual?
              </p>
            </div>

            <div className="d-flex mt-4" style={{ gap: "10px" }}>
              <button
                className="btn btn-danger w-100 d-flex align-items-center justify-content-center"
                style={{ borderRadius: "10px", fontWeight: 600, gap: "6px" }}
                onClick={logout}
              >
                <i className="pi pi-power-off" style={{ fontSize: "0.85rem" }} />
                Cerrar sesión
              </button>
              <button
                className="btn btn-light text-muted w-100"
                style={{ borderRadius: "10px", fontWeight: 500 }}
                onClick={() => setShowLogoutModal(false)}
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
