"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { ProgressBar } from "primereact/progressbar";
import { Dialog } from "primereact/dialog";
import { Sidebar } from "primereact/sidebar";
import { Dropdown } from "primereact/dropdown";
import { loadFileCategories, searchUsers, loadFilesForUser, uploadFileForUser, deleteUserFile } from "@/lib/services/files-admin-items.service";
import { loadFilePDF } from "@/lib/services/files.service";

const MIME_MAP: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  gif: "image/gif",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  odt: "application/vnd.oasis.opendocument.text",
};

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  return (
    <span
      style={{ display: "inline-flex" }}
      onMouseEnter={(e) => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setPos({ top: r.top, left: r.left + r.width / 2 });
      }}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {pos && (
        <div style={{ position: "fixed", top: pos.top - 10, left: pos.left, transform: "translateX(-50%) translateY(-100%)", background: "#1e293b", color: "#fff", padding: "5px 11px", borderRadius: "7px", fontSize: "0.71rem", fontWeight: 500, whiteSpace: "nowrap", pointerEvents: "none", zIndex: 9999, boxShadow: "0 4px 14px rgba(0,0,0,0.18)", letterSpacing: "0.01em" }}>
          {label}
          <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", borderWidth: "5px", borderStyle: "solid", borderColor: "#1e293b transparent transparent transparent" }} />
        </div>
      )}
    </span>
  );
}

