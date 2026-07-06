"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { loadFiles, loadFilePDF } from "@/lib/services/files.service";

function SkeletonCard() {
  return (
    <div className="card profile-card mb-3">
      <div className="d-flex align-items-center px-3 py-3" style={{ gap: "12px" }}>
        <div style={{ width: 38, height: 38, borderRadius: "11px", background: "linear-gradient(90deg, #e8ecf0 25%, #f1f5f9 50%, #e8ecf0 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.4s infinite", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="profile-skeleton-label" style={{ width: "42%", marginBottom: 7 }} />
          <div className="profile-skeleton-label" style={{ width: "26%" }} />
        </div>
      </div>
    </div>
  );
}

export default function FilesPage() {
  const toast = useRef<Toast>(null);
  const [fileData, setFileData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [openCategories, setOpenCategories] = useState<Record<number, boolean>>({});
  const [openSubcategories, setOpenSubcategories] = useState<Record<number, boolean>>({});
  const [loadingPdf, setLoadingPdf] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await loadFiles();
      setFileData(data);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudo cargar los archivos", detail: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenPdf(path: string) {
    if (loadingPdf) return;
    setLoadingPdf(path);
    try {
      const buffer = await loadFilePDF(path);
      const blob = new Blob([buffer], { type: "application/pdf" });
      window.open(URL.createObjectURL(blob));
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo abrir el archivo PDF" });
    } finally {
      setLoadingPdf(null);
    }
  }

  function toggleCategory(id: number) {
    setOpenCategories((p) => ({ ...p, [id]: !p[id] }));
  }

  function toggleSubcategory(id: number) {
    setOpenSubcategories((p) => ({ ...p, [id]: !p[id] }));
  }

  const categories: any[] = fileData?.categories ?? fileData?.data ?? [];

  function matchesSearch(file: any) {
    if (!search) return true;
    return (file.name ?? file.title ?? "").toLowerCase().includes(search.toLowerCase());
  }

  function categoryHasResults(cat: any) {
    if (!search) return true;
    return cat.subcategories?.some((sub: any) => sub.files?.some(matchesSearch)) ?? false;
  }

  const visibleCategories = categories.filter(categoryHasResults);

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />

      <div className="fadeIn animated">

        {/* Search */}
        <div className="bosses-search-wrap mb-3" style={{ maxWidth: 420 }}>
          <i className="pi pi-search bosses-search-icon" />
          <input
            className="profile-input"
            style={{ paddingLeft: "36px", paddingRight: search ? "40px" : "13px" }}
            placeholder="Buscar archivo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />
          {search && (
            <button type="button" className="bosses-search-clear" onClick={() => setSearch("")}>
              <i className="pi pi-times" style={{ fontSize: "0.72rem" }} />
            </button>
          )}
        </div>

        {/* Loading skeleton */}
        {loading && [1, 2, 3].map((i) => <SkeletonCard key={i} />)}

        {/* Category cards */}
        {!loading && visibleCategories.map((cat: any) => {
          const isOpen = openCategories[cat.id];
          return (
            <div key={cat.id} className="card profile-card mb-3 fadeIn animated">

              {/* Header */}
              <div
                className="d-flex align-items-center px-3 pt-3 pb-2"
                style={{ gap: "12px", cursor: "pointer", userSelect: "none" }}
                onClick={() => toggleCategory(cat.id)}
              >
                <div style={{ width: 38, height: 38, borderRadius: "11px", background: isOpen ? "rgba(74,108,247,0.12)" : "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s" }}>
                  <i className={`pi ${isOpen ? "pi-folder-open" : "pi-folder"}`} style={{ color: isOpen ? "#4a6cf7" : "#94a3b8", fontSize: "1rem", transition: "color 0.2s" }} />
                </div>
                <div className="flex-grow-1">
                  <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>{cat.name}</h5>
                  <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                    {cat.subcategories?.length ?? 0} subcategoría{cat.subcategories?.length !== 1 ? "s" : ""}
                  </small>
                </div>
                <i
                  className={`pi ${isOpen ? "pi-chevron-up" : "pi-chevron-down"}`}
                  style={{ color: "#94a3b8", fontSize: "0.8rem", flexShrink: 0 }}
                />
              </div>

              <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />

              {isOpen && (
                <div className="card-body fadeIn animated" style={{ padding: "12px 16px 16px" }}>
                  {(cat.subcategories ?? []).length === 0 && (
                    <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0 }}>No hay subcategorías.</p>
                  )}

                  {(cat.subcategories ?? []).map((sub: any) => {
                    const visibleFiles = (sub.files ?? []).filter(matchesSearch);
                    if (search && visibleFiles.length === 0) return null;
                    const isSubOpen = openSubcategories[sub.id];
                    return (
                      <div
                        key={sub.id}
                        className="mb-2 fadeIn animated"
                        style={{ borderRadius: "10px", overflow: "hidden", border: "1.5px solid rgba(0,0,0,0.05)" }}
                      >
                        {/* Subcategory row */}
                        <div
                          className="d-flex align-items-center"
                          style={{ padding: "10px 14px", background: isSubOpen ? "rgba(74,108,247,0.04)" : "#f8fafc", cursor: "pointer", gap: "10px", userSelect: "none" }}
                          onClick={() => toggleSubcategory(sub.id)}
                        >
                          <i
                            className={`pi ${isSubOpen ? "pi-folder-open" : "pi-folder"}`}
                            style={{ color: isSubOpen ? "#4a6cf7" : "#64748b", fontSize: "0.9rem", flexShrink: 0, transition: "color 0.2s" }}
                          />
                          <span style={{ flex: 1, fontSize: "0.88rem", fontWeight: isSubOpen ? 600 : 500, color: isSubOpen ? "#1e293b" : "#374151" }}>
                            {sub.name}
                          </span>
                          <span style={{ fontSize: "0.7rem", background: isSubOpen ? "rgba(74,108,247,0.12)" : "#e2e8f0", color: isSubOpen ? "#4a6cf7" : "#64748b", borderRadius: "20px", padding: "1px 8px", fontWeight: 600, transition: "background 0.2s, color 0.2s" }}>
                            {visibleFiles.length}
                          </span>
                          <i
                            className={`pi ${isSubOpen ? "pi-chevron-up" : "pi-chevron-down"}`}
                            style={{ color: "#94a3b8", fontSize: "0.75rem", flexShrink: 0 }}
                          />
                        </div>

                        {/* Files list */}
                        {isSubOpen && (
                          <div className="fadeIn animated" style={{ background: "#fff", padding: "4px 14px 8px" }}>
                            {visibleFiles.length === 0 && (
                              <p style={{ color: "#94a3b8", fontSize: "0.82rem", margin: "8px 0 4px" }}>No hay archivos en esta subcategoría.</p>
                            )}
                            {visibleFiles.map((file: any) => {
                              const filePath = file.path ?? file.path_url;
                              const isLoadingThis = loadingPdf === filePath;
                              return (
                                <div
                                  key={file.id ?? filePath}
                                  className="d-flex align-items-center fadeIn animated"
                                  style={{ padding: "7px 0", borderBottom: "1px solid rgba(0,0,0,0.04)", gap: "10px" }}
                                >
                                  <i className="mdi mdi-file-pdf-box" style={{ color: "#dc3545", fontSize: "1.15rem", flexShrink: 0 }} />
                                  <span style={{ flex: 1, fontSize: "0.84rem", color: "#374151", lineHeight: 1.3 }}>
                                    {file.name ?? file.title}
                                  </span>
                                  <button
                                    type="button"
                                    disabled={!!loadingPdf}
                                    onClick={() => handleOpenPdf(filePath)}
                                    style={{ background: "none", border: "none", padding: "4px 8px", cursor: loadingPdf ? "not-allowed" : "pointer", borderRadius: "6px", display: "flex", alignItems: "center", gap: "4px", color: isLoadingThis ? "#94a3b8" : "#4a6cf7", fontSize: "0.78rem", fontWeight: 600, flexShrink: 0 }}
                                    title="Ver PDF"
                                  >
                                    <i className={isLoadingThis ? "pi pi-spin pi-spinner" : "pi pi-eye"} style={{ fontSize: "0.85rem" }} />
                                    {isLoadingThis ? "Abriendo…" : "Ver"}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Empty state */}
        {!loading && visibleCategories.length === 0 && (
          <div className="card profile-card fadeIn animated">
            <div className="text-center py-5">
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <i className="pi pi-inbox" style={{ fontSize: "1.5rem", color: "#94a3b8" }} />
              </div>
              <p className="font-weight-bold mb-1" style={{ fontSize: "0.95rem", color: "#1e293b" }}>
                {search ? "Sin resultados" : "No hay archivos disponibles"}
              </p>
              <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0 }}>
                {search ? `No se encontraron archivos con "${search}".` : "No tenés archivos digitales asignados."}
              </p>
            </div>
          </div>
        )}

      </div>
    </>
  );
}