"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { login, validateToken } from "@/lib/services/auth.service";

interface LoginFormData {
  cuil: string;
  password: string;
  remember: boolean;
}

export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorUser, setErrorUser] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({
    mode: "onTouched",
    defaultValues: {
      cuil: "",
      password: "",
      remember: false,
    },
  });

  useEffect(() => {
    const rememberedUser = localStorage.getItem("remember_user");
    if (rememberedUser) {
      setValue("cuil", rememberedUser);
      setValue("remember", true);
    }
  }, [setValue]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setErrorUser(false);

    try {
      const keycloakData = await login({ username: data.cuil, password: data.password });

      localStorage.setItem("token", keycloakData.access_token);
      document.cookie = `token=${keycloakData.access_token}; path=/; SameSite=Strict`;

      const resp = await validateToken("Bearer " + keycloakData.access_token);
      localStorage.setItem("useremail", JSON.stringify(resp.usuario.email));

      const tokenDecoded: any = jwtDecode(keycloakData.access_token);
      localStorage.setItem("roles", JSON.stringify(tokenDecoded.resource_access));
      localStorage.setItem("user", data.cuil);

      if (data.remember) {
        localStorage.setItem("remember_user", data.cuil);
      } else {
        localStorage.setItem("remember_user", "");
      }

      setErrorUser(false);
      router.push("/institucional");
    } catch (err: any) {
      if (err?.response?.status !== 401) {
        setErrorUser(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const redirectToGestionClave = () => {
    window.open(
      process.env.NEXT_PUBLIC_GESTION_CLAVE_URL || "https://gestion-clave.tribcuentasrionegro.gov.ar/",
      "_blank"
    );
  };

  const btnClass = isLoading || !isValid ? "btn-muted" : "btn-info";

  return (
    <section id="wrapper" className="fadeIn animated">
      <div
        className="login-register"
        style={{ backgroundImage: "url(/img/auth/bg.svg)" }}
      >
        <div className="login-box card border rounded">
          <div className="card-body">
            <form
              className="form-horizontal form-material"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              <h3 className="box-title m-b-20">Iniciar sesión</h3>

              {/* CUIL */}
              <div className="form-group">
                <div className="col-xs-12">
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Cuil (sin puntos ni guiones)"
                    id="cuil"
                    autoComplete="off"
                    {...register("cuil", {
                      required: "* Campo obligatorio",
                      minLength: { value: 11, message: "* El cuil debe tener 11 dígitos" },
                      maxLength: { value: 11, message: "* El cuil debe tener 11 dígitos" },
                      pattern: { value: /^[0-9]*$/, message: "* Ingrese un cuil válido" },
                    })}
                  />
                  {errors.cuil && (
                    <div className="animated fadeIn text-danger text-left d-flex flex-column" role="alert">
                      <small className="m-0 animated fadeIn">{errors.cuil.message}</small>
                    </div>
                  )}
                </div>
              </div>

              {/* Contraseña */}
              <div className="form-group">
                <div className="col-xs-12" style={{ position: "relative" }}>
                  <input
                    className="form-control"
                    type={showPassword ? "text" : "password"}
                    placeholder="Contraseña"
                    id="password"
                    autoComplete="off"
                    {...register("password", {
                      required: "* Campo obligatorio",
                    })}
                  />
                  <i
                    onClick={() => setShowPassword(!showPassword)}
                    className={`icon-password mdi pointer ${showPassword ? "mdi-eye-off" : "mdi-eye"}`}
                  />
                  {errors.password && (
                    <div className="animated fadeIn text-danger text-left d-flex flex-column" role="alert">
                      <small className="m-0 animated fadeIn">{errors.password.message}</small>
                    </div>
                  )}
                </div>
              </div>

              {/* Error de credenciales */}
              {errorUser && (
                <div className="form-group fadeIn animated">
                  <div className="col-xs-12 text-center text-danger">
                    Cuil y/o contraseña incorrectas
                  </div>
                </div>
              )}

              {/* Recordarme */}
              <div className="form-group row">
                <div className="col-md-12">
                  <div className="checkbox checkbox-info pull-left p-t-0">
                    <input
                      type="checkbox"
                      className="chk-col-light-blue"
                      id="remember"
                      {...register("remember")}
                    />
                    <label htmlFor="remember">Recordarme</label>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="form-group text-center">
                <div className="col-xs-12">
                  <button
                    className={`btn btn-block btn-lg btn-rounded ${btnClass}`}
                    disabled={isLoading}
                    type="submit"
                  >
                    {!isLoading ? (
                      "Iniciar Sesión"
                    ) : (
                      <>
                        <i className="pi pi-spin pi-spinner mr-1" />
                        {" "}Iniciando sesión...
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Olvidaste tu contraseña */}
          <div className="form-group row">
            <div className="col-md-12">
              <p className="pointer" onClick={redirectToGestionClave}>
                <strong>
                  ¿Olvidaste tu contraseña?
                  <br />
                  <span style={{ textDecoration: "underline" }}>Recuperar contraseña</span>
                </strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Escudo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/img/trib-cuentas-escudo-white.png"
        alt="Escudo tribunal"
        style={{ bottom: "10px", height: "150px", position: "absolute", right: "10px", width: "150px" }}
      />
    </section>
  );
}
