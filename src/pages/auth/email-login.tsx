import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CircleAlert,
  Check,
  Music,
  ShieldCheck,
  CreditCard,
  Send,
} from "lucide-react";
import { AuthService } from "../../services/auth";
import { readPendingInvite } from "@/utils/pendingInvite";
import { setAuth } from "../../store/states/authSlice";
import { SplitmeLogo } from "@/components/brand/SplitmeLogo";

/** Clave donde se guarda el correo cuando el usuario marca "Recuérdame". */
const REMEMBERED_EMAIL_KEY = "rememberedEmail";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Reparto de ejemplo del panel de marca: ilustra qué hace el producto. */
const SAMPLE_SPLIT = {
  title: "Amor",
  artist: "Luna Vega",
  isrc: "ARF152400123",
  income: "$4,182.60",
  collaborators: [
    { initial: "L", name: "Luna Vega", color: "#FF5C00", percentage: 45, amount: "$1,882.17" },
    { initial: "D", name: "Dani Ruiz", color: "#2FB37E", percentage: 30, amount: "$1,254.78" },
    { initial: "T", name: "Trío Norte", color: "#6366F1", percentage: 25, amount: "$1,045.65" },
  ],
};

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "Conexión segura" },
  { icon: CreditCard, label: "Stripe" },
  { icon: Send, label: "Wise" },
];

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
    <div className="flex min-h-screen bg-white">
      {/* Formulario */}
      <div className="flex w-full flex-col justify-between gap-10 px-6 py-10 sm:px-12 lg:w-[560px] lg:flex-shrink-0 lg:px-[72px] lg:py-12">
        <SplitmeLogo className="h-[42px] self-start text-[#1C1D22]" />

        <div className="flex flex-col gap-[22px]">
          <div className="flex flex-col gap-1.5">
            <h1 className="font-display text-[28px] font-semibold text-[#1C1D22]">
              Bienvenido de nuevo
            </h1>
            <p className="text-[13.5px] leading-relaxed text-[#71757E]">
              Inicia sesión para seguir repartiendo tus regalías.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-[22px]" noValidate>
            <div className="flex flex-col gap-4">
              <Field
                id="email"
                label="Correo electrónico"
                icon={<Mail className="h-4 w-4" />}
                error={emailError}
              >
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
                  className="w-full border-0 bg-transparent p-0 text-[13.5px] text-[#1C1D22] placeholder:text-[#A6AAB2] focus:border-0 focus:outline-none focus:ring-0 disabled:text-[#71757E]"
                />
              </Field>

              <Field
                id="password"
                label="Contraseña"
                icon={<Lock className="h-4 w-4" />}
                error={error}
                action={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    disabled={loading}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="flex-shrink-0 text-[#A6AAB2] transition-colors hover:text-[#71757E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-[17px] w-[17px]" />
                    ) : (
                      <Eye className="h-[17px] w-[17px]" />
                    )}
                  </button>
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
                  className="w-full border-0 bg-transparent p-0 text-[13.5px] text-[#1C1D22] placeholder:text-[#A6AAB2] focus:border-0 focus:outline-none focus:ring-0 disabled:text-[#71757E]"
                />
              </Field>
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  disabled={loading}
                  className="peer sr-only"
                />
                <span
                  className={`flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-md border-[1.5px] transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#FF5C00] ${
                    remember ? "border-[#FF5C00] bg-[#FF5C00]" : "border-[#A6AAB2] bg-white"
                  }`}
                >
                  {remember && <Check className="h-3 w-3 text-white" />}
                </span>
                <span className="text-[13px] text-[#71757E]">Recuérdame</span>
              </label>
              <button
                type="button"
                onClick={() => navigate("/auth/password-recovery")}
                className="text-[13px] font-semibold text-[#FF5C00] transition-colors hover:text-[#EA580C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[26px] bg-[#FF5C00] text-[15px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(255,92,0,0.55)] transition-colors hover:bg-[#EA580C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00] disabled:opacity-75 disabled:shadow-none"
            >
              {loading ? "Iniciando sesión…" : "Iniciar sesión"}
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5">
              <span className="text-[13.5px] text-[#71757E]">¿No tienes cuenta?</span>
              <Link
                to="/auth/register"
                className="text-[13.5px] font-semibold text-[#FF5C00] transition-colors hover:text-[#EA580C]"
              >
                Regístrate
              </Link>
            </div>
          </form>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:gap-1.5">
          {TRUST_BADGES.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 rounded-2xl bg-[#F4F5F7] px-2.5 py-1.5 text-[11px] font-medium text-[#71757E] lg:bg-transparent lg:px-0 lg:py-0"
            >
              <Icon className="h-3 w-3" />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Panel de marca: qué hace Splitme, con un reparto de ejemplo */}
      <aside className="hidden flex-1 flex-col justify-center gap-8 bg-[#101114] px-[72px] lg:flex">
        <h2 className="font-display text-[40px] font-semibold leading-[1.15] text-white">
          Cada peso se reparte como lo acordaron.
        </h2>
        <p className="max-w-[560px] text-[15px] leading-relaxed text-white/60">
          Sube el reporte del distribuidor y Splitme calcula cuánto le toca a cada colaborador,
          canción por canción.
        </p>

        <div className="flex flex-col gap-5 rounded-[26px] border border-white/10 bg-white/[0.05] p-[26px]">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[15px] bg-[#FF5C00]/15">
              <Music className="h-[18px] w-[18px] text-white/50" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-[15px] font-semibold text-white">{SAMPLE_SPLIT.title}</span>
              <span className="font-mono text-[11px] text-white/50">
                {SAMPLE_SPLIT.artist} · {SAMPLE_SPLIT.isrc}
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2FB37E]/15 px-2.5 py-1 text-[10.5px] font-semibold text-[#2FB37E]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2FB37E]" />
              Con split
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-mono text-[9.5px] font-medium tracking-[1.3px] text-white/40">
              INGRESOS DEL PERIODO
            </span>
            <span className="font-mono text-[30px] font-semibold tracking-tight text-white">
              {SAMPLE_SPLIT.income}
            </span>
          </div>

          <div className="h-px bg-white/10" />

          <div className="flex flex-col gap-3.5">
            {SAMPLE_SPLIT.collaborators.map((c) => (
              <div key={c.name} className="flex items-center gap-3">
                <span
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                  style={{ backgroundColor: c.color }}
                >
                  {c.initial}
                </span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-white">
                  {c.name}
                </span>
                <span className="font-mono text-[11.5px] font-semibold text-white/70">
                  {c.percentage}%
                </span>
                <span className="h-1.5 w-[120px] flex-shrink-0 overflow-hidden rounded-full bg-white/10">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${c.percentage}%`, backgroundColor: c.color }}
                  />
                </span>
                <span className="w-[84px] flex-shrink-0 text-right font-mono text-[12px] font-semibold text-white">
                  {c.amount}
                </span>
              </div>
            ))}
          </div>

          <span className="text-[11px] text-white/40">Neto tras comisiones del distribuidor</span>
        </div>
      </aside>
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  error?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

/** Campo con etiqueta visible, icono y mensaje de error anclado debajo. */
function Field({ id, label, icon, error, action, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[12.5px] font-semibold text-[#1C1D22]">
        {label}
      </label>
      <div
        className={`flex h-[50px] items-center gap-3 rounded-2xl border px-4 transition-colors ${
          error
            ? "border-[#E5484D] bg-white ring-[3px] ring-[#E5484D]/15"
            : "border-[#E8E8EC] bg-[#F4F5F7] focus-within:border-[#FF5C00] focus-within:bg-white focus-within:ring-[3px] focus-within:ring-[#FF5C00]/15"
        }`}
      >
        <span className={`flex-shrink-0 ${error ? "text-[#E5484D]" : "text-[#A6AAB2]"}`}>
          {icon}
        </span>
        {children}
        {action}
      </div>
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="flex items-center gap-2 rounded-[13px] bg-[#FDECEC] px-3 py-2 text-[11.5px] leading-snug text-[#E5484D]"
        >
          <CircleAlert className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
