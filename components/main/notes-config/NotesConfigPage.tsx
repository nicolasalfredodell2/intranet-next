"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { getNotesConfig, setNotesConfig, getNotes } from "@/lib/services/notes.service";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const TYPES = ["featured", "order1", "order2"] as const;
type ConfigType = typeof TYPES[number];

const TYPE_LABELS: Record<string, string> = {
  featured: "1ra Nota Principal",
  order1: "2da Nota Principal",
  order2: "3ra Nota Principal",
};

interface ConfigEntry { type: ConfigType; note_id: number | null; }

function initConfigs(): ConfigEntry[] {
  return TYPES.map((t) => ({ type: t, note_id: null }));
}

export default function NotesConfigPage() {
  const toast = useRef<Toast>(null);
  const [config, setConfig] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [configs, setConfigs] = useState<ConfigEntry[]>(initConfigs());
  const [isLoadConfig, setIsLoadConfig] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isSetConfig, setIsSetConfig] = useState(false);
  const [searchTitle, setSearchTitle] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [filters, setFilters] = useState({ page: 1, per_page: 9, title: "" });

  useEffect(() => {
    loadConfigNotes();
  }, []);

  useEffect(() => {
    chargeNotes(filters);
  }, [filters]);

  async function loadConfigNotes() {
    if (isLoadConfig) return;
    setIsLoadConfig(true);
    try {
      const resp = await getNotesConfig();
      const arr: any[] = Array.isArray(resp) ? resp : [];
      setConfig(arr);
      setConfigs((prev) => {
        const next = [...prev];
        arr.forEach((item: any) => {
          const idx = next.findIndex((c) => c.type === item.type);
          if (idx !== -1) next[idx] = { ...next[idx], note_id: item.note_id };
        });
        return next;
      });
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo cargar la configuración de notas" });
    } finally {
      setIsLoadConfig(false);
      chargeNotes(filters);
    }
  }

  async function chargeNotes(f: typeof filters) {
    setIsLoadingNotes(true);
    try {
      const resp = await getNotes(f.page, f.per_page);
      setNotes(resp.data ?? []);
    } catch {
      setNotes([]);
      toast.current?.show({ severity: "error", summary: "No se pudieron cargar las notas" });
    } finally {
      setIsLoadingNotes(false);
    }
  }

  function onKeyPress(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSearchTitle(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters((p) => ({ ...p, title: val, page: 1 }));
    }, 1000);
  }

  function getConfigTypeForNote(noteId: number): string {
    const found = configs.find((c) => c.note_id === noteId);
    return found ? found.type : "";
  }

  function updateConfigForNote(noteId: number, selectedType: string) {
    setConfigs((prev) => {
      const next = prev.map((c) => c.note_id === noteId ? { ...c, note_id: null } : c);
      if (selectedType) {
        const idx = next.findIndex((c) => c.type === selectedType);
        if (idx !== -1) next[idx] = { ...next[idx], note_id: noteId };
      }
      return next;
    });

    // Immediately save after updating
    setTimeout(() => saveConfigs(), 0);
  }

  function saveConfigs() {
    if (isSetConfig) return;

    const labels: Record<string, string> = {
      featured: "Falta asignar la 1ra nota principal",
      order1: "Falta asignar la 2da nota principal",
      order2: "Falta asignar la 3ra nota principal",
    };

    setConfigs((current) => {
      const missing = current.filter((c) => !c.note_id).map((c) => labels[c.type] ?? c.type);
      if (missing.length) {
        missing.forEach((detail) => toast.current?.show({ severity: "warn", summary: "Falta nota por asignar", detail }));
        return current;
      }

      setIsSetConfig(true);
      setNotesConfig({ configs: current })
        .then(() => {
          toast.current?.show({ severity: "success", summary: "Configuración guardada" });
          loadConfigNotes();
        })
        .catch(() => toast.current?.show({ severity: "error", summary: "No se pudo guardar la nueva configuración" }))
        .finally(() => setIsSetConfig(false));

      return current;
    });
  }

  const typeBadgeClass = (type: string) => {
    if (type === "featured") return "badge bg-success px-3 py-2";
    if (type === "order1") return "badge bg-primary px-3 py-2";
    return "badge bg-info px-3 py-2";
  };

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />

      <div className="fadeIn animated">
        <div className="row page-titles">
          <div className="col-md-5 align-self-center">
            <h3 className="text-themecolor">Configuración de notas</h3>
          </div>
          <div className="col-md-7 align-self-center">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="javascript:void(0)">Inicio</a></li>
              <li className="breadcrumb-item">Configuración de notas</li>
            </ol>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <div className="animated fadeIn row">
                  {isLoadConfig && (
                    <div className="col-12 my-4 text-center">
                      <i className="fa fa-spin fa-spinner text-muted" /> Cargando configuración actual
                    </div>
                  )}

                  <div className="col-12">
                    {config.length > 0 && (
                      <div className="mb-5 position-relative">
                        <h4 className="card-title text-primary mb-3">
                          <i className="fa fa-star text-warning mr-2" /> Notas configuradas actualmente
                        </h4>

                        <ol className="list-group list-group-numbered">
                          {config.map((item, i) => (
                            <li key={i} className="d-flex align-items-center p-3 mb-3 border border-info rounded bg-light shadow-sm">
                              <div className="ml-3 flex-grow-1">
                                <div className="fw-bold fs-5 mb-1 text-dark font-bold">{item.note?.title}</div>
                                <div className="text-muted" style={{ fontSize: "0.9rem" }}>{item.note?.subtitle}</div>
                              </div>
                              <div className="ml-auto text-end flex-shrink-0">
                                <span className={typeBadgeClass(item.type)} style={{ fontSize: "0.85rem" }}>
                                  {TYPE_LABELS[item.type] ?? item.type}
                                </span>
                                <br />
                                <small className="text-muted d-block mt-2">
                                  Actualizada el {item.updated_at ? new Date(item.updated_at).toLocaleString("es-AR") : "-"}
                                </small>
                              </div>
                            </li>
                          ))}
                        </ol>

                        {isSetConfig && (
                          <div className="position-absolute w-100 h-100 d-flex flex-column justify-content-center align-items-center animated fadeIn"
                            style={{ top: 0, left: 0, backgroundColor: "rgba(255,255,255,0.85)", zIndex: 1000, borderRadius: 4 }}>
                            <i className="fa fa-circle-notch fa-spin text-primary" style={{ fontSize: "3rem" }} />
                            <h4 className="mt-3 text-primary font-weight-bold">Guardando configuración...</h4>
                          </div>
                        )}

                        <hr className="mt-4 mb-2" />
                      </div>
                    )}

                    <h4 className="card-title mb-3">Buscar notas</h4>
                    <input
                      type="text"
                      disabled={isLoadingNotes || isLoadConfig}
                      className="form-control w-100"
                      value={searchTitle}
                      onChange={onKeyPress}
                      placeholder="Buscar nota por título"
                      autoComplete="off"
                    />
                  </div>

                  {isLoadingNotes && (
                    <div className="col-12 text-center my-4">
                      <i className="fa fa-spin fa-spinner text-muted" /> Cargando notas
                    </div>
                  )}

                  {!isLoadingNotes && notes.length > 0 && (
                    <div className="col-12 my-4">
                      <ol className="list-group list-group-numbered">
                        {notes.map((note) => (
                          <li key={note.id} className="d-flex align-items-center p-3 mb-3 border rounded bg-white shadow-sm">
                            <div className="flex-shrink-0">
                              <img
                                src={note.images?.[0]?.path_url ? `${API_URL}${note.images[0].path_url}` : "/assets/img/news/no-image.png"}
                                alt="Imagen de la nota"
                                className="rounded"
                                style={{ width: 100, height: 100, objectFit: "cover" }}
                              />
                            </div>
                            <div className="ml-3 flex-grow-1">
                              <div className="fw-bold fs-5 mb-1 text-dark font-bold">{note.title}</div>
                              <div className="text-muted" style={{ fontSize: "0.9rem" }}>{note.subtitle}</div>
                            </div>
                            <div className="ml-auto text-end text-secondary flex-shrink-0">
                              <select
                                className="form-control form-control-line form-control-sm"
                                style={{ height: 35 }}
                                disabled={isSetConfig}
                                value={getConfigTypeForNote(note.id)}
                                onChange={(e) => updateConfigForNote(note.id, e.target.value)}
                              >
                                <option value="">-- Sin asignar --</option>
                                <option value="featured">1ra Nota Principal</option>
                                <option value="order1">2da Nota Principal</option>
                                <option value="order2">3ra Nota Principal</option>
                              </select>
                              <br />
                              <small className="mt-4">
                                Creado el {note.created_at ? new Date(note.created_at).toLocaleDateString("es-AR") : "-"}
                              </small>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {!isLoadingNotes && !isLoadConfig && notes.length === 0 && (
                    <div className="col-12 text-center my-4">No hay notas para mostrar</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
