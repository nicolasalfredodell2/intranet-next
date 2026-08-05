"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { Sidebar } from "primereact/sidebar";
import { Dropdown } from "primereact/dropdown";
import { Tooltip } from "primereact/tooltip";
import { loadFiles, loadFilePDF } from "@/lib/services/files.service";

interface Filters {
  categoria: string;
  subcategoria: string;
}

const MIME_MAP: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  gif: "image/gif",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  odt: "application/vnd.oasis.opendocument.text",
};

const FILE_ICON_MAP: Record<string, { icon: string; color: string }> = {
  pdf: { icon: "mdi-file-pdf-box", color: "#dc3545" },
  png: { icon: "mdi-file-png-box", color: "#8b5cf6" },
  jpg: { icon: "mdi-file-jpg-box", color: "#8b5cf6" },
  jpeg: { icon: "mdi-file-jpg-box", color: "#8b5cf6" },
  gif: { icon: "mdi-file-gif-box", color: "#8b5cf6" },
  xlsx: { icon: "mdi-file-excel-box", color: "#22c55e" },
  xls: { icon: "mdi-file-excel-box", color: "#22c55e" },
  doc: { icon: "mdi-file-word-box", color: "#2563eb" },
  docx: { icon: "mdi-file-word-box", color: "#2563eb" },
  odt: { icon: "mdi-file-word-box", color: "#2563eb" },
};

function getFileIcon(name: string): { icon: string; color: string } {
  const ext = (name ?? "").split(".").pop()?.toLowerCase() ?? "";
  return FILE_ICON_MAP[ext] ?? { icon: "mdi-file-outline", color: "#94a3b8" };
}

function SkeletonRows() {
  return (
    <div style={{ padding: "4px 0 8px" }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={{ height: 48, borderRadius: 10, marginBottom: 10, background: "linear-gradient(90deg, #e8ecf0 25%, #f1f5f9 50%, #e8ecf0 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.4s infinite" }} />
      ))}
    </div>
  );
}

