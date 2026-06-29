"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function getRolesFromStorage(): { isAdminInformatic: boolean; isAdminRRHH: boolean } {
  if (typeof window === "undefined") return { isAdminInformatic: false, isAdminRRHH: false };
  try {
    const raw = sessionStorage.getItem("roles") || localStorage.getItem("roles");
    if (!raw) return { isAdminInformatic: false, isAdminRRHH: false };
    const allRoles = JSON.parse(raw);
    const roles: string[] = allRoles?.frontend_workflow?.roles ?? [];
    return {
      isAdminInformatic: roles.includes("manager_informatica"),
      isAdminRRHH: roles.includes("manager_rrhh"),
    };
  } catch {
    return { isAdminInformatic: false, isAdminRRHH: false };
  }
}

export default function NavbarLateral() {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAdminInformatic, setIsAdminInformatic] = useState(false);
  const [isAdminRRHH, setIsAdminRRHH] = useState(false);

  useEffect(() => {
    const { isAdminInformatic, isAdminRRHH } = getRolesFromStorage();
    setIsAdminInformatic(isAdminInformatic);
    setIsAdminRRHH(isAdminRRHH);
    setIsSidebarCollapsed(document.body.classList.contains("mini-sidebar"));
  }, []);

  const isAdmin = isAdminInformatic || isAdminRRHH;

  function active(href: string) {
    return pathname === href || pathname.startsWith(href + "/") ? "active" : "";
  }

  function onNavClick() {
    if (window.innerWidth < 1169) {
      document.body.classList.add("mini-sidebar");
      document.body.classList.remove("show-sidebar");
      setIsSidebarCollapsed(true);
    }
  }

  function toggleSidebar() {
    const body = document.body;
    if (body.classList.contains("mini-sidebar")) {
      body.classList.remove("mini-sidebar", "show-sidebar");
      setIsSidebarCollapsed(false);
    } else {
      body.classList.add("mini-sidebar");
      setIsSidebarCollapsed(true);
    }
  }

  function handleGroupMenuClick(e: React.MouseEvent) {
    e.preventDefault();
    if (!isSidebarCollapsed) return;
    document.body.classList.remove("mini-sidebar", "show-sidebar");
    setIsSidebarCollapsed(false);
  }

  return (
    <>
      <aside className="left-sidebar">
        <div className="scroll-sidebar">
          <nav className="sidebar-nav">
            <ul id="sidebarnav">

              {/* Perfil */}
              <li>
                <Link href="/main/profile" className={active("/main/profile")} onClick={onNavClick}>
                  <i className="pi pi-user" />
                  <span className="hide-menu">Perfil</span>
                </Link>
              </li>

              <li>
                <Link href="/main/absence-notices" className={active("/main/absence-notices")} onClick={onNavClick}>
                  <i className="pi pi-bell" />
                  <span className="hide-menu">Avisos</span>
                </Link>
              </li>
              <li>
                <Link href="/main/income" className={active("/main/income")} onClick={onNavClick}>
                  <i className="pi pi-history" />
                  <span className="hide-menu">Fichadas Diarias</span>
                </Link>
              </li>
              <li>
                <Link href="/main/files" className={active("/main/files")} onClick={onNavClick}>
                  <i className="pi pi-id-card" />
                  <span className="hide-menu">Legajo</span>
                </Link>
              </li>
              <li>
                <Link href="/main/license" className={active("/main/license")} onClick={onNavClick}>
                  <i className="pi pi-calendar-minus" />
                  <span className="hide-menu">Licencias</span>
                </Link>
              </li>
              <li>
                <Link href="/main/receipts" className={active("/main/receipts")} onClick={onNavClick}>
                  <i className="pi pi-wallet" />
                  <span className="hide-menu">Recibos</span>
                </Link>
              </li>
              <li>
                <Link href="/main/exits" className={active("/main/exits")} onClick={onNavClick}>
                  <i className="pi pi-sign-out" />
                  <span className="hide-menu">Salidas</span>
                </Link>
              </li>

              {/* Administración */}
              {isAdmin && (
                <>
                  <li className="nav-devider" />
                  <li className="nav-small-cap nav-small-cap-admin">Administración</li>

                  {isAdminInformatic && (
                    <li className="fadeIn animated admin-item">
                      <Link href="/main/areas" className={active("/main/areas")} onClick={onNavClick}>
                        <i className="pi pi-building" />
                        <span className="hide-menu">Areas</span>
                      </Link>
                    </li>
                  )}

                  <li className="admin-item">
                    <Link href="/main/absence-notices-admin" className={active("/main/absence-notices-admin")} onClick={onNavClick}>
                      <i className="pi pi-bell" />
                      <span className="hide-menu">Avisos</span>
                    </Link>
                  </li>

                  {isAdminInformatic && (
                    <>
                      <li className="fadeIn animated admin-item">
                        <Link href="/main/banners" className={active("/main/banners")} onClick={onNavClick}>
                          <i className="pi pi-images" />
                          <span className="hide-menu">Baners</span>
                        </Link>
                      </li>

                      <li className="fadeIn animated admin-item">
                        <Link href="/main/whiten-key" className={active("/main/whiten-key")} onClick={onNavClick}>
                          <i className="pi pi-key" />
                          <span className="hide-menu">Blanqueo de clave</span>
                        </Link>
                      </li>

                      <li className="fadeIn animated admin-item">
                        <a className="has-arrow waves-effect waves-dark" href="#" onClick={handleGroupMenuClick}>
                          <i className="pi pi-calendar" />
                          <span className="hide-menu">Calendario</span>
                        </a>
                        <ul aria-expanded="false" className="collapse">
                          <li>
                            <Link className="nav-toggler" href="/main/calendar" onClick={onNavClick}>
                              Calendario
                            </Link>
                          </li>
                          <li>
                            <Link className="nav-toggler" href="/main/calendar-category" onClick={onNavClick}>
                              Categorias
                            </Link>
                          </li>
                        </ul>
                      </li>
                    </>
                  )}

                  <li className="fadeIn animated admin-item">
                    <Link href="/main/recorded" className={active("/main/recorded")} onClick={onNavClick}>
                      <i className="pi pi-clock" />
                      <span className="hide-menu">Editar fichadas</span>
                    </Link>
                  </li>

                  {isAdminInformatic && (
                    <li className="fadeIn animated admin-item">
                      <Link href="/main/survey" className={active("/main/survey")} onClick={onNavClick}>
                        <i className="pi pi-comments" />
                        <span className="hide-menu">Encuestas</span>
                      </Link>
                    </li>
                  )}

                  <li className="fadeIn animated admin-item">
                    <a className="has-arrow waves-effect waves-dark" href="#" onClick={handleGroupMenuClick}>
                      <i className="pi pi-chart-bar" />
                      <span className="hide-menu">Informes</span>
                    </a>
                    <ul aria-expanded="false" className="collapse">
                      <li><Link className="nav-toggler" href="/main/informs/compensations" onClick={onNavClick}>Compensaciones</Link></li>
                      <li><Link className="nav-toggler" href="/main/informs/expenses-income-surplus" onClick={onNavClick}>Llegadas tardes</Link></li>
                      <li><Link className="nav-toggler" href="/main/informs/exit-orders" onClick={onNavClick}>Órdenes de salidas</Link></li>
                      <li><Link className="nav-toggler" href="/main/informs/horas-extras" onClick={onNavClick}>Horas extras</Link></li>
                      <li><Link className="nav-toggler" href="/main/informs/overtimes" onClick={onNavClick}>Overtimes</Link></li>
                      <li><Link className="nav-toggler" href="/main/informs/daily-part" onClick={onNavClick}>Parte diario</Link></li>
                    </ul>
                  </li>

                  <li className="fadeIn animated admin-item">
                    <a className="has-arrow waves-effect waves-dark" href="#" onClick={handleGroupMenuClick}>
                      <i className="pi pi-folder" />
                      <span className="hide-menu">Legajo</span>
                    </a>
                    <ul aria-expanded="false" className="collapse">
                      <li><Link className="nav-toggler" href="/main/files-admin-items" onClick={onNavClick}>Categorías y subcategorias</Link></li>
                      <li><Link className="nav-toggler" href="/main/files-admin-upload" onClick={onNavClick}>Archivos</Link></li>
                    </ul>
                  </li>

                  {isAdminInformatic && (
                    <>
                      <li className="fadeIn animated admin-item">
                        <a className="has-arrow waves-effect waves-dark" href="#" onClick={handleGroupMenuClick}>
                          <i className="pi pi-file-edit" />
                          <span className="hide-menu">Notas</span>
                        </a>
                        <ul aria-expanded="false" className="collapse">
                          <li><Link className="nav-toggler" href="/main/notes-config" onClick={onNavClick}>Configuración de notas</Link></li>
                          <li><Link className="nav-toggler" href="/main/notes-list" onClick={onNavClick}>Lista notas</Link></li>
                          <li><Link className="nav-toggler" href="/main/notes" onClick={onNavClick}>Subir nota</Link></li>
                        </ul>
                      </li>

                      <li className="fadeIn animated admin-item">
                        <Link href="/main/shorts" className={active("/main/shorts")} onClick={onNavClick}>
                          <i className="pi pi-video" />
                          <span className="hide-menu">Shorts</span>
                        </Link>
                      </li>

                      <li className="fadeIn animated admin-item">
                        <Link href="/main/tickets" className={active("/main/tickets")} onClick={onNavClick}>
                          <i className="pi pi-ticket" />
                          <span className="hide-menu">Tickets</span>
                        </Link>
                      </li>
                    </>
                  )}
                </>
              )}

              {/* Cerrar sesión — al fondo (UX estándar) */}
              <li className="nav-devider" />
              <li className="sidebar-logout-item">
                <a
                  href="#"
                  data-toggle="modal"
                  data-target="#modal-sesion"
                  onClick={onNavClick}
                >
                  <i className="pi pi-power-off" />
                  <span className="hide-menu">Cerrar sesión</span>
                </a>
              </li>

            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
}
