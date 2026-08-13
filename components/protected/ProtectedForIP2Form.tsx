"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { User, Building2, Users, Loader2, Check, LogOut } from "lucide-react";
import AppToast from "@/components/common/AppToast";
import { login } from "@/lib/services/auth.service";
import { getAllBossesForLegajo } from "@/lib/services/boss.service";
import { createWithLegajoTwo } from "@/lib/services/exits2.service";

interface FormState {
  file: string;
  "confirm-file": string;
  type: string;
  cuilBoss: string;
}

interface Boss {
  cuil: string;
  lastname_name: string;
  occupation_signature: string;
}

const EMPTY_FORM: FormState = { file: "", "confirm-file": "", type: "", cuilBoss: "" };

const EXIT_TYPES = [
  { value: "Individuals", label: "Particular", icon: User },
  { value: "Officials", label: "Oficial", icon: Building2 },
  { value: "Guild_Meeting_Attendance", label: "Asamblea", icon: Users },
];

export default function ProtectedForIP2Form() {
  const toast = useRef<Toast>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // ref keeps form values in sync for debounced callbacks without stale closures
  const formRef = useRef<FormState>({ ...EMPTY_FORM });

  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [bosses, setBosses] = useState<Boss[]>([]);
  const [isLoadingBosses, setIsLoadingBosses] = useState(false);
  const [isLoadingActionCreate, setIsLoadingActionCreate] = useState(false);

  useEffect(() => {
    loginForExitOrder();
    // Auto-refresh token every 6 hours (mirrors Angular's 21600000ms interval)
    const interval = setInterval(() => window.location.reload(), 21600000);
    return () => clearInterval(interval);
  }, []);

  async function loginForExitOrder() {
    try {
      const resp = await login({ username: "99999999999", password: "123456789" });
      localStorage.setItem("token-for-exit-order-logout", resp.access_token);
    } catch {
      // silent fail — same behavior as Angular
    }
  }

  function updateForm(field: keyof FormState, value: string) {
    formRef.current = { ...formRef.current, [field]: value };
    setForm({ ...formRef.current });
  }

  function resetForm() {
    formRef.current = { ...EMPTY_FORM };
    setForm({ ...EMPTY_FORM });
    setTouched({});
    setBosses([]);
  }

  function handleConfirmFileChange(value: string) {
    updateForm("confirm-file", value);

    if (value !== "") setIsLoadingBosses(true);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(chargeBosses, 1000);
  }

  function chargeBosses() {
    const { "confirm-file": confirmFile, file } = formRef.current;
    setBosses([]);

    const isNumeric = (v: string) => /^\d+$/.test(v);
    if (!isNumeric(file) || !isNumeric(confirmFile)) {
      setIsLoadingBosses(false);
      return;
    }

    if (confirmFile !== file) {
      setIsLoadingBosses(false);
      toast.current?.show({ severity: "info", summary: "Los legajos no son iguales" });
      return;
    }

    getAllBossesForLegajo(confirmFile)
      .then((resp: any) => {
        setIsLoadingBosses(false);
        const all: Boss[] = Object.values(resp.bosses);
        setBosses(
          all.filter(
            (b) => b.occupation_signature !== "Vocal" && b.occupation_signature !== "Presidente"
          )
        );
      })
      .catch(() => {
        setIsLoadingBosses(false);
        setBosses([]);
        toast.current?.show({ severity: "error", summary: "No se pudieron cargar los jefes" });
      });
  }

  function isFormValid() {
    const { file, "confirm-file": confirmFile, type, cuilBoss } = formRef.current;
    return file !== "" && confirmFile !== "" && type !== "" && cuilBoss !== "";
  }

  async function create() {
    setTouched({ file: true, "confirm-file": true, type: true, cuilBoss: true });

    if (!isFormValid()) return;

    const { "confirm-file": confirmFile, file } = formRef.current;
    if (file !== confirmFile) {
      toast.current?.show({ severity: "warn", summary: "Los legajos no son iguales" });
      return;
    }

    const { "confirm-file": _omit, ...formData } = formRef.current;
    setIsLoadingActionCreate(true);

    try {
      await createWithLegajoTwo(formData);
      toast.current?.show({ severity: "success", summary: "Solicitud de salida generada" });

      setTimeout(() => toast.current?.clear(), 4000);
      setTimeout(() => {
        setIsLoadingActionCreate(false);
        resetForm();
        window.location.reload();
      }, 4000);
    } catch (err: any) {
      setIsLoadingActionCreate(false);
      toast.current?.show({
        severity: "error",
        summary: "No se pudo crear la orden",
        detail: err?.message,
        life: 10000,
      });
    }
  }

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />

      <div className="align-items-center animated d-flex fadeIn row" style={{ minHeight: "100vh", backgroundColor: "#fff" }}>
        <div
          className="col-12 d-flex flex-column justify-content-center align-items-center text-center mb-3"
        >
          <img
            src="/img/trib-cuentas-escudo.png"
            alt="Logo Tribunal de Cuentas de Río Negro"
            width="90"
            height="90"
            className="mb-3"
          />
          <h1 style={{ margin: 0, marginBottom: "0.25rem", textAlign: "left", fontSize: "2.4rem", fontWeight: 700, color: "#1e293b" }}>Tribunal de Cuentas de Río Negro</h1>
          <h3 className="mb-0 mt-3" style={{ fontSize: "2.25rem", fontWeight: 700, color: "#6c757d" }}>Solicitud de salida</h3>
        </div>

        <div className="col-12">
          <div className="d-flex justify-content-center row">
            <div className="col-12">
              <div className="form-group text-center">
                <div className="d-flex justify-content-center flex-wrap" style={{ gap: "72px" }}>
                  {EXIT_TYPES.map(({ value, label, icon: Icon }) => (
                    <Button
                      key={value}
                      type="button"
                      unstyled
                      className={`exit-type-btn${form.type === value ? " exit-type-btn--active" : ""}`}
                      onClick={() => updateForm("type", value)}
                      style={{
                        padding: "16px 34px",
                        borderRadius: "12px",
                        border: "1.5px solid transparent",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: "1.15rem",
                        textTransform: "uppercase",
                        background: form.type === value ? "#0ea5e9" : "#e2e8f0",
                        color: form.type === value ? "#fff" : "#475569",
                        transition: "background 0.15s, color 0.15s, border-color 0.15s",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        minWidth: "380px",
                        justifyContent: "center",
                      }}
                    >
                      <Icon size={20} />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <Dialog
              header={
                <div className="d-flex align-items-center" style={{ gap: "12px" }}>
                  <div style={{ width: 38, height: 38, borderRadius: "11px", background: "rgba(14,165,233,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <LogOut size={18} color="#0ea5e9" />
                  </div>
                  <div>
                    <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Solicitud de salida</p>
                    <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Completá los datos para generar tu orden</small>
                  </div>
                </div>
              }
              visible={form.type !== ""}
              style={{ width: "50vw" }}
              contentStyle={{ background: "#fff" }}
              headerStyle={{ background: "#fff" }}
              draggable={false}
              resizable={false}
              closable={false}
              modal
              onHide={() => {}}
            >
              <div className="row">
                <div className="col-6">
                  <div className="form-group">
                    <label className="text-dark">LEGAJO</label>
                    <InputText
                      className="w-100"
                      inputMode="numeric"
                      value={form.file}
                      onChange={(e) => updateForm("file", e.target.value.replace(/\D/g, ""))}
                      onBlur={() => setTouched((prev) => ({ ...prev, file: true }))}
                    />
                    {touched.file && !form.file && (
                      <div className="animated fadeIn text-danger text-left d-flex flex-column">
                        <small className="m-0 animated fadeIn">* Campo obligatorio</small>
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-6">
                  <div className="form-group">
                    <label className="text-dark">CONFIRMAR LEGAJO</label>
                    <InputText
                      className="w-100"
                      inputMode="numeric"
                      value={form["confirm-file"]}
                      onChange={(e) => handleConfirmFileChange(e.target.value.replace(/\D/g, ""))}
                      onBlur={() => setTouched((prev) => ({ ...prev, "confirm-file": true }))}
                    />
                    {touched["confirm-file"] && !form["confirm-file"] && (
                      <div className="animated fadeIn text-danger text-left d-flex flex-column">
                        <small className="m-0 animated fadeIn">* Campo obligatorio</small>
                      </div>
                    )}
                  </div>
                </div>

                {isLoadingBosses && (
                  <div className="animated col-12 fadeIn">
                    <p className="d-flex align-items-center" style={{ gap: "6px" }}>
                      <Loader2 size={16} className="spin" /> Cargando jefes
                    </p>
                  </div>
                )}

                {!isLoadingBosses && bosses.length > 0 && (
                  <div className="animated col-12 fadeIn">
                    <div className="form-group">
                      <label className="text-dark">JEFE</label>
                      <Dropdown
                        className="w-100"
                        value={form.cuilBoss}
                        options={bosses.map((boss) => ({ label: boss.lastname_name, value: boss.cuil }))}
                        onChange={(e) => updateForm("cuilBoss", e.value)}
                        onBlur={() => setTouched((prev) => ({ ...prev, cuilBoss: true }))}
                        placeholder="-- Seleccionar --"
                      />
                      {touched.cuilBoss && !form.cuilBoss && (
                        <div className="animated fadeIn text-danger text-left d-flex flex-column">
                          <small className="m-0 animated fadeIn">* Campo obligatorio</small>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="col-12 d-flex justify-content-between">
                  <Button
                    unstyled
                    onClick={create}
                    disabled={isLoadingActionCreate || !isFormValid()}
                    type="button"
                    className="btn btn-info d-flex align-items-center"
                    style={{ gap: "8px", padding: "12px 28px", fontSize: "1.05rem", borderRadius: "10px" }}
                  >
                    {isLoadingActionCreate ? <Loader2 size={18} className="spin" /> : <Check size={18} />}
                    {isLoadingActionCreate ? "Solicitando salida" : "Aceptar"}
                  </Button>
                  <Button
                    unstyled
                    onClick={resetForm}
                    type="button"
                    className="btn"
                    style={{ padding: "12px 28px", fontSize: "1.05rem", borderRadius: "10px" }}
                  >
                    Volver
                  </Button>
                </div>
              </div>
            </Dialog>
          </div>
        </div>
      </div>

      <style jsx>{`
        .exit-type-btn:not(.exit-type-btn--active):hover {
          background: #f0f9ff !important;
          color: #0ea5e9 !important;
          border-color: #0ea5e9 !important;
        }
        :global(.spin) {
          animation: protected-spin 0.8s linear infinite;
        }
        @keyframes protected-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