export default function FilesPage() {
  const toast = useRef<Toast>(null);
  const [fileData, setFileData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [openSubcategories, setOpenSubcategories] = useState<Record<string, boolean>>({});
  const [loadingFile, setLoadingFile] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{ url: string; type: "image" | "pdf"; name: string } | null>(null);
  const [filters, setFilters] = useState<Filters>({ categoria: "", subcategoria: "" });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const raw = await loadFiles();
      const arr = Array.isArray(raw) ? raw : (raw.data ?? []);
      const tempItems: any[] = [];
      arr.forEach((item: any) => {
        const subitem = item.sub_item;
        if (!subitem) return;
        subitem.files = (subitem.data ?? []).reverse();
        delete subitem.data;
        const existing = tempItems.find((t: any) => t.name === item.name);
        if (existing) { existing.subcategories.push(subitem); }
        else { tempItems.push({ ...item, subcategories: [subitem] }); }
      });
      setFileData(tempItems);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudo cargar los archivos", detail: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleViewFile(file: any) {
    if (loadingFile) return;
    const filePath = file.path ?? file.path_url;
    setLoadingFile(file.id ?? filePath);
    const ext = (filePath ?? "").split(".").pop()?.toLowerCase() ?? "pdf";
    const name = file.name ?? file.title ?? "archivo";
    try {
      const buffer = await loadFilePDF(filePath);
      const mime = MIME_MAP[ext] ?? "application/octet-stream";
      const blob = new Blob([buffer], { type: mime });
      const url = URL.createObjectURL(blob);
      if (ext === "odt") {
        const link = document.createElement("a");
        link.href = url;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (ext === "pdf") {
        setPreviewFile({ url, type: "pdf", name });
      } else if (["png", "jpg", "jpeg", "gif"].includes(ext)) {
        setPreviewFile({ url, type: "image", name });
      } else {
        window.open(url);
      }
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo abrir el archivo" });
    } finally {
      setLoadingFile(null);
    }
  }

  function closePreview() {
    if (previewFile) URL.revokeObjectURL(previewFile.url);
    setPreviewFile(null);
  }

  function toggleCategory(key: string) {
    setOpenCategories((p) => ({ ...p, [key]: !p[key] }));
  }

  function toggleSubcategory(key: string) {
    setOpenSubcategories((p) => ({ ...p, [key]: !p[key] }));
  }

  const categories: any[] = fileData ?? [];

  const previewNameParts = previewFile?.name.split(".") ?? [];
  const previewExt = previewNameParts.length > 1 ? previewNameParts.pop() : null;
  const previewNameNoExt = previewNameParts.join(".");

  const previewSidebarHeader = (
    <div className="d-flex align-items-center" style={{ gap: "8px", minWidth: 0 }}>
      <span style={{ fontWeight: 700, fontSize: "0.93rem", color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{previewNameNoExt}</span>
      {previewExt && (
        <span style={{ background: "#eff6ff", color: "#3b82f6", borderRadius: "20px", padding: "2px 10px", fontSize: "0.72rem", fontWeight: 700, flexShrink: 0 }}>
          {previewExt.toUpperCase()}
        </span>
      )}
    </div>
  );

  const hasFilters = Object.values(filters).some(Boolean);

  function categoryMatches(cat: any) {
    return (
      (!filters.categoria || cat.name === filters.categoria) &&
      (!filters.subcategoria || cat.subcategories?.some((sub: any) => sub.name === filters.subcategoria))
    );
  }

  function visibleSubcategories(cat: any) {
    return (cat.subcategories ?? []).filter((sub: any) => !filters.subcategoria || sub.name === filters.subcategoria);
  }

  const visibleCategories = categories.filter(categoryMatches);

  const categoriaOptions = [...new Set(categories.map((c) => c.name).filter(Boolean))].sort() as string[];
  const subcategoriaOptions = [
    ...new Set(categories.flatMap((c) => (c.subcategories ?? []).map((s: any) => s.name)).filter(Boolean)),
  ].sort() as string[];

  const filterFields: { field: keyof Filters; placeholder: string; icon: string; options: string[] }[] = [
    { field: "categoria", placeholder: "Categoría", icon: "pi-folder", options: categoriaOptions },
    { field: "subcategoria", placeholder: "Subcategoría", icon: "pi-folder-open", options: subcategoriaOptions },
  ];

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />
      <Tooltip target=".files-view-btn" content="Ver archivo" position="left" />

      <div className="animated fadeIn">

        {/* Main card */}
        <div className="card profile-card license-main-card">

          {/* Header */}
          <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "rgba(74,108,247,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-folder" style={{ color: "#4a6cf7", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Archivos</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Archivos digitales de tu legajo</small>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={load}
              className="btn btn-light d-flex align-items-center"
              style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.82rem", padding: "5px 14px", color: "#64748b" }}
            >
              <i className={loading ? "pi pi-spin pi-spinner" : "pi pi-refresh"} style={{ fontSize: "0.78rem" }} />
              Recargar
            </button>
          </div>
          <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />

          <div className="card-body">
            {loading ? (
              <SkeletonRows />
            ) : (
              <div className="animated fadeIn">

                {/* Filter bar */}
                <div className="license-filter-bar">
                  <div className="license-filter-bar-inputs">
                    {filterFields.map(({ field, placeholder, icon, options }) => (
                      <div key={field} className={`license-filter-input-wrap${filters[field] ? " license-filter-input-wrap--active" : ""}`}>
                        <i className={`pi ${icon} license-filter-icon`} />
                        <Dropdown
                          value={filters[field] || null}
                          options={options}
                          onChange={(e) => setFilters((p) => ({ ...p, [field]: e.value ?? "" }))}
                          placeholder={placeholder}
                          className="license-filter-dropdown"
                          panelClassName="license-filter-dropdown-panel"
                          showClear={!!filters[field]}
                          emptyMessage="Sin opciones"
                        />
                      </div>
                    ))}
                  </div>
                  {hasFilters && (
                    <button
                      type="button"
                      className="license-filter-clear"
                      onClick={() => setFilters({ categoria: "", subcategoria: "" })}
                    >
                      <i className="pi pi-times" /> Limpiar
                    </button>
                  )}
                </div>

                {/* Category sections */}
                {visibleCategories.map((cat: any) => {
                  const catKey = String(cat.name ?? cat.id);
                  const isOpen = openCategories[catKey];
                  return (
                    <div
                      key={cat.id ?? catKey}
                      className="mb-2 fadeIn animated"
                      style={{ borderRadius: "12px", overflow: "hidden", border: "1.5px solid rgba(0,0,0,0.05)" }}
                    >
                      {/* Header */}
                      <div
                        className="d-flex align-items-center"
                        style={{ padding: "10px 14px", gap: "12px", cursor: "pointer", userSelect: "none", background: isOpen ? "rgba(74,108,247,0.04)" : "#f8fafc" }}
                        onClick={() => toggleCategory(catKey)}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: "9px", background: isOpen ? "rgba(74,108,247,0.12)" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s" }}>
                          <i className={`pi ${isOpen ? "pi-folder-open" : "pi-folder"}`} style={{ color: isOpen ? "#4a6cf7" : "#94a3b8", fontSize: "0.95rem", transition: "color 0.2s" }} />
                        </div>
                        <div className="flex-grow-1">
                          <span style={{ fontSize: "0.88rem", fontWeight: isOpen ? 600 : 500, color: isOpen ? "#1e293b" : "#374151" }}>{cat.name}</span>
                          <small style={{ display: "block", color: "#94a3b8", fontSize: "0.72rem" }}>
                            {cat.subcategories?.length ?? 0} subcategoría{cat.subcategories?.length !== 1 ? "s" : ""}
                          </small>
                        </div>
                        <i
                          className={`pi ${isOpen ? "pi-chevron-up" : "pi-chevron-down"}`}
                          style={{ color: "#94a3b8", fontSize: "0.75rem", flexShrink: 0 }}
                        />
                      </div>

                      {isOpen && (
                        <div className="fadeIn animated" style={{ background: "#fff", padding: "10px 14px 14px" }}>
                          {visibleSubcategories(cat).length === 0 && (
                            <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0 }}>No hay subcategorías.</p>
                          )}

                          {visibleSubcategories(cat).map((sub: any) => {
                            const visibleFiles = sub.files ?? [];
                            const subKey = `${catKey}::${sub.id ?? sub.name}`;
                            const isSubOpen = openSubcategories[subKey];
                            return (
                              <div
                                key={sub.id ?? subKey}
                                className="mb-2 fadeIn animated"
                                style={{ borderRadius: "10px", overflow: "hidden", border: "1.5px solid rgba(0,0,0,0.05)" }}
                              >
                                {/* Subcategory row */}
                                <div
                                  className="d-flex align-items-center"
                                  style={{ padding: "10px 14px", background: isSubOpen ? "rgba(74,108,247,0.04)" : "#f8fafc", cursor: "pointer", gap: "10px", userSelect: "none" }}
                                  onClick={() => toggleSubcategory(subKey)}
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
                                      const isLoadingThis = loadingFile === (file.id ?? filePath);
                                      const fileIcon = getFileIcon(file.name ?? file.title ?? filePath);
                                      return (
                                        <div
                                          key={file.id ?? filePath}
                                          className="d-flex align-items-center fadeIn animated"
                                          style={{ padding: "7px 0", borderBottom: "1px solid rgba(0,0,0,0.04)", gap: "10px" }}
                                        >
                                          <i className={`mdi ${fileIcon.icon}`} style={{ color: fileIcon.color, fontSize: "1.15rem", flexShrink: 0 }} />
                                          <span style={{ flex: 1, fontSize: "0.84rem", color: "#374151", lineHeight: 1.3 }}>
                                            {file.name ?? file.title}
                                          </span>
                                          <button
                                            type="button"
                                            className="files-view-btn"
                                            disabled={!!loadingFile}
                                            onClick={() => handleViewFile(file)}
                                            style={{ background: "none", border: "none", padding: "4px 8px", cursor: loadingFile ? "not-allowed" : "pointer", borderRadius: "6px", display: "flex", alignItems: "center", gap: "4px", color: isLoadingThis ? "#94a3b8" : "#4a6cf7", fontSize: "0.78rem", fontWeight: 600, flexShrink: 0 }}
                                          >
                                            <i className={isLoadingThis ? "pi pi-spin pi-spinner" : "pi pi-eye"} style={{ fontSize: "0.85rem" }} />
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
                {visibleCategories.length === 0 && (
                  <div className="license-empty">
                    <i className="pi pi-inbox" />
                    <p>
                      {hasFilters ? "No hay archivos con los filtros aplicados." : "No tenés archivos digitales asignados."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* File preview sidebar */}
      <Sidebar
        visible={!!previewFile}
        position="right"
        showCloseIcon
        onHide={closePreview}
        baseZIndex={3000}
        style={{ width: "min(560px, 92vw)" }}
        header={previewSidebarHeader}
      >
        {previewFile?.type === "image" && (
          <>
            <a
              href={previewFile.url}
              download={previewFile.name}
              className="btn btn-light d-inline-flex align-items-center mb-3"
              style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.82rem", padding: "5px 14px", color: "#4a6cf7", textDecoration: "none" }}
            >
              <i className="pi pi-download" style={{ fontSize: "0.78rem" }} />
              Descargar imagen
            </a>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewFile.url} alt={previewFile.name} style={{ width: "100%", height: "auto", borderRadius: 8, display: "block" }} />
          </>
        )}
        {previewFile?.type === "pdf" && (
          <iframe src={previewFile.url} title={previewFile.name} style={{ width: "100%", height: "calc(100vh - 120px)", border: "none" }} />
        )}
      </Sidebar>
    </>
  );
}
