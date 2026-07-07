"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { login, validateToken } from "@/lib/services/auth.service";
import { version as appVersion } from "@/package.json";
import AuroraBackground from "@/components/common/AuroraBackground";

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
    formState: { errors },
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

  return (
    <section id="wrapper" className="fadeIn animated login-split">
      <div className="login-split-left">
        <AuroraBackground>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/img/trib-cuentas-escudo-white.png"
              alt="Escudo del Tribunal de Cuentas"
              className="login-split-image"
            />
          </div>
        </AuroraBackground>
      </div>

      <div className="login-split-right">
        <div className="d-flex align-items-center" style={{ position: "absolute", top: "24px", left: "24px", gap: "8px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/trib-cuentas-escudo.png" alt="" style={{ height: "28px", width: "28px", objectFit: "contain" }} />
          <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b", letterSpacing: "0.02em" }}>INT4RANET</span>
        </div>

        <span style={{ position: "absolute", bottom: "16px", left: "24px", fontSize: "0.72rem", color: "#94a3b8" }}>
          v{appVersion}
        </span>

        <div className="login-box">
          <div className="mb-4 text-left">
            <h2 className="font-weight-bold mb-1" style={{ fontSize: "2rem", color: "#1e293b" }}>Iniciar sesión</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* CUIL */}
            <div className="mb-3 text-left">
              <label htmlFor="cuil" className={`profile-field-label${errors.cuil ? " text-danger" : ""}`}>CUIL</label>
              <div style={{ position: "relative" }}>
                <i className="pi pi-id-card" style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input
                  className="profile-input"
                  style={{ paddingLeft: "38px" }}
                  type="text"
                  placeholder="Sin puntos ni guiones"
                  id="cuil"
                  autoComplete="username"
                  disabled={isLoading}
                  {...register("cuil", {
                    required: "* Campo obligatorio",
                    minLength: { value: 11, message: "* El cuil debe tener 11 dígitos" },
                    maxLength: { value: 11, message: "* El cuil debe tener 11 dígitos" },
                    pattern: { value: /^[0-9]*$/, message: "* Ingrese un cuil válido" },
                  })}
                />
              </div>
              {errors.cuil && <small className="text-danger animated fadeIn" style={{ fontSize: "0.73rem", marginTop: "4px", display: "block" }} role="alert">{errors.cuil.message}</small>}
            </div>

            {/* Contraseña */}
            <div className="mb-3 text-left">
              <label htmlFor="password" className={`profile-field-label${errors.password ? " text-danger" : ""}`}>Contraseña</label>
              <div style={{ position: "relative" }}>
                <i className="pi pi-lock" style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input
                  className="profile-input"
                  style={{ paddingLeft: "38px", paddingRight: "38px" }}
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  id="password"
                  autoComplete="current-password"
                  disabled={isLoading}
                  {...register("password", {
                    required: "* Campo obligatorio",
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
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
              {errors.password && <small className="text-danger animated fadeIn" style={{ fontSize: "0.73rem", marginTop: "4px", display: "block" }} role="alert">{errors.password.message}</small>}
            </div>

            {/* Error de credenciales */}
            {errorUser && (
              <div className="animated fadeIn" style={{ background: "#fdecec", borderLeft: "3px solid #e05153", borderRadius: "8px", color: "#c0392b", fontSize: "0.82rem", padding: "9px 12px", marginBottom: "16px" }} role="alert">
                Cuil y/o contraseña incorrectas
              </div>
            )}

            {/* Recordarme */}
            <div className="d-flex align-items-center mb-3" style={{ gap: "7px" }}>
              <input
                type="checkbox"
                id="remember"
                disabled={isLoading}
                style={{ accentColor: "#4a6cf7", cursor: "pointer", height: 15, width: 15 }}
                {...register("remember")}
              />
              <label htmlFor="remember" className="mb-0" style={{ fontSize: "0.82rem", color: "#64748b", cursor: "pointer" }}>Recordarme</label>
            </div>

            {/* Submit */}
            <button
              disabled={isLoading}
              type="submit"
              className="btn btn-primary d-flex align-items-center justify-content-center w-100"
              style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.9rem", padding: "10px" }}
            >
              <i className={isLoading ? "pi pi-spin pi-spinner" : "pi pi-sign-in"} style={{ fontSize: "0.85rem" }} />
              {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </form>

          {/* Olvidaste tu contraseña */}
          <p className="text-left mt-3 mb-0">
            <button
              type="button"
              onClick={redirectToGestionClave}
              className="btn-link"
              style={{ background: "none", border: "none", padding: 0, color: "#1e293b", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", textDecoration: "none" }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}
