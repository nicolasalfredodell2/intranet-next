"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { whitenKey } from "@/lib/services/whiten-key.service";

const FIXED_TOKEN = "Qf6uN410hVaQf26udkBaBDsW2GqtQcud6Fp51v1XZIHPVxvc7Q6dnl5zHaK8Wc0cCCKPxhrFRRX";

interface Rules {
  minLength: boolean;
  minLowerCase: boolean;
  minNumbers: boolean;
  minUpperCase: boolean;
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

  const isFormValid = username && newpassword && newpassword.length <= 30 && rules.minLength && rules.minLowerCase && rules.minUpperCase && rules.minNumbers;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouchedUser(true);
    setTouchedPass(true);
    if (!isFormValid) return;

    setLoading(true);
    try {
      const resp = await whitenKey({ username, newpassword, token: FIXED_TOKEN });
      if (resp.error === "False") {
        setNewpassword("");
        setRules({ minLength: false, minLowerCase: false, minNumbers: false, minUpperCase: false });
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
      <Toast ref={toast} position="bottom-center" />

      <div className="animated fadeIn">
        <div className="row page-titles">
          <div className="align-self-center col-md-5">
            <h3 className="text-themecolor">Blanqueo de clave</h3>
          </div>
          <div className="align-self-center col-md-7">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="javascript:void(0)">Inicio</a></li>
              <li className="breadcrumb-item">Blanqueo de clave</li>
            </ol>
          </div>
        </div>

        <div className="row">
          <div className="col-md-12">
            <div className="card card-body text-dark">
              <div className="animated fadeIn row">
                <div className="col-md-12">
                  <div className="card card-body">
                    <div className="row">
                      <div className="col-12">
                        <form className="animated fadeIn" onSubmit={handleSubmit} noValidate>
                          <div className="row">
                            <div className="col-12 col-md-4">
                              <div className="form-group">
                                <label><small>USUARIO</small></label>
                                <input
                                  disabled={loading}
                                  className="form-control form-control-sm"
                                  type="text"
                                  value={username}
                                  onChange={(e) => setUsername(e.target.value)}
                                  onBlur={() => setTouchedUser(true)}
                                />
                                {touchedUser && !username && (
                                  <small className="text-danger animated fadeIn">* Campo obligatorio</small>
                                )}
                              </div>
                            </div>

                            <div className="col-12 col-md-4">
                              <div className="form-group">
                                <label><small>NUEVA CONTRASEÑA</small></label>
                                <div className="input-group">
                                  <input
                                    disabled={loading}
                                    className="form-control form-control-sm"
                                    type={showPassword ? "text" : "password"}
                                    value={newpassword}
                                    onChange={(e) => verifyRules(e.target.value)}
                                    onBlur={() => setTouchedPass(true)}
                                  />
                                  <div
                                    className="bg-light input-group-append pointer px-2 py-1"
                                    style={{ borderBottomRightRadius: 5, borderTopRightRadius: 5, cursor: "pointer", display: "flex", alignItems: "center" }}
                                    onClick={() => setShowPassword((p) => !p)}
                                  >
                                    <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
                                  </div>
                                </div>
                                {touchedPass && !newpassword && (
                                  <small className="text-danger animated fadeIn">* Campo obligatorio</small>
                                )}
                                {touchedPass && newpassword.length > 30 && (
                                  <small className="text-danger animated fadeIn">* La nueva contraseña puede tener hasta 30 caracteres</small>
                                )}
                              </div>
                            </div>

                            <div className="col-12 col-md-4 d-flex align-items-center">
                              <button
                                disabled={loading || !isFormValid}
                                type="submit"
                                className={`btn btn-block ${isFormValid ? "btn-info" : "btn-muted"}`}
                              >
                                {loading && <i className="animated fadeIn pi pi-spin pi-spinner mr-1" />}
                                {loading ? "BLANQUEANDO CONTRASEÑA" : "BLANQUEAR CONTRASEÑA"}
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="alert alert-light" role="alert">
              <strong>Su contraseña debe contener:</strong>
              <ul className="mt-1">
                <li className={rules.minLength ? "text-success" : ""}>
                  Al menos 7 caracteres
                  {rules.minLength && <i className="animated fadeIn fa-regular fa-circle-check ml-1" />}
                </li>
                <li className={rules.minLowerCase ? "text-success" : ""}>
                  Al menos 2 minúsculas
                  {rules.minLowerCase && <i className="animated fadeIn fa-regular fa-circle-check ml-1" />}
                </li>
                <li className={rules.minUpperCase ? "text-success" : ""}>
                  Al menos 1 mayúscula
                  {rules.minUpperCase && <i className="animated fadeIn fa-regular fa-circle-check ml-1" />}
                </li>
                <li className={rules.minNumbers ? "text-success" : ""}>
                  Al menos 1 número
                  {rules.minNumbers && <i className="animated fadeIn fa-regular fa-circle-check ml-1" />}
                </li>
              </ul>
            </div>

            <div className="alert alert-primary" role="alert">
              <p className="m-0 p-0 text-center text-dark">
                <small>El cambio de contraseña se verá reflejado en: <strong>PC personal, correo institucional, Workflow, Intranet, Chasqui y Ebla</strong>.</small>
              </p>
              <p className="m-0 p-0 text-center text-dark">
                <small>Una contraseña larga, junto con combinación de letras y números, nos permite proteger nuestros datos.</small>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
