import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  AtSign,
  ArrowRight,
  Loader2,
  CircleAlert,
  ShieldCheck,
} from "lucide-react";
import { AuthService } from "../../services/auth";
import { readPendingInvite } from "@/utils/pendingInvite";
import { WelcomeModal } from "../../components/modal/WelcomeModal";
import { SplitmeLogo } from "@/components/brand/SplitmeLogo";

/** Recorrido completo del alta; aquí solo se cubre el primer punto. */
const ROADMAP = [
  { name: "Crea tu cuenta", detail: "Usuario, correo y contraseña" },
  { name: "Tu profesión", detail: "Para qué usas Splitme" },
  { name: "Tus datos", detail: "País, contacto e identificación" },
  { name: "Verifica tu correo", detail: "Código de 6 dígitos" },
  { name: "Listo", detail: "Entra al panel" },
];

export default function Register() {
  const navigate = useNavigate();

  /**
   * Quien llega desde una invitación trae su correo decidido: es el que recibió
   * el mensaje y al que está atada la invitación. Se rellena y se bloquea para
   * que no cree la cuenta con otro y luego no pueda aceptarla.
   */
  const pendingInvite = readPendingInvite();
  const invitedEmail = pendingInvite?.email ?? "";

  const [formData, setFormData] = useState({
    username: "",
    name: "",
    lastName: "",
    email: invitedEmail,
    password: "",
    passwordConfirmation: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);

  const set = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (formData.password !== formData.passwordConfirmation) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    setIsSubmitting(true);
    const response = await AuthService.register(formData);

    if (!response) {
      setErrorMessage("No se pudo crear la cuenta. Intenta nuevamente.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    setShowWelcome(true);
  };

  return (
    <>
      <WelcomeModal
        isOpen={showWelcome}
        userName={formData.name}
        onContinue={() => navigate("/auth/email-login")}
      />
      <div className="flex min-h-screen bg-white">
        {/* Formulario */}
        <div className="flex w-full flex-col justify-between gap-8 px-6 py-10 sm:px-12 lg:w-[560px] lg:flex-shrink-0 lg:px-16 lg:py-10">
          <SplitmeLogo className="h-[38px] self-start text-[#1C1D22]" />

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <h1 className="font-display text-[28px] font-semibold text-[#1C1D22]">
                Crea tu cuenta
              </h1>
              <p className="text-[13.5px] text-[#71757E]">
                Cinco pasos rápidos, menos de tres minutos.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Field id="username" label="Nombre de usuario" icon={<AtSign className="h-4 w-4" />}>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.username}
                  disabled={isSubmitting}
                  onChange={(e) => set("username", e.target.value)}
                  placeholder="Elige un nombre de usuario"
                  className={inputClass}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3.5">
                <Field id="name" label="Nombre" icon={<User className="h-4 w-4" />}>
                  <input
                    id="name"
                    type="text"
                    autoComplete="given-name"
                    required
                    value={formData.name}
                    disabled={isSubmitting}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Tu nombre"
                    className={inputClass}
                  />
                </Field>
                <Field id="lastName" label="Apellido">
                  <input
                    id="lastName"
                    type="text"
                    autoComplete="family-name"
                    required
                    value={formData.lastName}
                    disabled={isSubmitting}
                    onChange={(e) => set("lastName", e.target.value)}
                    placeholder="Tu apellido"
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field id="email" label="Correo electrónico" icon={<Mail className="h-4 w-4" />}>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  disabled={isSubmitting || Boolean(invitedEmail)}
                  readOnly={Boolean(invitedEmail)}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                  className={inputClass}
                />
              </Field>
              {invitedEmail && (
                <p className="-mt-2 text-[11.5px] leading-relaxed text-[#71757E]">
                  Es el correo al que te enviaron la invitación. Al terminar te llevamos de
                  vuelta para aceptarla.
                </p>
              )}

              <Field
                id="password"
                label="Contraseña"
                icon={<Lock className="h-4 w-4" />}
                action={
                  <PasswordToggle
                    visible={showPassword}
                    onToggle={() => setShowPassword((v) => !v)}
                    disabled={isSubmitting}
                  />
                }
              >
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  disabled={isSubmitting}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="Crea una contraseña"
                  className={inputClass}
                />
              </Field>

              <Field
                id="passwordConfirmation"
                label="Confirmar contraseña"
                icon={<Lock className="h-4 w-4" />}
                error={errorMessage}
                action={
                  <PasswordToggle
                    visible={showConfirm}
                    onToggle={() => setShowConfirm((v) => !v)}
                    disabled={isSubmitting}
                  />
                }
              >
                <input
                  id="passwordConfirmation"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.passwordConfirmation}
                  disabled={isSubmitting}
                  onChange={(e) => set("passwordConfirmation", e.target.value)}
                  placeholder="Repite la contraseña"
                  className={inputClass}
                />
              </Field>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[25px] bg-[#FF5C00] text-[15px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(255,92,0,0.55)] transition-colors hover:bg-[#EA580C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00] disabled:opacity-75 disabled:shadow-none"
              >
                {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5">
                <span className="text-[13.5px] text-[#71757E]">¿Ya tienes cuenta?</span>
                <Link
                  to="/auth/email-login"
                  className="text-[13.5px] font-semibold text-[#FF5C00] transition-colors hover:text-[#EA580C]"
                >
                  Inicia sesión
                </Link>
              </div>
            </form>
          </div>

          <div className="flex items-center gap-2">
            <Lock className="h-3 w-3 text-[#A6AAB2]" />
            <span className="text-[11.5px] text-[#A6AAB2]">
              Tus datos se guardan cifrados y nunca se comparten.
            </span>
          </div>
        </div>

        {/* Mapa del recorrido */}
        <aside className="hidden flex-1 flex-col justify-center gap-8 bg-[#101114] px-[72px] lg:flex">
          <div className="flex flex-col gap-3">
            <span className="font-mono text-[10px] font-medium tracking-[1.4px] text-[#FF5C00]">
              PASO 1 DE {ROADMAP.length}
            </span>
            <h2 className="max-w-[620px] font-display text-[34px] font-semibold leading-[1.18] text-white">
              Configura tu cuenta y empieza a repartir.
            </h2>
          </div>

          <ol className="flex flex-col">
            {ROADMAP.map((step, index) => {
              const current = index === 0;
              return (
                <li key={step.name} className="flex flex-col">
                  {index > 0 && <span className="ml-[15px] h-[18px] w-0.5 bg-white/10" />}
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-mono text-[12px] font-semibold ${
                        current
                          ? "bg-[#FF5C00] text-white"
                          : "border-[1.5px] border-white/15 text-white/40"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="flex flex-col">
                      <span
                        className={`text-[14px] font-semibold ${current ? "text-white" : "text-white/50"}`}
                      >
                        {step.name}
                      </span>
                      <span
                        className={`text-[12px] ${current ? "text-white/60" : "text-white/30"}`}
                      >
                        {step.detail}
                      </span>
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="flex max-w-[620px] items-start gap-3.5 rounded-[20px] border border-white/10 bg-white/[0.05] p-[18px]">
            <ShieldCheck className="h-[18px] w-[18px] flex-shrink-0 text-[#FF5C00]" />
            <div className="flex flex-col gap-1">
              <span className="text-[13px] font-semibold text-white">
                Por qué pedimos estos datos
              </span>
              <span className="text-[12px] leading-relaxed text-white/60">
                Los necesitamos para pagarte: identifican tu cuenta ante el distribuidor y ante
                Stripe o Wise.
              </span>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

const inputClass =
  "w-full border-0 bg-transparent p-0 text-[13px] text-[#1C1D22] placeholder:text-[#A6AAB2] focus:border-0 focus:outline-none focus:ring-0 disabled:text-[#71757E]";

interface FieldProps {
  id: string;
  label: string;
  icon?: React.ReactNode;
  error?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

/** Campo con etiqueta visible, icono opcional y error anclado debajo. */
function Field({ id, label, icon, error, action, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[12px] font-semibold text-[#1C1D22]">
        {label}
      </label>
      <div
        className={`flex h-[46px] items-center gap-2.5 rounded-[15px] border px-3.5 transition-colors ${
          error
            ? "border-[#E5484D] bg-white ring-[3px] ring-[#E5484D]/15"
            : "border-[#E8E8EC] bg-[#F4F5F7] focus-within:border-[#FF5C00] focus-within:bg-white focus-within:ring-[3px] focus-within:ring-[#FF5C00]/15"
        }`}
      >
        {icon && (
          <span className={`flex-shrink-0 ${error ? "text-[#E5484D]" : "text-[#A6AAB2]"}`}>
            {icon}
          </span>
        )}
        {children}
        {action}
      </div>
      {error && (
        <p
          role="alert"
          className="flex items-center gap-1.5 text-[11.5px] leading-snug text-[#E5484D]"
        >
          <CircleAlert className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

/** Botón de mostrar/ocultar contraseña. */
function PasswordToggle({
  visible,
  onToggle,
  disabled,
}: {
  visible: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
      className="flex-shrink-0 text-[#A6AAB2] transition-colors hover:text-[#71757E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
    >
      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}
