"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";
import { loadFiles, loadFilePDF } from "@/lib/services/files.service";

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
    } catch { toast.current?.show({ severity: "error", summary: "No se pudo abrir el archivo PDF" }); }
    finally { setLoadingPdf(null); }
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
    const q = search.toLowerCase();
    return (file.name ?? file.title ?? "").toLowerCase().includes(q);
  }

  function categoryHasResults(cat: any) {
    if (!search) return true;
    return cat.subcategories?.some((sub: any) => sub.files?.some(matchesSearch)) ?? false;
  }

  return (
    <>
      <Toast ref={toast} position="bottom-center" />

      <div className="fadeIn animated">
        <div className="row page-titles">
          <div className="col-md-5 align-self-center">
            <h3 className="text-themecolor">Legajo</h3>
          </div>
          <div className="col-md-7 align-self-center">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="javascript:void(0)">Inicio</a></li>
              <li className="breadcrumb-item">Legajo</li>
            </ol>
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-12 col-md-5">
            <input type="text" className="form-control form-control-sm" placeholder="Buscar archivo..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {loading && <ProgressBar mode="indeterminate" style={{ height: "4px" }} className="mb-3" />}

        {categories.filter(categoryHasResults).map((cat: any) => (
          <div key={cat.id} className="card mb-3 fadeIn animated">
            <div className="card-header pointer d-flex justify-content-between align-items-center" onClick={() => toggleCategory(cat.id)}>
              <h5 className="mb-0">
                <i className={`mdi ${openCategories[cat.id] ? "mdi-folder-open-outline" : "mdi-folder-outline"} mr-2 text-warning`} />
                {cat.name}
              </h5>
              <i className={`mdi ${openCategories[cat.id] ? "mdi-chevron-up" : "mdi-chevron-down"}`} />
            </div>

            {openCategories[cat.id] && (
              <div className="card-body">
                {(cat.subcategories ?? []).map((sub: any) => {
                  const visibleFiles = (sub.files ?? []).filter(matchesSearch);
                  if (search && visibleFiles.length === 0) return null;
                  return (
                    <div key={sub.id} className="mb-2 fadeIn animated">
                      <div
                        className="d-flex justify-content-between align-items-center pointer py-2 px-3 rounded"
                        style={{ backgroundColor: "#f8f9fa", cursor: "pointer" }}
                        onClick={() => toggleSubcategory(sub.id)}
                      >
                        <span>
                          <i className={`mdi ${openSubcategories[sub.id] ? "mdi-folder-open" : "mdi-folder"} mr-2 text-info`} />
                          <strong>{sub.name}</strong>
                          <span className="badge badge-secondary ml-2">{visibleFiles.length}</span>
                        </span>
                        <i className={`mdi ${openSubcategories[sub.id] ? "mdi-chevron-up" : "mdi-chevron-down"}`} />
                      </div>

                      {openSubcategories[sub.id] && (
                        <div className="mt-1 px-3">
                          {visibleFiles.length === 0 && <small className="text-muted">No hay archivos en esta subcategoría.</small>}
                          {visibleFiles.map((file: any) => (
                            <div key={file.id ?? file.path} className="d-flex justify-content-between align-items-center py-1 border-bottom fadeIn animated">
                              <span>
                                <i className="mdi mdi-file-pdf-box text-danger mr-2" />
                                <small>{file.name ?? file.title}</small>
                              </span>
                              <button
                                className="btn btn-sm btn-light"
                                disabled={loadingPdf === (file.path ?? file.path_url)}
                                onClick={() => handleOpenPdf(file.path ?? file.path_url)}
                              >
                                {loadingPdf === (file.path ?? file.path_url)
                                  ? <i className="pi pi-spin pi-spinner" />
                                  : <i className="mdi mdi-eye-outline text-info" />
                                }
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {(cat.subcategories ?? []).length === 0 && (
                  <small className="text-muted">No hay subcategorías.</small>
                )}
              </div>
            )}
          </div>
        ))}

        {!loading && categories.filter(categoryHasResults).length === 0 && (
          <div className="text-center py-5 text-muted">
            {search ? "No se encontraron archivos con ese nombre." : "No hay archivos disponibles."}
          </div>
        )}
      </div>
    </>
  );
}
