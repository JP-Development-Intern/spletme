import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Check,
} from "lucide-react";
import { AuthService } from "../../services/auth";
import { readPendingInvite } from "@/utils/pendingInvite";
import { setAuth } from "../../store/states/authSlice";
import { AuthShell, AuthField, PasswordToggle } from "@/components/auth/AuthShell";
import { AUTH_INPUT_CLASS, AUTH_LINK_CLASS, AUTH_SUBMIT_CLASS } from "@/components/auth/authStyles";

/** Clave donde se guarda el correo cuando el usuario marca "Recuérdame". */
const REMEMBERED_EMAIL_KEY = "rememberedEmail";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailLogin() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  /**
   * Quien viene de una invitación entra con el correo al que la recibió: es el
   * único con el que podrá aceptarla, así que se propone ya escrito.
   */
  const pendingInviteEmail = readPendingInvite()?.email ?? "";
  const [email, setEmail] = useState(pendingInviteEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Recupera el correo guardado la última vez que se marcó "Recuérdame".
  useEffect(() => {
    if (pendingInviteEmail) return;
    const saved = localStorage.getItem(REMEMBERED_EMAIL_KEY);
    if (saved) {
      setEmail(saved);
      setRemember(true);
    }
  }, [pendingInviteEmail]);

  const validateEmail = () => {
    if (email && !EMAIL_PATTERN.test(email)) {
      setEmailError("Escribe un correo válido, por ejemplo tucorreo@ejemplo.com.");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail()) return;
    setError("");
    setLoading(true);
    try {
      const response = await AuthService.login(email, password);
      if (!response?.data) {
        setError("El correo o la contraseña no coinciden. Revísalos e inténtalo otra vez.");
        return;
      }

      const serverUser = response.data.user;
      const serverStep = Number(serverUser?.onboardingData?.currentStep || 0);
      const onboardingCompleted = Boolean(serverUser.onboardingCompleted) || serverStep >= 4;
      const userToStore = { ...serverUser, onboardingCompleted };

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(userToStore));
      localStorage.setItem("isAuth", "true");
      if (remember) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }
      dispatch(setAuth({ isAuth: "true", user: userToStore }));

      // Quien venía de una invitación vuelve a ella antes que a nada: es a lo
      // que entró, y el onboarding es un formulario largo que puede abandonar a
      // la mitad dejando la invitación sin aceptar.
      const pendingInvite = readPendingInvite();
      if (pendingInvite) {
        navigate(pendingInvite.path, { replace: true });
        return;
      }

      navigate(userToStore.onboardingCompleted ? "/panel/home" : "/onboarding", { replace: true });
    } catch (err) {
      // Sin `response` no hubo respuesta del servidor: es un problema de conexión,
      // no unas credenciales incorrectas.
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === undefined) {
        setError("No pudimos conectar con el servidor. Revisa tu conexión e inténtalo otra vez.");
      } else if (status === 400 || status === 401 || status === 404) {
        setError("El correo o la contraseña no coinciden. Revísalos e inténtalo otra vez.");
      } else {
        setError("Algo falló de nuestro lado. Inténtalo de nuevo en unos minutos.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Bienvenido de nuevo" subtitle="Inicia sesión para seguir repartiendo tus regalías.">
      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4" noValidate>
        <AuthField id="email" label="Correo electrónico" icon={<Mail className="h-4 w-4" />} error={emailError}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            required
            value={email}
            disabled={loading}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError("");
            }}
            onBlur={validateEmail}
            placeholder="tucorreo@ejemplo.com"
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? "email-error" : undefined}
            className={AUTH_INPUT_CLASS}
          />
        </AuthField>

        <AuthField
          id="password"
          label="Contraseña"
          icon={<Lock className="h-4 w-4" />}
          error={error}
          action={
            <PasswordToggle
              visible={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
              disabled={loading}
            />
          }
        >
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            disabled={loading}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError("");
            }}
            placeholder="Ingresa tu contraseña"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "password-error" : undefined}
            className={AUTH_INPUT_CLASS}
          />
        </AuthField>

        <div className="flex items-center justify-between gap-4">
          <label className="flex min-h-[32px] cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              disabled={loading}
              className="peer sr-only"
            />
            <span
              className={`flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-md border-[1.5px] transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#FF5C00]/70 ${
                remember ? "border-[#FF5C00] bg-[#FF5C00]" : "border-white/40 bg-transparent"
              }`}
            >
              {remember && <Check className="h-3 w-3 text-white" />}
            </span>
            <span className="text-[12.5px] text-white/70">Recuérdame</span>
          </label>
          <button
            type="button"
            onClick={() => navigate("/auth/password-recovery")}
            className={`min-h-[32px] text-[12.5px] ${AUTH_LINK_CLASS}`}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={AUTH_SUBMIT_CLASS}
        >
          {loading ? "Iniciando sesión…" : "Iniciar sesión"}
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        </button>

        <p className="text-center text-[13px] text-white/65">
          ¿No tienes cuenta?{" "}
          <Link
            to="/auth/register"
            className="font-semibold text-[#FF8A3D] transition-colors hover:text-[#FFB48A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
          >
            Regístrate
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
