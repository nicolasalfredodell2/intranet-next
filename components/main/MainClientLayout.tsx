"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "./Navbar";
import NavbarLateral from "./NavbarLateral";

export default function MainClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // Añade tooltips a los links del sidebar (espeja el comportamiento de Angular)
    const timeout = setTimeout(() => {
      document.querySelectorAll<HTMLAnchorElement>("#sidebarnav a").forEach((link) => {
        const label = (link.textContent || "").replace(/\s+/g, " ").trim();
        if (label) link.setAttribute("title", label);
      });
    }, 1000);
    return () => clearTimeout(timeout);
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

      {/* Modal de cierre de sesión — referenciado con data-target="#modal-sesion" en toda la app */}
      <div className="modal fade" id="modal-sesion" tabIndex={-1} role="dialog" aria-labelledby="modal-sesion-label">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="modal-sesion-label">¿Estás seguro que deseas cerrar sesión?</h5>
              <button type="button" className="close" data-dismiss="modal" aria-label="Cerrar">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-danger" data-dismiss="modal" onClick={logout}>
                Cerrar sesión
              </button>
              <button type="button" className="btn btn-secondary" data-dismiss="modal">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
