"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";
import { Dialog } from "primereact/dialog";
import { searchUsers, loadFilesForUser, uploadFileForUser, deleteUserFile } from "@/lib/services/files-admin-items.service";
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

export default function FilesAdminUploadPage() {
  const toast = useRef<Toast>(null);
  const [userSearch, setUserSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSelected, setUserSelected] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingFile, setLoadingFile] = useState<string | null>(null);

  const [showUpload, setShowUpload] = useState(false);
  const [uploadCat, setUploadCat] = useState<any>(null);
  const [uploadSubcat, setUploadSubcat] = useState<any>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [loadingUpload, setLoadingUpload] = useState(false);

  const [fileToDelete, setFileToDelete] = useState<any>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadUsers(), 1000);
    return () => clearTimeout(t);
  }, [userSearch]);

  async function loadUsers() {
    setLoadingUsers(true);
    try { setUsers(await searchUsers(userSearch || " ")); } catch { toast.current?.show({ severity: "error", summary: "No se pudo cargar los usuarios" }); }
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

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
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
      setShowUpload(false); setUploadFiles([]); setUploadCat(null); setUploadSubcat(null);
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
    try {
      const buffer = await loadFilePDF(file.path);
      const mime = MIME_MAP[ext] ?? "application/octet-stream";
      const blob = new Blob([buffer], { type: mime });
      if (ext === "odt") {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "archivo.odt";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        window.open(URL.createObjectURL(blob));
      }
    } catch { toast.current?.show({ severity: "error", summary: "No se pudo abrir el archivo" }); }
    finally { setLoadingFile(null); }
  }

  return (
    <>
      <Toast ref={toast} position="bottom-center" />

      <div className="fadeIn animated">
        <div className="row page-titles">
          <div className="col-md-5 align-self-center">
            <h3 className="text-themecolor">Carga de archivos por usuario</h3>
          </div>
          <div className="col-md-7 align-self-center">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="javascript:void(0)">Inicio</a></li>
              <li className="breadcrumb-item">Carga de archivos</li>
            </ol>
          </div>
        </div>

        <div className="row">
          {/* User list */}
          <div className="col-12 col-lg-4">
            <div className="card">
              <div className="card-header"><h6>Buscar usuario</h6></div>
              <div className="card-body">
                <input type="text" className="form-control form-control-sm mb-2" placeholder="Nombre o apellido..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
                {loadingUsers && <ProgressBar mode="indeterminate" style={{ height: "4px" }} />}
                <ul className="list-group list-group-flush" style={{ maxHeight: 400, overflowY: "auto" }}>
                  {users.map((u: any) => (
                    <li key={u.id} className={`list-group-item list-group-item-action pointer py-1 ${userSelected?.id === u.id ? "active" : ""}`} onClick={() => selectUser(u)}>
                      <small>{u.lastname_name ?? u.name}</small>
                    </li>
                  ))}
                  {!loadingUsers && users.length === 0 && <li className="list-group-item text-muted text-center"><small>Sin resultados</small></li>}
                </ul>
              </div>
            </div>
          </div>

          {/* Files */}
          <div className="col-12 col-lg-8">
            {!userSelected && <div className="text-center text-muted py-5">Seleccione un usuario para ver sus archivos.</div>}
            {userSelected && (
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h6>{userSelected.lastname_name}</h6>
                  <button className="btn btn-sm btn-info" onClick={() => { setShowUpload(true); setUploadCat(null); setUploadSubcat(null); setUploadFiles([]); }}>
                    <i className="mdi mdi-upload" /> Subir archivo
                  </button>
                </div>
                <div className="card-body">
                  {loadingItems && <ProgressBar mode="indeterminate" style={{ height: "4px" }} />}
                  {!loadingItems && items.length === 0 && <p className="text-muted text-center">No hay archivos para este usuario.</p>}
                  {items.map((cat: any) => (
                    <div key={cat.id} className="mb-3 fadeIn animated">
                      <h6 className="text-muted"><i className="mdi mdi-folder-outline mr-1" />{cat.name}</h6>
                      {cat.subitems.map((sub: any) => (
                        <div key={sub.id} className="ml-3 mb-2">
                          <div className="font-weight-bold small mb-1"><i className="mdi mdi-folder mr-1 text-info" />{sub.name}</div>
                          {(sub.data ?? []).map((file: any) => (
                            <div key={file.id} className="d-flex justify-content-between align-items-center py-1 px-2 border-bottom">
                              <span className="small"><i className="mdi mdi-file-outline mr-1" />{file.path?.split("/").pop()}</span>
                              <div>
                                <button className="btn btn-sm btn-light mr-1" onClick={() => handleViewFile(file)} disabled={loadingFile === file.id}>
                                  {loadingFile === file.id ? <i className="pi pi-spin pi-spinner" /> : <i className="mdi mdi-eye-outline text-info" />}
                                </button>
                                <button className="btn btn-sm btn-danger" onClick={() => setFileToDelete({ ...file, catName: cat.name, subName: sub.name })}>
                                  <i className="mdi mdi-delete-outline" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload dialog */}
      <Dialog header="Subir archivo" visible={showUpload} modal draggable={false} resizable={false} style={{ width: "460px" }} onHide={() => setShowUpload(false)}>
        <form onSubmit={handleUpload} noValidate>
          <div className="form-group">
            <label><small>Categoría *</small></label>
            <select className="custom-select w-100" value={uploadCat?.id ?? ""} onChange={(e) => {
              const cat = items.find((c) => String(c.id) === e.target.value);
              setUploadCat(cat ?? null); setUploadSubcat(null);
            }}>
              <option value=""></option>
              {items.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label><small>Subcategoría *</small></label>
            <select className="custom-select w-100" value={uploadSubcat?.id ?? ""} onChange={(e) => {
              const sub = uploadCat?.subitems?.find((s: any) => String(s.id) === e.target.value);
              setUploadSubcat(sub ?? null);
            }} disabled={!uploadCat}>
              <option value=""></option>
              {(uploadCat?.subitems ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label><small>Archivo *</small></label>
            <input type="file" multiple className="form-control-file" onChange={(e) => setUploadFiles(Array.from(e.target.files ?? []))} />
          </div>
          <button disabled={loadingUpload || !uploadCat || !uploadSubcat || !uploadFiles.length} type="submit" className="btn btn-info btn-block mt-2">
            {loadingUpload ? "Subiendo..." : "Subir"}
          </button>
        </form>
      </Dialog>

      {/* Delete modal */}
      {fileToDelete && (
        <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 400 }}>
            <div className="modal-content text-center p-4">
              <i className="mdi mdi-alert-circle-outline text-danger mb-3" style={{ fontSize: "3rem" }} />
              <h4>¿Eliminar archivo?</h4>
              <p className="text-muted small">{fileToDelete?.path?.split("/").pop()}</p>
              <div className="row g-2 mt-3">
                <div className="col-6"><button disabled={loadingDelete} className="btn btn-light w-100" onClick={() => setFileToDelete(null)}>Cancelar</button></div>
                <div className="col-6"><button disabled={loadingDelete} className="btn btn-danger w-100" onClick={handleDeleteFile}>{loadingDelete ? "..." : "Eliminar"}</button></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
