"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { ProgressBar } from "primereact/progressbar";
import { Toast } from "primereact/toast";
import { loadAllGroups, saveGroupQR } from "@/lib/services/groups.service";

const LOGO_BASE64 =
  "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";

function buildSignatureHtml(
  typeOrg: string,
  departament: string,
  email: string,
  internals: string,
  qrDataUrl: string
): string {
  const logoImg = `<img src='data:image/png;base64,${LOGO_BASE64}' alt='logo TCRN' style='width:100%;max-width:110px;min-width:65px;'>`;
  return `<!DOCTYPE html><html><head></head><body><table class='email-signature' style='font-family:Montserrat;width:100%;background-color:#657185;font-size:0.8em;padding:6.5px;'><tr><td style='padding:1px;vertical-align:middle;color:#ededed;width:6%;min-width:90px;'>${logoImg}</td><td style='padding:8px;vertical-align:middle;color:#ededed;'><div style='font-size:1em;font-weight:bold;'>${typeOrg} ${departament}</div><div><a href='mailto:${email}@tribcuentasrionegro.gov.ar' style='color:#ededed;text-decoration:none;'>${email}@tribcuentasrionegro.gov.ar</a></div><div>02920 421500 - Int. ${internals}</div><div><a href='https://www.tribcuentasrionegro.gov.ar' target='_blank' style='color:#ededed;text-decoration:none;'>www.tribcuentasrionegro.gov.ar</a></div><div style='color:#ededed;'>Moreno 263 - Viedma - Río Negro</div></td><td style='vertical-align:middle;color:#ededed;text-align:right;'><img src='${qrDataUrl}' alt='Código QR' style='display:inline-block;max-width:125px!important;width:100%;height:auto;min-width:65px;'></td></tr></table></body></html>`;
}

interface QrForm {
  departament: string;
  email: string;
  internals: string;
}

interface QrErrors {
  departament?: string;
  email?: string;
  internals?: string;
}

function validateQrForm(f: QrForm): QrErrors {
  const errors: QrErrors = {};
  if (!f.departament) errors.departament = "* Campo obligatorio";
  else if (f.departament.length > 80) errors.departament = "* Puede ingresar hasta 80 caracteres";

  if (!f.email) errors.email = "* Campo obligatorio";
  else if (!/^[A-Za-z0-9._-]+$/.test(f.email)) errors.email = "* Solo se aceptan números, letras y algunos caracteres especiales.";
  else if (f.email.startsWith(".")) errors.email = "* No puede comenzar con punto.";
  else if (f.email.endsWith(".")) errors.email = "* No puede terminar con punto.";
  else if (/[.\-_]{2}/.test(f.email)) errors.email = "* No puede haber dos caracteres especiales seguidos.";
  else if (f.email.length > 50) errors.email = "* Puede ingresar hasta 50 caracteres";

  if (!f.internals) errors.internals = "* Campo obligatorio";
  else if (!/^[0-9/ ]+$/.test(f.internals)) errors.internals = "* Solo se acepta números, espacios y barra (/)";
  else if (f.internals.length > 30) errors.internals = "* Puede ingresar hasta 30 caracteres";

  return errors;
}

interface Props {
  isShow: boolean;
  qrCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  onHide: () => void;
  onChangeQR: (data: { departament: string; email: string; internals: string; typeOrgasnization: string }) => void;
}

