import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, User, AtSign, ArrowRight, Loader2 } from "lucide-react";
import { AuthService } from "../../services/auth";
import { readPendingInvite } from "@/utils/pendingInvite";
import { WelcomeModal } from "../../components/modal/WelcomeModal";
import { AuthShell, AuthField, PasswordToggle } from "@/components/auth/AuthShell";
import { AUTH_INPUT_CLASS, AUTH_LINK_CLASS, AUTH_SUBMIT_CLASS } from "@/components/auth/authStyles";

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
      <AuthShell title="Crea tu cuenta" subtitle="Cinco pasos rápidos, menos de tres minutos.">
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
          <AuthField id="username" label="Nombre de usuario" icon={<AtSign className="h-4 w-4" />}>
            <input
              id="username"
              type="text"
              autoComplete="username"
              autoFocus
              required
              value={formData.username}
              disabled={isSubmitting}
              onChange={(e) => set("username", e.target.value)}
              placeholder="Elige un nombre de usuario"
              className={AUTH_INPUT_CLASS}
            />
          </AuthField>

          <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 min-[400px]:gap-3">
            <AuthField id="name" label="Nombre" icon={<User className="h-4 w-4" />}>
              <input
                id="name"
                type="text"
                autoComplete="given-name"
                required
                value={formData.name}
                disabled={isSubmitting}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Tu nombre"
                className={AUTH_INPUT_CLASS}
              />
            </AuthField>
            <AuthField id="lastName" label="Apellido">
              <input
                id="lastName"
                type="text"
                autoComplete="family-name"
                required
                value={formData.lastName}
                disabled={isSubmitting}
                onChange={(e) => set("lastName", e.target.value)}
                placeholder="Tu apellido"
                className={AUTH_INPUT_CLASS}
              />
            </AuthField>
          </div>

          <div className="flex flex-col gap-1.5">
            <AuthField id="email" label="Correo electrónico" icon={<Mail className="h-4 w-4" />}>
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
                aria-describedby={invitedEmail ? "email-invite-hint" : undefined}
                className={AUTH_INPUT_CLASS}
              />
            </AuthField>
            {invitedEmail && (
              <p id="email-invite-hint" className="px-1 text-[11.5px] leading-relaxed text-white/55">
                Es el correo al que te enviaron la invitación. Al terminar te llevamos de vuelta para
                aceptarla.
              </p>
            )}
          </div>

          <AuthField
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
              className={AUTH_INPUT_CLASS}
            />
          </AuthField>

          <AuthField
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
              aria-invalid={Boolean(errorMessage)}
              aria-describedby={errorMessage ? "passwordConfirmation-error" : undefined}
              className={AUTH_INPUT_CLASS}
            />
          </AuthField>

          <button type="submit" disabled={isSubmitting} className={AUTH_SUBMIT_CLASS}>
            {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          </button>

          <p className="text-center text-[13px] text-white/65">
            ¿Ya tienes cuenta?{" "}
            <Link to="/auth/email-login" className={AUTH_LINK_CLASS}>
              Inicia sesión
            </Link>
          </p>
        </form>
      </AuthShell>
    </>
  );
}
