"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { ProgressBar } from "primereact/progressbar";
import { whitenKey } from "@/lib/services/whiten-key.service";

const FIXED_TOKEN = "Qf6uN410hVaQf26udkBaBDsW2GqtQcud6Fp51v1XZIHPVxvc7Q6dnl5zHaK8Wc0cCCKPxhrFRRX";

interface Rules {
  minLength: boolean;
  minLowerCase: boolean;
  minNumbers: boolean;
  minUpperCase: boolean;
}

function RuleItem({ met, children }: { met: boolean; children: React.ReactNode }) {
  return (
    <li
      className="d-flex align-items-center"
      style={{
        gap: "5px", padding: "3px 10px", borderRadius: "20px", fontSize: "0.76rem", fontWeight: met ? 600 : 500,
        color: met ? "#059669" : "#64748b", background: met ? "rgba(5,150,105,0.08)" : "#f1f5f9", whiteSpace: "nowrap",
      }}
    >
      <i className={`pi ${met ? "pi-check-circle" : "pi-circle"}`} style={{ fontSize: "0.72rem", flexShrink: 0 }} />
      {children}
    </li>
  );
}

export default function WhitenKeyPage() {
  const toast = useRef<Toast>(null);
  const [username, setUsername] = useState("");
  const [newpassword, setNewpassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touchedUser, setTouchedUser] = useState(false);
  const [touchedPass, setTouchedPass] = useState(false);
  const [rules, setRules] = useState<Rules>({ minLength: false, minLowerCase: false, minNumbers: false, minUpperCase: false });

  useEffect(() => {
    const email = localStorage.getItem("useremail") ?? "";
    const raw = email.split("@")[0];
    setUsername(raw.slice(1));
  }, []);

  function verifyRules(value: string) {
    setRules({
      minLength: value.length >= 7,
      minNumbers: /\d/.test(value),
      minUpperCase: /[A-Z]/.test(value),
      minLowerCase: /([a-z].*?[a-z])/.test(value),
    });
    setNewpassword(value);
  }

  const isFormValid = !!(username && newpassword && newpassword.length <= 30 && rules.minLength && rules.minLowerCase && rules.minUpperCase && rules.minNumbers);

  function limpiar() {
    setNewpassword("");
    setRules({ minLength: false, minLowerCase: false, minNumbers: false, minUpperCase: false });
    setTouchedPass(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouchedUser(true);
    setTouchedPass(true);
    if (!isFormValid) return;

    setLoading(true);
    try {
      const resp = await whitenKey({ username, newpassword, token: FIXED_TOKEN });
      if (resp.error === "False") {
        limpiar();
        toast.current?.show({ severity: "success", summary: resp.message });
      } else {
        toast.current?.show({ severity: "error", summary: resp.message });
      }
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudo blanquear la clave", detail: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />

      <div className="fadeIn animated">

        {/* Header card */}
        <div className="card profile-card">
          <div className="d-flex align-items-center px-3 pt-3 pb-3" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-lock" style={{ color: "#3b82f6", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Blanqueo de clave</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Restablecé la contraseña de acceso institucional</small>
            </div>
          </div>
        </div>

        {/* Form card */}
        <div className="card profile-card mt-4">
          <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-key" style={{ color: "#059669", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Nueva contraseña</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Completá los datos para blanquear la clave</small>
            </div>
          </div>
          <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />

          <div className="card-body" style={{ padding: "16px 20px 20px" }}>
            <form className="animated fadeIn" onSubmit={handleSubmit} noValidate>
              <div className="row">
                <div className="col-12 col-md-6 mb-3">
                  <label className={`profile-field-label${touchedUser && !username ? " text-danger" : ""}`}>Usuario</label>
                  <input
                    disabled={loading}
                    className="profile-input"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onBlur={() => setTouchedUser(true)}
                    autoComplete="off"
                  />
                  {touchedUser && !username && <small className="text-danger animated fadeIn" style={{ fontSize: "0.73rem", marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
                </div>

                <div className="col-12 col-md-6 mb-3">
                  <label className={`profile-field-label${touchedPass && (!newpassword || newpassword.length > 30) ? " text-danger" : ""}`}>Nueva contraseña</label>
                  <div style={{ position: "relative" }}>
                    <input
                      disabled={loading}
                      className="profile-input"
                      style={{ paddingRight: "38px" }}
                      type={showPassword ? "text" : "password"}
                      value={newpassword}
                      onChange={(e) => verifyRules(e.target.value)}
                      onBlur={() => setTouchedPass(true)}
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      aria-pressed={showPassword}
                      style={{
                        position: "absolute", right: "9px", top: "50%", transform: "translateY(-50%)",
                        background: "none", border: "none", borderRadius: "6px", padding: "4px",
                        color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center",
                      }}
                    >
                      <i className={`pi ${showPassword ? "pi-eye-slash" : "pi-eye"}`} />
                    </button>
                  </div>
                  {touchedPass && !newpassword && <small className="text-danger animated fadeIn" style={{ fontSize: "0.73rem", marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
                  {touchedPass && newpassword.length > 30 && <small className="text-danger animated fadeIn" style={{ fontSize: "0.73rem", marginTop: "4px", display: "block" }}>* Hasta 30 caracteres</small>}
                  <ul className="mb-0 mt-2" style={{ listStyle: "none", padding: 0, display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    <RuleItem met={rules.minLength}>Al menos 7 caracteres</RuleItem>
                    <RuleItem met={rules.minLowerCase}>Al menos 2 minúsculas</RuleItem>
                    <RuleItem met={rules.minUpperCase}>Al menos 1 mayúscula</RuleItem>
                    <RuleItem met={rules.minNumbers}>Al menos 1 número</RuleItem>
                  </ul>
                </div>
              </div>

              <div className="d-flex align-items-center mt-2" style={{ gap: "8px" }}>
                <button
                  disabled={loading || !isFormValid}
                  type="submit"
                  className="btn btn-primary d-flex align-items-center"
                  style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
                >
                  <i className={loading ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
                  {loading ? "Blanqueando..." : "Blanquear contraseña"}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={limpiar}
                  className="btn btn-light text-muted ml-auto"
                  style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
                >
                  Limpiar
                </button>
              </div>

              {loading && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
            </form>
          </div>
        </div>

        {/* Info card */}
        <div className="card profile-card mt-4">
          <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-info-circle" style={{ color: "#3b82f6", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Información importante</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Tené en cuenta lo siguiente</small>
            </div>
          </div>
          <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />

          <div className="card-body" style={{ padding: "16px 20px 20px" }}>
            <div className="qr-info-block">
              <div className="qr-info-item" style={{ borderLeftColor: "#4a6cf7" }}>
                <span className="qr-info-icon qr-info-icon--primary"><i className="pi pi-info-circle" /></span>
                <span className="qr-info-text">El cambio de contraseña se verá reflejado en: <strong style={{ fontWeight: 700 }}>PC personal, correo institucional, Workflow, Intranet, Chasqui y Ebla</strong>.</span>
              </div>
              <div className="qr-info-item" style={{ borderLeftColor: "#17a2b8" }}>
                <span className="qr-info-icon qr-info-icon--info"><i className="pi pi-shield" /></span>
                <span className="qr-info-text">Una contraseña larga, junto con combinación de letras y números, nos permite proteger nuestros datos.</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}