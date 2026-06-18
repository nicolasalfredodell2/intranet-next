"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
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
  { value: "Individuals", label: "Particular" },
  { value: "Officials", label: "Oficial" },
  { value: "Guild_Meeting_Attendance", label: "Asamblea" },
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

    if (!confirmFile) {
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
      <Toast ref={toast} />

      <div className="align-items-center animated d-flex fadeIn p-5 row">
        <div
          className="col-12 d-flex justify-content-center align-items-center mb-3"
          style={{ marginTop: "35vh" }}
        >
          <img
            src="/img/trib-cuentas-escudo-white.png"
            alt="Logo Tribunal de Cuentas de Río Negro"
            style={{ width: 55, height: 55, background: "#454C5C", borderRadius: 15, padding: 5 }}
          />
          <h1 className="h1 ml-3">Tribunal de Cuentas de Río Negro</h1>
        </div>

        <div className="col-12">
          <div className="d-flex justify-content-center row">
            <div className="col-12">
              <div className="form-group text-center">
                <label className="mb-3">
                  <strong>Solicitud de salida</strong>
                </label>

                <div className="row d-flex justify-content-around">
                  {EXIT_TYPES.map(({ value, label }) => (
                    <div
                      key={value}
                      onClick={() => updateForm("type", value)}
                      className={`d-flex col-12 col-lg-3 pt-3 pt-lg-0 justify-content-center align-items-center text-center text-white ${
                        form.type === value ? "bg-info" : "bg-secondary"
                      }`}
                      style={{ height: 50, cursor: "pointer" }}
                    >
                      <strong>{label}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Dialog
              header=""
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
                <div className="col-12">
                  <div className="form-group">
                    <label className="text-dark">LEGAJO</label>
                    <input
                      className="form-control"
                      type="text"
                      value={form.file}
                      onChange={(e) => updateForm("file", e.target.value)}
                      onBlur={() => setTouched((prev) => ({ ...prev, file: true }))}
                    />
                    {touched.file && !form.file && (
                      <div className="animated fadeIn text-danger text-left d-flex flex-column">
                        <small className="m-0 animated fadeIn">* Campo obligatorio</small>
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-12">
                  <div className="form-group">
                    <label className="text-dark">CONFIRMAR LEGAJO</label>
                    <input
                      className="form-control"
                      type="text"
                      value={form["confirm-file"]}
                      onChange={(e) => handleConfirmFileChange(e.target.value)}
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
                    <p>
                      <i className="pi pi-spin pi-spinner" /> Cargando jefes
                    </p>
                  </div>
                )}

                {!isLoadingBosses && bosses.length > 0 && (
                  <div className="animated col-12 fadeIn">
                    <div className="form-group">
                      <label className="text-dark">JEFE</label>
                      <select
                        className="form-control custom-select"
                        value={form.cuilBoss}
                        onChange={(e) => updateForm("cuilBoss", e.target.value)}
                        onBlur={() => setTouched((prev) => ({ ...prev, cuilBoss: true }))}
                      >
                        <option value="">-- Seleccionar --</option>
                        {bosses.map((boss) => (
                          <option key={boss.cuil} value={boss.cuil}>
                            {boss.lastname_name}
                          </option>
                        ))}
                      </select>
                      {touched.cuilBoss && !form.cuilBoss && (
                        <div className="animated fadeIn text-danger text-left d-flex flex-column">
                          <small className="m-0 animated fadeIn">* Campo obligatorio</small>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="col-12 d-flex justify-content-end">
                  <button
                    onClick={create}
                    disabled={isLoadingActionCreate || !isFormValid()}
                    type="button"
                    className="btn btn-info mr-2"
                  >
                    {isLoadingActionCreate ? "Solicitando salida" : "Aceptar"}
                  </button>
                  <button onClick={resetForm} type="button" className="btn">
                    Cancelar
                  </button>
                </div>
              </div>
            </Dialog>
          </div>
        </div>
      </div>
    </>
  );
}