function SkeletonUsers() {
  return (
    <div style={{ padding: "4px 0" }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", marginBottom: "4px" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(90deg, #e8ecf0 25%, #f1f5f9 50%, #e8ecf0 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.4s infinite", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 11, borderRadius: 4, width: "60%", background: "linear-gradient(90deg, #e8ecf0 25%, #f1f5f9 50%, #e8ecf0 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.4s infinite" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonFiles() {
  return (
    <div>
      {[1, 2].map((i) => (
        <div key={i} style={{ marginBottom: 16 }}>
          <div style={{ width: "35%", height: 14, borderRadius: 6, marginBottom: 10, background: "linear-gradient(90deg, #e8ecf0 25%, #f1f5f9 50%, #e8ecf0 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.4s infinite" }} />
          {[1, 2].map((j) => (
            <div key={j} style={{ height: 40, borderRadius: 10, marginBottom: 6, background: "linear-gradient(90deg, #e8ecf0 25%, #f1f5f9 50%, #e8ecf0 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.4s infinite" }} />
          ))}
        </div>
      ))}
    </div>
  );
}

function getInitial(name: string): string {
  return (name ?? "?")[0]?.toUpperCase() ?? "?";
}

const ICON_BTN_STYLE = { background: "none", borderRadius: "8px", padding: "4px 8px", cursor: "pointer", display: "inline-flex", alignItems: "center" } as const;

export default function FilesAdminUploadPage() {
  const toast = useRef<Toast>(null);
  const [userSearch, setUserSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSelected, setUserSelected] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingFile, setLoadingFile] = useState<string | null>(null);

  const [categories, setCategories] = useState<any[]>([]);

  const [showUpload, setShowUpload] = useState(false);
  const [uploadCat, setUploadCat] = useState<any>(null);
  const [uploadSubcat, setUploadSubcat] = useState<any>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadTouched, setUploadTouched] = useState(false);
  const [loadingUpload, setLoadingUpload] = useState(false);

  const [fileToDelete, setFileToDelete] = useState<any>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const [previewFile, setPreviewFile] = useState<{ url: string; type: "image" | "pdf"; name: string } | null>(null);

  useEffect(() => {
    loadFileCategories().then(setCategories).catch(() => toast.current?.show({ severity: "error", summary: "No se pudo cargar las categorías" }));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadUsers(), 1000);
    return () => clearTimeout(t);
  }, [userSearch]);

  async function loadUsers() {
    if (!userSearch.trim()) {
      setUsers([]);
      return;
    }
    setLoadingUsers(true);
    try { setUsers(await searchUsers(userSearch)); } catch { toast.current?.show({ severity: "error", summary: "No se pudo cargar los usuarios" }); }
    finally { setLoadingUsers(false); }
  }

  async function selectUser(user: any) {
    if (userSelected?.id === user.id) return;
    setUserSelected(user);
    setLoadingItems(true);
    try {
      const raw = await loadFilesForUser(user.id);
      const tempItems: any[] = [];
      const arr = Array.isArray(raw) ? raw : (raw.data ?? []);
      arr.forEach((item: any) => {
        item.sub_item.data = item.sub_item.data.reverse();
        const subitem = item.sub_item;
        delete item.sub_item;
        item.subitems = [subitem];
        const existing = tempItems.find((t: any) => t.name === item.name);
        if (existing) { existing.subitems.push(subitem); }
        else { tempItems.push({ ...item }); }
      });
      setItems(tempItems);
    } catch { toast.current?.show({ severity: "error", summary: "No se pudo cargar los archivos" }); }
    finally { setLoadingItems(false); }
  }

  function closeUploadDialog() {
    setShowUpload(false);
    setUploadCat(null);
    setUploadSubcat(null);
    setUploadFiles([]);
    setUploadTouched(false);
    closePreview();
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setUploadTouched(true);
    if (!uploadFiles.length || !uploadCat || !uploadSubcat || !userSelected) return;
    setLoadingUpload(true);
    try {
      const resp = await uploadFileForUser({ files: uploadFiles, people_id: String(userSelected.id), sub_item_id: String(uploadSubcat.id) });
      toast.current?.show({ severity: "success", summary: "Archivo subido" });
      const newFile = resp.data ?? resp;
      setItems((prev) => {
        const updatedItems = prev.map((cat: any) => {
          if (cat.name !== uploadCat.name) return cat;
          return {
            ...cat,
            subitems: cat.subitems.map((sub: any) => {
              if (sub.name !== uploadSubcat.name) return sub;
              return { ...sub, data: [newFile, ...(sub.data ?? [])] };
            }),
          };
        });
        return updatedItems;
      });
      closeUploadDialog();
    } catch { toast.current?.show({ severity: "error", summary: "No se pudo subir el archivo" }); }
    finally { setLoadingUpload(false); }
  }

  async function handleDeleteFile() {
    if (!fileToDelete) return;
    setLoadingDelete(true);
    try {
      await deleteUserFile(fileToDelete.id);
      setItems((prev) => prev
        .map((cat: any) => ({
          ...cat,
          subitems: cat.subitems
            .map((sub: any) => ({ ...sub, data: (sub.data ?? []).filter((f: any) => f.id !== fileToDelete.id) }))
            .filter((sub: any) => (sub.data ?? []).length > 0),
        }))
        .filter((cat: any) => cat.subitems.length > 0)
      );
      toast.current?.show({ severity: "success", summary: "Archivo eliminado" });
      setFileToDelete(null);
    } catch { toast.current?.show({ severity: "error", summary: "No se pudo eliminar el archivo" }); }
    finally { setLoadingDelete(false); }
  }

  async function handleViewFile(file: any) {
    if (loadingFile) return;
    setLoadingFile(file.id);
    const ext = (file.path ?? "").split(".").pop()?.toLowerCase() ?? "pdf";
    const name = file.path?.split("/").pop() ?? "archivo";
    try {
      const buffer = await loadFilePDF(file.path);
      const mime = MIME_MAP[ext] ?? "application/octet-stream";
      const blob = new Blob([buffer], { type: mime });
      const url = URL.createObjectURL(blob);
      if (ext === "odt") {
        const link = document.createElement("a");
        link.href = url;
        link.download = "archivo.odt";
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
    } catch { toast.current?.show({ severity: "error", summary: "No se pudo abrir el archivo" }); }
    finally { setLoadingFile(null); }
  }

  function closePreview() {
    if (previewFile) URL.revokeObjectURL(previewFile.url);
    setPreviewFile(null);
  }

  function previewLocalFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const url = URL.createObjectURL(file);
    if (ext === "pdf") setPreviewFile({ url, type: "pdf", name: file.name });
    else if (["png", "jpg", "jpeg", "gif"].includes(ext)) setPreviewFile({ url, type: "image", name: file.name });
    else window.open(url);
  }

  const totalFiles = items.reduce((acc, cat) => acc + cat.subitems.reduce((a: number, s: any) => a + (s.data ?? []).length, 0), 0);

  const uploadDialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-cloud-upload" style={{ color: "#3b82f6", fontSize: "1rem" }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Subir archivo</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{userSelected?.lastname_name ?? userSelected?.name ?? ""}</small>
      </div>
    </div>
  );

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

  const deleteDialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fff1f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-trash" style={{ color: "#dc3545", fontSize: "1rem" }} />
      </div>
      <div>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Eliminar archivo</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Esta acción no se puede deshacer</small>
      </div>
    </div>
  );

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />

      <div className="fadeIn animated">

        {/* Header card */}
        <div className="card profile-card">
          <div className="d-flex align-items-center px-3 pt-3 pb-3" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eef1ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-id-card" style={{ color: "#4a6cf7", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Modificación de legajos</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Gestion de legajos por agente</small>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          {/* User search */}
          <div className="col-12 col-lg-4">
            <div className="card profile-card">
              <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
                <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className="pi pi-search" style={{ color: "#059669", fontSize: "1rem" }} />
                </div>
                <div className="flex-grow-1">
                  <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Buscar usuario</h5>
                  <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Seleccioná un agente para gestionar sus archivos</small>
                </div>
              </div>
              <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />
              <div className="card-body" style={{ padding: "16px 20px 20px" }}>
                <div className="bosses-search-wrap">
                  <i className="pi pi-search bosses-search-icon" />
                  <input
                    className="profile-input"
                    style={{ paddingLeft: "36px", paddingRight: userSearch ? "40px" : "13px" }}
                    placeholder="Nombre o apellido…"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    autoComplete="off"
                  />
                  {userSearch && (
                    <button type="button" className="bosses-search-clear" onClick={() => setUserSearch("")}>
                      <i className="pi pi-times" style={{ fontSize: "0.72rem" }} />
                    </button>
                  )}
                </div>

                {loadingUsers ? (
                  <SkeletonUsers />
                ) : users.length === 0 ? (
                  <div className="text-center py-4 animated fadeIn" style={{ color: "#94a3b8", fontSize: "0.88rem" }}>
                    <i className="pi pi-search mb-2" style={{ fontSize: "1.5rem", display: "block", opacity: 0.4 }} />
                    {userSearch.trim() ? "Sin resultados para tu búsqueda." : "Escribí un nombre o apellido para buscar."}
                  </div>
                ) : (
                  <div className="fadeIn animated" style={{ maxHeight: 420, overflowY: "auto", padding: "2px" }}>
                    {users.map((u: any) => {
                      const isSelected = userSelected?.id === u.id;
                      return (
                        <div
                          key={u.id}
                          className={`bosses-modal-item${isSelected ? " bosses-modal-item--selected" : ""}`}
                          onClick={() => selectUser(u)}
                        >
                          <div style={{ width: 36, height: 36, borderRadius: "50%", background: isSelected ? "rgba(74,108,247,0.15)" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.78rem", fontWeight: 700, color: isSelected ? "#4a6cf7" : "#64748b", transition: "background 0.15s, color 0.15s" }}>
                            {getInitial(u.lastname_name ?? u.name)}
                          </div>
                          <div className="flex-grow-1" style={{ minWidth: 0 }}>
                            <p className="mb-0" style={{ fontSize: "0.87rem", fontWeight: isSelected ? 600 : 400, color: isSelected ? "#1e293b" : "#374151", lineHeight: 1.3 }}>
                              {u.lastname_name ?? u.name}
                            </p>
                          </div>
                          <i
                            className={`pi pi-check-circle${isSelected ? " animated fadeIn" : ""}`}
                            style={{ color: isSelected ? "#4a6cf7" : "transparent", fontSize: "1rem", flexShrink: 0, transition: "color 0.15s" }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Files for selected user */}
          <div className="col-12 col-lg-8">
            {!userSelected ? (
              <div className="card profile-card">
                <div className="card-body text-center py-5" style={{ color: "#94a3b8" }}>
                  <i className="pi pi-folder-open" style={{ fontSize: "2rem", color: "#cbd5e1", display: "block", marginBottom: "8px" }} />
                  <p style={{ margin: 0, fontSize: "0.9rem" }}>Seleccioná un usuario para ver sus archivos.</p>
                </div>
              </div>
            ) : (
              <div className="card profile-card">
                <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
                  <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <i className="pi pi-folder-open" style={{ color: "#3b82f6", fontSize: "1rem" }} />
                  </div>
                  <div className="flex-grow-1" style={{ minWidth: 0 }}>
                    <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>{userSelected.lastname_name ?? userSelected.name}</h5>
                    <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                      {loadingItems ? "Cargando archivos…" : `${totalFiles} ${totalFiles === 1 ? "archivo" : "archivos"}`}
                    </small>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowUpload(true); setUploadCat(null); setUploadSubcat(null); setUploadFiles([]); setUploadTouched(false); }}
                    className="btn btn-primary d-flex align-items-center"
                    style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.82rem", flexShrink: 0 }}
                  >
                    <i className="pi pi-cloud-upload" style={{ fontSize: "0.78rem" }} />
                    Subir archivo
                  </button>
                </div>
                <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />

                <div className="card-body" style={{ padding: "16px 20px 20px" }}>
                  {loadingItems && <SkeletonFiles />}

                  {!loadingItems && items.length === 0 && (
                    <div style={{ padding: "30px 0", textAlign: "center" }}>
                      <i className="pi pi-inbox" style={{ fontSize: "2rem", color: "#cbd5e1", display: "block", marginBottom: "8px" }} />
                      <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: 0 }}>No hay archivos para este usuario.</p>
                    </div>
                  )}

                  {!loadingItems && items.length > 0 && (
                    <div className="fadeIn animated">
                      {items.map((cat: any) => (
                        <div key={cat.id} style={{ marginBottom: "18px" }}>
                          <p className="mb-2" style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" }}>
                            <i className="pi pi-folder" style={{ fontSize: "0.78rem", marginRight: "6px", color: "#94a3b8" }} />
                            {cat.name}
                          </p>
                          {cat.subitems.map((sub: any) => (
                            <div key={sub.id} style={{ marginLeft: "18px", marginBottom: "10px" }}>
                              <p className="mb-1" style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b" }}>
                                <i className="pi pi-folder-open" style={{ fontSize: "0.72rem", marginRight: "6px", color: "#3b82f6" }} />
                                {sub.name}
                              </p>
                              {(sub.data ?? []).map((file: any) => (
                                <div
                                  key={file.id}
                                  className="d-flex align-items-center justify-content-between"
                                  style={{ padding: "8px 12px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: "6px" }}
                                >
                                  <span className="d-flex align-items-center" style={{ gap: "6px", fontSize: "0.82rem", color: "#374151", minWidth: 0 }}>
                                    <i className="pi pi-file" style={{ fontSize: "0.78rem", color: "#94a3b8", flexShrink: 0 }} />
                                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.path?.split("/").pop()}</span>
                                  </span>
                                  <div className="d-flex align-items-center" style={{ gap: "6px", flexShrink: 0 }}>
                                    <Tooltip label="Ver archivo">
                                      <button type="button" onClick={() => handleViewFile(file)} disabled={loadingFile === file.id} style={{ ...ICON_BTN_STYLE, border: "1.5px solid #e2e8f0", color: "#64748b" }}>
                                        <i className={loadingFile === file.id ? "pi pi-spin pi-spinner" : "pi pi-eye"} style={{ fontSize: "0.85rem" }} />
                                      </button>
                                    </Tooltip>
                                    <Tooltip label="Eliminar">
                                      <button type="button" onClick={() => setFileToDelete({ ...file, catName: cat.name, subName: sub.name })} style={{ ...ICON_BTN_STYLE, border: "1.5px solid #fecdd3", color: "#dc3545" }}>
                                        <i className="pi pi-trash" style={{ fontSize: "0.85rem" }} />
                                      </button>
                                    </Tooltip>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload dialog */}
      <Dialog
        header={uploadDialogHeader}
        visible={showUpload}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        baseZIndex={2000}
        position={"center"}
        style={{ width: "min(480px, 92vw)" }}
        onHide={closeUploadDialog}
        footer={
          <div>
            <div className="d-flex align-items-center" style={{ gap: "8px" }}>
              <button
                form="upload-file-form"
                disabled={loadingUpload}
                type="submit"
                className="btn btn-primary d-flex align-items-center"
                style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
              >
                <i className={loadingUpload ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
                {loadingUpload ? "Subiendo..." : "Subir"}
              </button>
              <button
                disabled={loadingUpload}
                onClick={closeUploadDialog}
                type="button"
                className="btn btn-light text-muted ml-auto"
                style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
              >
                Volver
              </button>
            </div>
            {loadingUpload && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
          </div>
        }
      >
        <form id="upload-file-form" onSubmit={handleUpload} noValidate>
          <div className="mb-3">
            <label className="profile-field-label">Categoría *</label>
            <div className={`license-filter-input-wrap${uploadCat ? " license-filter-input-wrap--active" : ""}`}>
              <i className="pi pi-folder license-filter-icon" />
              <Dropdown
                value={uploadCat?.id ?? null}
                options={categories}
                optionLabel="name"
                optionValue="id"
                onChange={(e) => {
                  const cat = categories.find((c) => c.id === e.value);
                  setUploadCat(cat ?? null);
                  setUploadSubcat(null);
                }}
                placeholder="Seleccioná una categoría"
                className="license-filter-dropdown"
                panelClassName="license-filter-dropdown-panel"
                emptyMessage="Sin categorías"
              />
            </div>
            {uploadTouched && !uploadCat && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
          </div>

          <div className="mb-3">
            <label className="profile-field-label">Subcategoría *</label>
            <div className={`license-filter-input-wrap${uploadSubcat ? " license-filter-input-wrap--active" : ""}`}>
              <i className="pi pi-folder license-filter-icon" />
              <Dropdown
                value={uploadSubcat?.id ?? null}
                options={uploadCat?.subitems ?? []}
                optionLabel="name"
                optionValue="id"
                onChange={(e) => {
                  const sub = uploadCat?.subitems?.find((s: any) => s.id === e.value);
                  setUploadSubcat(sub ?? null);
                }}
                disabled={!uploadCat}
                placeholder="Seleccioná una subcategoría"
                className="license-filter-dropdown"
                panelClassName="license-filter-dropdown-panel"
                emptyMessage="Sin subcategorías"
              />
            </div>
            {uploadTouched && !uploadSubcat && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
          </div>

          <div className="mb-1">
            <label className="profile-field-label">Archivo *</label>
            <input
              type="file"
              className="form-control-file"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                setUploadFiles(files);
                if (files[0]) previewLocalFile(files[0]);
              }}
            />
            {uploadTouched && !uploadFiles.length && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
          </div>
        </form>
      </Dialog>

      {/* File preview sidebar */}
      <Sidebar
        visible={!!previewFile}
        position="right"
        modal={false}
        showCloseIcon={!showUpload}
        closeOnEscape={!showUpload}
        onHide={() => { if (!showUpload) closePreview(); }}
        baseZIndex={2000}
        style={{ width: "min(560px, 92vw)" }}
        header={previewSidebarHeader}
      >
        {previewFile?.type === "image" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewFile.url} alt={previewFile.name} style={{ width: "100%", height: "auto", borderRadius: 8, display: "block" }} />
        )}
        {previewFile?.type === "pdf" && (
          <iframe src={previewFile.url} title={previewFile.name} style={{ width: "100%", height: "calc(100vh - 120px)", border: "none" }} />
        )}
      </Sidebar>

      {/* Delete dialog */}
      <Dialog
        header={deleteDialogHeader}
        visible={!!fileToDelete}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(420px, 92vw)" }}
        onHide={() => setFileToDelete(null)}
        footer={
          <div>
            <div className="d-flex align-items-center" style={{ gap: "8px" }}>
              <button
                disabled={loadingDelete}
                onClick={handleDeleteFile}
                type="button"
                className="btn btn-danger d-flex align-items-center"
                style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
              >
                <i className={loadingDelete ? "pi pi-spin pi-spinner" : "pi pi-trash"} style={{ fontSize: "0.78rem" }} />
                {loadingDelete ? "Eliminando..." : "Sí, eliminar"}
              </button>
              <button
                disabled={loadingDelete}
                onClick={() => setFileToDelete(null)}
                type="button"
                className="btn btn-light text-muted ml-auto"
                style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
              >
                Volver
              </button>
            </div>
            {loadingDelete && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
          </div>
        }
      >
        <p style={{ fontSize: "0.88rem", color: "#374151", margin: 0 }}>
          Está a punto de eliminar el archivo <strong>{fileToDelete?.path?.split("/").pop()}</strong>.
        </p>
      </Dialog>
    </>
  );
}