export default function QrDepartament({ isShow, qrCanvasRef, onHide, onChangeQR }: Props) {
  const toast = useRef<Toast>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [typeOrg, setTypeOrg] = useState("Departamento de");
  const [form, setForm] = useState<QrForm>({ departament: "", email: "", internals: "" });
  const [touched, setTouched] = useState<Partial<Record<keyof QrForm, boolean>>>({});
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isLoadingGenerate, setIsLoadingGenerate] = useState(false);
  const [isLoadingSave, setIsLoadingSave] = useState(false);

  useEffect(() => {
    if (isShow) loadGroups();
  }, [isShow]);

  async function loadGroups() {
    if (isLoadingGroups) return;
    setIsLoadingGroups(true);
    try {
      const resp = await loadAllGroups();
      setGroups(resp.work_groups.map((g: any) => g.t_grupo_trabajo[0]));
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudieron cargar sus grupos." });
    } finally {
      setIsLoadingGroups(false);
    }
  }

  function handleInternalsKeyUp(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === " ") {
      setForm((prev) => ({ ...prev, internals: prev.internals + "/ " }));
    }
  }

  function dismiss() {
    setTypeOrg("Departamento de");
    setForm({ departament: "", email: "", internals: "" });
    setTouched({});
    setSelectedGroup("");
    onHide();
  }

  async function generateQR() {
    setTouched({ departament: true, email: true, internals: true });
    const errors = validateQrForm(form);
    if (Object.keys(errors).length > 0 || isLoadingSave) return;

    onChangeQR({ departament: form.departament, email: form.email, internals: form.internals, typeOrgasnization: typeOrg });

    setIsLoadingGenerate(true);
    setTimeout(async () => {
      try {
        const canvas = qrCanvasRef.current;
        if (!canvas) { setIsLoadingGenerate(false); return; }
        const domtoimage = (await import("dom-to-image-more")).default;
        const dataUrl = await domtoimage.toPng(canvas);
        const html = buildSignatureHtml(typeOrg, form.departament, form.email, form.internals, dataUrl);

        const link = document.createElement("a");
        link.href = "data:application/html," + encodeURIComponent(html);
        link.download = `${form.departament}-qr-firma.html`;
        link.click();

        toast.current?.show({ severity: "success", summary: "Firma creada con éxito." });
        dismiss();
      } catch {
        toast.current?.show({ severity: "error", summary: "Hubo un error en la creación de la firma." });
      } finally {
        setIsLoadingGenerate(false);
      }
    }, 1000);
  }

  async function saveQR() {
    if (isLoadingGenerate || isLoadingSave) return;
    setTouched({ departament: true, email: true, internals: true });
    const errors = validateQrForm(form);
    if (Object.keys(errors).length > 0 || !selectedGroup) return;

    setIsLoadingSave(true);
    setTimeout(async () => {
      try {
        const canvas = qrCanvasRef.current;
        if (!canvas) { setIsLoadingSave(false); return; }
        const domtoimage = (await import("dom-to-image-more")).default;
        const dataUrl = await domtoimage.toPng(canvas);
        const html = buildSignatureHtml(typeOrg, form.departament, form.email, form.internals, dataUrl);
        const file = new Blob([html], { type: "text/html" });
        await saveGroupQR(selectedGroup, file);
        toast.current?.show({ severity: "success", summary: "Firma guardada con éxito." });
        dismiss();
      } catch {
        toast.current?.show({ severity: "error", summary: "Hubo un error para guardar la firma." });
      } finally {
        setIsLoadingSave(false);
      }
    }, 1000);
  }

  const errors = validateQrForm(form);
  const isFormInvalid = Object.keys(errors).length > 0;
  const isWorking = isLoadingGenerate || isLoadingSave;

  const footer = (
    <div>
      <div className="qr-info-block mb-3">
        <div className="qr-info-item">
          <span className="qr-info-icon qr-info-icon--primary"><i className="pi pi-save" /></span>
          <span className="qr-info-text"><b>Guardar</b> — actualiza el QR de notificaciones externas en Chasqui</span>
        </div>
        <div className="qr-info-item">
          <span className="qr-info-icon qr-info-icon--info"><i className="pi pi-download" /></span>
          <span className="qr-info-text"><b>Descargar</b> — descarga la firma en HTML para importarla en Thunderbird</span>
        </div>
      </div>

      <div className="d-flex align-items-center" style={{ gap: "8px" }}>
        <button
          onClick={saveQR}
          disabled={isWorking || isFormInvalid || !selectedGroup}
          type="button"
          className="btn btn-primary d-flex align-items-center"
          style={{ gap: "6px" }}
          title={!selectedGroup ? "Seleccioná un grupo primero" : "Actualiza el QR para notificaciones externas en Chasqui"}
        >
          <i className={isLoadingSave ? "pi pi-spin pi-spinner" : "pi pi-save"} />
          {isLoadingSave ? "Guardando..." : "Guardar"}
        </button>

        <button
          onClick={generateQR}
          disabled={isWorking || isFormInvalid}
          type="button"
          className="btn btn-info d-flex align-items-center"
          style={{ gap: "6px" }}
          title="Descarga la firma en HTML para importarla en Thunderbird"
        >
          <i className={isLoadingGenerate ? "pi pi-spin pi-spinner" : "pi pi-download"} />
          {isLoadingGenerate ? "Descargando..." : "Descargar"}
        </button>

        <button
          disabled={isWorking}
          type="button"
          className="btn text-muted ml-auto"
          onClick={dismiss}
        >
          Volver
        </button>
      </div>
    </div>
  );

  return (
    <>
      <Toast ref={toast} position="bottom-center" />

      <Dialog
        visible={isShow}
        style={{ width: "min(760px, 92vw)" }}
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        modal
        onHide={dismiss}
        footer={footer}
      >
        {isLoadingGroups ? (
          <div className="py-3">
            <ProgressBar mode="indeterminate" style={{ height: "6px" }} />
            <p className="text-muted text-center mt-3 mb-0" style={{ fontSize: "0.85rem" }}>
              Cargando grupos...
            </p>
          </div>
        ) : (
          <div className="animated fadeIn">

            {/* Datos del área */}
            <div className="mb-4">
              <div className="d-flex align-items-center mb-3" style={{ gap: "8px" }}>
                <div style={{ width: 28, height: 28, borderRadius: "8px", background: "#eef1ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className="pi pi-pencil" style={{ color: "#4a6cf7", fontSize: "0.8rem" }} />
                </div>
                <p className="mb-0 font-weight-bold" style={{ fontSize: "0.88rem", color: "#2f3d4a" }}>Datos del área</p>
              </div>

              <div className="row">
                {/* Departamento */}
                <div className="col-12 form-group">
                  <label className={touched.departament && errors.departament ? "text-danger" : ""}>
                    Nombre del área
                  </label>
                  <div className="input-group">
                    <div className="input-group-prepend">
                      <select
                        className="form-select"
                        value={typeOrg}
                        onChange={(e) => setTypeOrg(e.target.value)}
                        disabled={isLoadingGenerate}
                        style={{ background: "#f4f4f4", borderRadius: "4px 0 0 4px" }}
                      >
                        <option value="Departamento de">Departamento de</option>
                        <option value="Área de">Área de</option>
                        <option value="Dirección de">Dirección de</option>
                        <option value="Subdirección de">Subdirección de</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      className="form-control form-control-line"
                      value={form.departament}
                      onChange={(e) => setForm((p) => ({ ...p, departament: e.target.value }))}
                      onBlur={() => setTouched((p) => ({ ...p, departament: true }))}
                      autoComplete="off"
                      disabled={isLoadingGenerate}
                    />
                  </div>
                  {touched.departament && errors.departament && (
                    <small className="text-danger animated fadeIn">{errors.departament}</small>
                  )}
                </div>

                {/* Email */}
                <div className="col-12 form-group">
                  <label className={touched.email && errors.email ? "text-danger" : ""}>
                    Correo institucional
                  </label>
                  <div className="input-group">
                    
                    <input
                      type="text"
                      className="form-control form-control-line"
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                      autoComplete="off"
                      disabled={isLoadingGenerate}
                    />
                    <div className="input-group-append">
                      <span className="input-group-text" style={{ fontSize: "0.82rem", color: "#666" }}>
                        @tribcuentasrionegro.gov.ar
                      </span>
                    </div>
                  </div>
                  {touched.email && errors.email && (
                    <small className="text-danger animated fadeIn">{errors.email}</small>
                  )}
                </div>

                {/* Internos */}
                <div className="col-12 form-group">
                  <label className={touched.internals && errors.internals ? "text-danger" : ""}>
                    Internos
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-line"
                    placeholder="Ej: 100 / 101"
                    value={form.internals}
                    onChange={(e) => setForm((p) => ({ ...p, internals: e.target.value }))}
                    onBlur={() => setTouched((p) => ({ ...p, internals: true }))}
                    onKeyUp={handleInternalsKeyUp}
                    autoComplete="off"
                    disabled={isLoadingGenerate}
                  />
                  {touched.internals && errors.internals && (
                    <small className="text-danger animated fadeIn">{errors.internals}</small>
                  )}
                  <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                    Presioná espacio para agregar otro interno (Ej: 100/ 101)
                  </small>
                </div>
              </div>
            </div>

            {/* Guardar en grupo */}
            <div>
              <div className="d-flex align-items-center mb-3" style={{ gap: "8px" }}>
                <div style={{ width: 28, height: 28, borderRadius: "8px", background: "#fff4e6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className="pi pi-users" style={{ color: "#fd7e14", fontSize: "0.8rem" }} />
                </div>
                <div>
                  <p className="mb-0 font-weight-bold" style={{ fontSize: "0.88rem", color: "#2f3d4a" }}>
                    Guardar en grupo
                    <span className="ml-2" style={{ fontSize: "0.72rem", fontWeight: 400, color: "#aaa" }}>(opcional para descargar)</span>
                  </p>
                </div>
              </div>

              <div className="row">
                <div className="col-12 col-md-6 form-group mb-0">
                  <label>Grupo de trabajo</label>
                  <select
                    className="form-control"
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    disabled={isLoadingGenerate || groups.length === 0}
                  >
                    <option value="">— Seleccionar grupo —</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>{g.descripcion}</option>
                    ))}
                  </select>
                  {groups.length === 0 && (
                    <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                      No tenés grupos asignados.
                    </small>
                  )}
                  {!selectedGroup && (
                    <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                      Requerido para usar "Guardar".
                    </small>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}
      </Dialog>
    </>
  );
}
