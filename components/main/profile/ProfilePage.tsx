"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";
import ModalBosses from "./ModalBosses";
import QrDepartament from "./QrDepartament";
import { getDataUser, modificateProfileUser, saveImageProfile } from "@/lib/services/perfil.service";

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  return (
    <span
      style={{ display: "block" }}
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

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

const LOGO_BASE64 =
  "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";

interface ProfileForm {
  name: string;
  lastname: string;
  datebirth: string;
  cuil: string;
  email: string;
  occupation: string;
  location: string;
  internal: string;
}

interface FormErrors {
  name?: string;
  lastname?: string;
  datebirth?: string;
  email?: string;
  occupation?: string;
  location?: string;
}

function validateForm(f: ProfileForm): FormErrors {
  const errors: FormErrors = {};
  if (!f.name) errors.name = "* Campo obligatorio";
  else if (f.name.length > 25) errors.name = "* El nombre debe tener menos de 25 caracteres";
  else if (!/^[a-zA-ZÀ-ÿ ]*$/.test(f.name)) errors.name = "* Ingrese un nombre válido";

  if (!f.lastname) errors.lastname = "* Campo obligatorio";
  else if (f.lastname.length > 35) errors.lastname = "* El apellido debe tener menos de 35 caracteres";
  else if (!/^[a-zA-ZÀ-ÿ ]*$/.test(f.lastname)) errors.lastname = "* Ingrese un apellido válido";

  if (!f.datebirth) errors.datebirth = "* Campo obligatorio";

  if (!f.email) errors.email = "* Campo obligatorio";
  else if (f.email.length > 50) errors.email = "* El email debe tener menos de 50 caracteres";
  else if (!/^[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$/.test(f.email)) errors.email = "* Ingrese un email válido";

  if (!f.occupation) errors.occupation = "* Campo obligatorio";
  else if (f.occupation.length > 85) errors.occupation = "* Caracteres máximos 85";

  if (!f.location) errors.location = "* Campo obligatorio";
  else if (f.location.length > 35) errors.location = "* Caracteres máximos 35";

  return errors;
}

function buildVCard(data: { first_name: string; last_name: string; occupation_signature: string; location_signature: string; email: string; internal: string }): string {
  return `BEGIN:VCARD\nVERSION:4.0\nN:${data.last_name};${data.first_name};\nFN:${data.last_name} ${data.first_name}\nORG:${data.location_signature}\nTITLE:${data.occupation_signature}\nADR;TYPE=WORK;PREF=1:;;Moreno 263;Viedma;;;Argentina\nTEL;TYPE=WORK,voice;VALUE=uri:2920421500\nEMAIL;TYPE=WORK:${data.email}\nNOTE:Interno ${data.internal}\nEND:VCARD`;
}

const READ_ONLY_BADGE = (
  <span style={{ fontSize: "0.65rem", background: "#f1f5f9", color: "#94a3b8", borderRadius: "20px", padding: "1px 7px", display: "inline-flex", alignItems: "center", gap: "3px", verticalAlign: "middle" }}>
    <i className="pi pi-lock" style={{ fontSize: "0.58rem" }} /> Solo lectura
  </span>
);

function CardSectionHeader({ icon, iconBg, iconColor, title, subtitle, action }: { icon: string; iconBg: string; iconColor: string; title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <>
      <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
        <div style={{ width: 38, height: 38, borderRadius: "11px", background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <i className={icon} style={{ color: iconColor, fontSize: "1rem" }} />
        </div>
        <div className="flex-grow-1">
          <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>{title}</h5>
          <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{subtitle}</small>
        </div>
        {action}
      </div>
      <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />
    </>
  );
}

function FieldSkeleton() {
  return (
    <div className="mb-3">
      <div className="profile-skeleton-label" />
      <div className="profile-skeleton-input" />
    </div>
  );
}

export default function ProfilePage() {
  const toast = useRef<Toast>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [form, setForm] = useState<ProfileForm>({ name: "", lastname: "", datebirth: "", cuil: "", email: "", occupation: "", location: "", internal: "" });
  const [touched, setTouched] = useState<Partial<Record<keyof ProfileForm, boolean>>>({});
  const [loading, setLoading] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [showModalBosses, setShowModalBosses] = useState(false);
  const [isOpenDialogQR, setIsOpenDialogQR] = useState(false);
  const [qrValue, setQrValue] = useState("");
  const [loadingActionQr, setLoadingActionQr] = useState(false);
  const [bosses, setBossesState] = useState<any[]>([]);
  const [copiedField, setCopiedField] = useState<"email" | "internal" | null>(null);

  function handleCopy(value: string, field: "email" | "internal") {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  }

  useEffect(() => { chargeUser(); }, []);

  useEffect(() => {
    if (!qrValue || !qrCanvasRef.current) return;
    import("qrcode").then((QR) => {
      QR.toCanvas(qrCanvasRef.current!, qrValue, { width: 150 }, (err) => { if (err) console.error(err); });
    });
  }, [qrValue]);

  async function chargeUser() {
    setLoadingUser(true);
    try {
      const resp = await getDataUser();
      const normalizedBosses = (resp.bosses ?? []).map((b: any) => ({
        cuil: b.people?.cuil ?? b.cuil,
        lastname_name: b.people?.lastname_name ?? b.lastname_name,
        people: b.people ?? b,
      }));
      const enrichedUser = { ...resp, bosses: normalizedBosses };
      setUser(enrichedUser);
      setBossesState(normalizedBosses);
      localStorage.setItem("user", resp.cuil);
      setForm({ name: resp.first_name ?? "", lastname: resp.last_name ?? "", datebirth: resp.datebirth ?? "", cuil: resp.cuil ?? "", email: resp.email ?? "", occupation: resp.occupation_signature ?? "", location: resp.location_signature ?? "", internal: resp.internal ?? "" });
      setQrValue(buildVCard(resp));
    } catch {
      toast.current?.show({ severity: "error", summary: "Error al cargar el perfil." });
    } finally {
      setLoadingUser(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ name: true, lastname: true, datebirth: true, email: true, occupation: true, location: true });
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) return;
    setLoading(true);
    try {
      await modificateProfileUser({ first_name: form.name, last_name: form.lastname, datebirth: form.datebirth, email: form.email, occupation_signature: form.occupation, location_signature: form.location });
      setQrValue(buildVCard({ first_name: form.name, last_name: form.lastname, occupation_signature: form.occupation, location_signature: form.location, email: form.email, internal: form.internal }));
      setUser((prev: any) => ({ ...prev, first_name: form.name, last_name: form.lastname, occupation_signature: form.occupation }));
      toast.current?.show({ severity: "success", summary: "Perfil modificado" });
    } catch {
      toast.current?.show({ severity: "error", summary: "Error al intentar modificar perfil" });
    } finally {
      setLoading(false);
    }
  }

  async function handleAvatarDirectUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.current?.show({ severity: "info", summary: `El archivo ${file.name} no es una imagen válida.` });
      return;
    }
    setIsLoadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file, file.name);
      const resp = await saveImageProfile(formData);
      setUser((prev: any) => ({ ...prev, avatar: resp.avatar }));
      toast.current?.show({ severity: "success", summary: "Imagen de perfil actualizada." });
    } catch {
      toast.current?.show({ severity: "error", summary: "Hubo un error al subir la imagen." });
    } finally {
      setIsLoadingImage(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  async function downloadFirm() {
    setLoadingActionQr(true);
    try {
      const canvas = qrCanvasRef.current;
      if (!canvas) return;
      const domtoimage = (await import("dom-to-image-more")).default;
      const dataUrl = await domtoimage.toPng(canvas);
      const html = `<!doctype html><html lang='es'><head><meta charset='utf-8'><title>Firma de ${user.first_name} ${user.last_name}</title><base href='/'><meta name='viewport' content='width=device-width, initial-scale=1'></head><body><table class='email-signature' style='font-family:Montserrat;width: 100%;background-color: #657185;font-size: 0.8em; padding-left:3.25px; padding-right:3.25px;'><tr><td style='padding: 1px;vertical-align: middle;color: #ededed; width: 6%; min-width: 90px;'><img src='data:image/png;base64,${LOGO_BASE64}' alt='logo TCRN' style='width: 100%;max-width: 110px; min-width: 65px;'></td><td style='padding: 8px;vertical-align: middle;color: #ededed;'><div class='name' style='font-size: 1em;font-weight: bold;'>${user.first_name} ${user.last_name}</div><div class='title' style='font-size: 0.9em;color: #ededed;'>${user.occupation_signature ?? form.occupation}</div><div><a href='mailto:${user.email ?? form.email}' class='mailto' style='color: #ededed;text-decoration: none;'>${user.email ?? form.email}</a></div><div>02920 421500 - Int. ${user.internal ?? form.internal}</div><div><a href='https://www.tribcuentasrionegro.gov.ar' target='_blank' style='color: #ededed;text-decoration: none;'>www.tribcuentasrionegro.gov.ar</a></div><div style='color: #ededed;'>Moreno 263 - Viedma - Río Negro</div></td><td class='qr-code' style='padding: 8px;vertical-align: middle;color: #ededed; text-align: right;'><img src='${dataUrl}' alt='Código QR' style='display: inline-block;max-width: 125px !important;width: 100%;height: auto;min-width: 65px;'></td></tr></table></div></body></html>`;
      const link = document.createElement("a");
      link.setAttribute("href", "data:application/html," + encodeURIComponent(html));
      link.setAttribute("download", `${user.first_name}_${user.last_name}-firma.html`);
      link.click();
    } catch {
      toast.current?.show({ severity: "error", summary: "Error al generar la firma." });
    } finally {
      setLoadingActionQr(false);
    }
  }

  function handleChangeQRForDepartament(data: { departament: string; email: string; internals: string; typeOrgasnization: string }) {
    setQrValue(`BEGIN:VCARD\nVERSION:4.0\nN:${data.departament};\nFN:${data.typeOrgasnization} ${data.departament}\nADR;TYPE=WORK;PREF=1:;;Moreno 263;Viedma;;;Argentina\nTEL;TYPE=WORK,voice;VALUE=uri:2920421500\nEMAIL;TYPE=WORK:${data.email}@tribcuentasrionegro.gov.ar\nNOTE:Interno/s ${data.internals}\nEND:VCARD`);
  }

  function handleCloseQRDialog() {
    setIsOpenDialogQR(false);
    if (user) setQrValue(buildVCard(user));
  }

  function handleBossesAssigned(newBosses: any[]) {
    const wrapped = newBosses.map((b) => ({ ...b, people: b }));
    setBossesState(newBosses);
    setUser((prev: any) => ({ ...prev, bosses: wrapped }));
    setShowModalBosses(false);
  }

  const errors = validateForm(form);
  const initials = ((user?.first_name?.[0] ?? "") + (user?.last_name?.[0] ?? "")).toUpperCase();

  return (
    <>
      <Toast ref={toast} position="bottom-center" />
      <canvas ref={qrCanvasRef} style={{ position: "absolute", left: "-500px", top: 0 }} />

      <div className="fadeIn animated">
        <div className="row">

          {/* ── Left column ── */}
          <div className="col-lg-4 col-xlg-3 col-md-5">

            {/* Avatar + identity */}
            <div className="card profile-card">
              <div className="card-body pb-3">
                {loadingUser ? (
                  <div className="text-center py-3 fadeIn animated">
                    <div className="skeleton-circle mx-auto mb-3" />
                    <div className="skeleton-btn mx-auto mb-2" style={{ width: "55%", height: 18 }} />
                    <div className="skeleton-btn mx-auto mb-3" style={{ width: "40%", height: 14 }} />
                    <div className="skeleton-btn mx-auto mb-2" style={{ height: 36 }} />
                    <div className="skeleton-btn mx-auto" style={{ height: 36 }} />
                  </div>
                ) : (
                  <div className="text-center">
                    {/* Avatar */}
                    <div
                      className="img-profile-wrapper mb-3 mx-auto"
                      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                      onClick={() => !isLoadingImage && avatarInputRef.current?.click()}
                    >
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        style={{ display: "none" }}
                        onChange={(e) => { const file = e.target.files?.[0]; if (file) handleAvatarDirectUpload(file); }}
                      />
                      {user?.avatar ? (
                        <img className="img-profile rounded-circle" src={`${API_URL}${user.avatar}`} alt="avatar" />
                      ) : (
                        <div
                          className="img-profile rounded-circle d-flex align-items-center justify-content-center"
                          style={{ background: "linear-gradient(135deg, #4a6cf7 0%, #6a8aff 100%)", color: "#fff", fontSize: "2.8rem", fontWeight: 700, letterSpacing: "-1px" }}
                        >
                          {initials || <i className="mdi mdi-account" style={{ fontSize: "3rem" }} />}
                        </div>
                      )}
                      <div className="img-profile-overlay">
                        {isLoadingImage
                          ? <i className="pi pi-spin pi-spinner" style={{ fontSize: "1.6rem" }} />
                          : <><i className="pi pi-camera mb-1" style={{ fontSize: "1.4rem" }} />Cambiar foto</>}
                      </div>
                    </div>

                    {/* Name + función */}
                    {(user?.first_name || user?.last_name) && (
                      <div className="mb-3">
                        <p className="mb-1 font-weight-bold" style={{ fontSize: "1.05rem", color: "#1e293b", lineHeight: 1.3 }}>
                          {user.first_name} {user.last_name}
                        </p>
                        {user.occupation_signature && (
                          <span style={{ fontSize: "0.78rem", color: "#64748b", background: "#f1f5f9", borderRadius: "20px", padding: "2px 10px" }}>
                            {user.occupation_signature}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Contact chips */}
                    <div className="text-left" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {user?.email && (
                        <Tooltip label="Copiar correo">
                          <div
                            className="qr-info-item w-100"
                            style={{ borderLeftColor: "#4a6cf7", cursor: "pointer", borderRadius: "10px" }}
                            onClick={() => handleCopy(user.email, "email")}
                          >
                            <span className="qr-info-icon qr-info-icon--primary"><i className="pi pi-envelope" /></span>
                            <span className="qr-info-text flex-grow-1" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</span>
                            <i className={copiedField === "email" ? "pi pi-check" : "pi pi-copy"} style={{ fontSize: "0.85rem", color: copiedField === "email" ? "#28a745" : "#aaa", flexShrink: 0, transition: "color 0.2s" }} />
                          </div>
                        </Tooltip>
                      )}
                      {user?.internal && (
                        <Tooltip label="Copiar interno">
                          <div
                            className="qr-info-item w-100"
                            style={{ borderLeftColor: "#4a6cf7", cursor: "pointer", borderRadius: "10px" }}
                            onClick={() => handleCopy(user.internal, "internal")}
                          >
                            <span className="qr-info-icon qr-info-icon--primary"><i className="pi pi-phone" /></span>
                            <span className="qr-info-text flex-grow-1">{user.internal}</span>
                            <i className={copiedField === "internal" ? "pi pi-check" : "pi pi-copy"} style={{ fontSize: "0.85rem", color: copiedField === "internal" ? "#28a745" : "#aaa", flexShrink: 0, transition: "color 0.2s" }} />
                          </div>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* QR actions */}
            {!loadingUser && (
              <div className="card profile-card">
                <div className="card-body">
                  <p style={{ margin: "0 0 12px", fontSize: "0.69rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8" }}>
                    Acciones QR
                  </p>
                  <div className="d-flex" style={{ gap: "10px" }}>
                    <div className={`qr-action-card${loadingActionQr ? " disabled" : ""}`} onClick={() => !loadingActionQr && downloadFirm()}>
                      <div className="qr-action-icon">
                        <i className={loadingActionQr ? "pi pi-spin pi-spinner" : "fa fa-qrcode"} style={{ fontSize: "1.4rem" }} />
                      </div>
                      <p className="qr-action-label">{loadingActionQr ? "Descargando..." : "QR personal"}</p>
                      <span style={{ fontSize: "0.7rem", color: "#94a3b8", textAlign: "center", lineHeight: 1.3 }}>Descargá tu firma con QR</span>
                    </div>
                    <div className="qr-action-card" onClick={() => setIsOpenDialogQR(true)}>
                      <div className="qr-action-icon">
                        <i className="fa fa-qrcode" style={{ fontSize: "1.4rem" }} />
                      </div>
                      <p className="qr-action-label">QR área</p>
                      <span style={{ fontSize: "0.7rem", color: "#94a3b8", textAlign: "center", lineHeight: 1.3 }}>Ver QR de tu área</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Right column ── */}
          <div className="col-lg-8 col-xlg-9 col-md-7">

            {/* Datos del legajo (personal + laboral unificados) */}
            <div className="card profile-card">
              <CardSectionHeader
                icon="pi pi-id-card"
                iconBg="#eef1ff"
                iconColor="#4a6cf7"
                title="Datos del Legajo"
                subtitle="Información personal y laboral"
                action={
                  !loadingUser ? (
                    <button
                      form="profile-form"
                      type="submit"
                      disabled={Object.keys(errors).length > 0 || loading}
                      className="btn btn-primary btn-sm d-flex align-items-center"
                      style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.82rem" }}
                    >
                      <i className={loading ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
                      {loading ? "Guardando..." : "Guardar"}
                    </button>
                  ) : undefined
                }
              />
              <div className="card-body" style={{ padding: "16px 20px 20px" }}>
                {loadingUser ? (
                  <div className="row">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="col-12 col-md-6"><FieldSkeleton /></div>
                    ))}
                  </div>
                ) : (
                  <form id="profile-form" onSubmit={handleSaveProfile} noValidate>

                    {/* Sub-section: Personal */}
                    <p className="profile-section-sub">Información Personal</p>
                    <div className="row">
                      <div className="col-12 col-md-6 mb-3">
                        <label className={`profile-field-label${touched.name && errors.name ? " text-danger" : ""}`}>Nombre/s</label>
                        <input
                          className="profile-input"
                          value={form.name}
                          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                          onBlur={() => setTouched((p) => ({ ...p, name: true }))}
                          autoComplete="off"
                          disabled={loading}
                        />
                        {touched.name && errors.name && <small className="text-danger animated fadeIn" style={{ fontSize: "0.73rem", marginTop: "4px", display: "block" }}>{errors.name}</small>}
                      </div>
                      <div className="col-12 col-md-6 mb-3">
                        <label className={`profile-field-label${touched.lastname && errors.lastname ? " text-danger" : ""}`}>Apellido/s</label>
                        <input
                          className="profile-input"
                          value={form.lastname}
                          onChange={(e) => setForm((p) => ({ ...p, lastname: e.target.value }))}
                          onBlur={() => setTouched((p) => ({ ...p, lastname: true }))}
                          autoComplete="off"
                          disabled={loading}
                        />
                        {touched.lastname && errors.lastname && <small className="text-danger animated fadeIn" style={{ fontSize: "0.73rem", marginTop: "4px", display: "block" }}>{errors.lastname}</small>}
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-12 col-md-6 mb-3">
                        <label className={`profile-field-label${touched.datebirth && errors.datebirth ? " text-danger" : ""}`}>Fecha de nacimiento</label>
                        <input
                          type="date"
                          max="2003-01-01"
                          min="1950-01-01"
                          className="profile-input"
                          value={form.datebirth}
                          onChange={(e) => setForm((p) => ({ ...p, datebirth: e.target.value }))}
                          onBlur={() => setTouched((p) => ({ ...p, datebirth: true }))}
                          disabled={loading}
                        />
                        {touched.datebirth && errors.datebirth && <small className="text-danger animated fadeIn" style={{ fontSize: "0.73rem", marginTop: "4px", display: "block" }}>{errors.datebirth}</small>}
                      </div>
                      <div className="col-12 col-md-6 mb-3">
                        <label className="profile-field-label">CUIL {READ_ONLY_BADGE}</label>
                        <input className="profile-input" value={form.cuil} disabled autoComplete="off" />
                      </div>
                    </div>

                    {/* Divider */}
                    <hr style={{ borderColor: "rgba(0,0,0,0.05)", margin: "4px 0 0" }} />

                    {/* Sub-section: Laboral */}
                    <p className="profile-section-sub">Información Laboral</p>
                    <div className="row">
                      <div className="col-12 col-md-6 mb-3">
                        <label className="profile-field-label">Lugar {READ_ONLY_BADGE}</label>
                        <input className="profile-input" value={form.location} disabled autoComplete="off" />
                      </div>
                      <div className="col-12 col-md-6 mb-3">
                        <label className="profile-field-label">Legajo {READ_ONLY_BADGE}</label>
                        <input className="profile-input" value={form.internal} disabled autoComplete="off" />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-12 col-md-6 mb-3">
                        <label className={`profile-field-label${touched.occupation && errors.occupation ? " text-danger" : ""}`}>Función</label>
                        <input
                          className="profile-input"
                          value={form.occupation}
                          onChange={(e) => setForm((p) => ({ ...p, occupation: e.target.value }))}
                          onBlur={() => setTouched((p) => ({ ...p, occupation: true }))}
                          autoComplete="off"
                          disabled={loading}
                        />
                        {touched.occupation && errors.occupation && <small className="text-danger animated fadeIn" style={{ fontSize: "0.73rem", marginTop: "4px", display: "block" }}>{errors.occupation}</small>}
                      </div>
                    </div>

                    {loading && (
                      <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} />
                    )}
                  </form>
                )}
              </div>
            </div>

            {/* Jefes */}
            <div className={`card profile-card${!loadingUser && bosses.length === 0 ? " profile-card--warning" : ""}`}>
              <CardSectionHeader
                icon="pi pi-users"
                iconBg="#fff4e6"
                iconColor="#fd7e14"
                title="Jefes"
                subtitle="Quién aprueba tus solicitudes de salida"
                action={
                  !loadingUser ? (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm d-flex align-items-center"
                      style={{ gap: "5px", flexShrink: 0, fontSize: "0.82rem", borderRadius: "8px", fontWeight: 600 }}
                      onClick={() => setShowModalBosses(true)}
                    >
                      <i className="pi pi-pencil" style={{ fontSize: "0.75rem" }} />
                      Modificar
                    </button>
                  ) : undefined
                }
              />
              <div className="card-body" style={{ padding: "16px 20px 20px" }}>
                {loadingUser ? (
                  <ProgressBar mode="indeterminate" style={{ height: "4px" }} />
                ) : (
                  <div className="fadeIn animated">
                    {bosses.length === 0 ? (
                      <div className="text-center py-3">
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#fff4e6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                          <i className="pi pi-exclamation-triangle" style={{ color: "#fd7e14", fontSize: "1.2rem" }} />
                        </div>
                        <p className="mb-1 font-weight-bold" style={{ fontSize: "0.9rem", color: "#2f3d4a" }}>Debés seleccionar tus jefes</p>
                        <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginBottom: "14px" }}>Aún no tenés jefes asignados.</p>
                        <button type="button" className="btn btn-sm btn-primary" style={{ borderRadius: "8px", fontWeight: 600 }} onClick={() => setShowModalBosses(true)}>
                          <i className="pi pi-plus mr-1" style={{ fontSize: "0.75rem" }} />
                          Seleccionar ahora
                        </button>
                      </div>
                    ) : (
                      <div className="d-flex flex-wrap" style={{ gap: "8px", marginBottom: "14px" }}>
                        {bosses.map((boss) => (
                          <div key={boss.cuil} className="profile-boss-chip">
                            <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(74,108,247,0.15)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, color: "#4a6cf7" }}>
                              {(boss.people?.lastname_name ?? boss.lastname_name ?? "?")[0]}
                            </span>
                            {boss.people?.lastname_name ?? boss.lastname_name}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="qr-info-item" style={{ borderLeftColor: "#17a2b8", borderRadius: "10px" }}>
                      <span className="qr-info-icon qr-info-icon--info"><i className="pi pi-info-circle" /></span>
                      <span className="qr-info-text">Sus jefes son quienes aprueban o rechazan sus solicitudes de salida. Si no asignó uno, las solicitudes irán al Subdirector de Personal por defecto.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      <ModalBosses show={showModalBosses} user={user} onHide={() => setShowModalBosses(false)} onBossesAssigned={handleBossesAssigned} />
      <QrDepartament isShow={isOpenDialogQR} qrCanvasRef={qrCanvasRef} onHide={handleCloseQRDialog} onChangeQR={handleChangeQRForDepartament} />
    </>
  );
}