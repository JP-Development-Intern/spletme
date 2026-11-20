import { useState, useRef, useEffect } from "react";
import { ArrowLeft, ArrowRight, CircleAlert, CircleCheck, Loader2, Pencil } from "lucide-react";
import { OnboardingData, OnboardingService } from "../../../services/onboarding";
import { AuthHeading } from "@/components/auth/AuthShell";
import {
  AUTH_LINK_CLASS,
  AUTH_SECONDARY_CLASS,
  AUTH_SUBMIT_CLASS,
  AUTH_SUBMIT_IDLE_CLASS,
} from "@/components/auth/authStyles";

interface VerificationStepProps {
  nextStep: (data?: Partial<OnboardingData>) => void;
  prevStep: () => void;
  initialData?: OnboardingData;
  verificationEmail: string;
}

const CODE_LENGTH = 6;

const VerificationStep = ({ nextStep, prevStep, verificationEmail }: VerificationStepProps) => {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleInputChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setError("");
    setSuccessMessage("");

    // Auto-focus next input
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    const newCode = [...code];

    for (let i = 0; i < pastedData.length && i < CODE_LENGTH; i++) {
      newCode[i] = pastedData[i];
    }
    setCode(newCode);
    setError("");
    setSuccessMessage("");

    // Focus the next empty input or the last one
    const nextEmptyIndex = newCode.findIndex((digit) => digit === "");
    const focusIndex = nextEmptyIndex === -1 ? CODE_LENGTH - 1 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleResendCode = async () => {
    if (!verificationEmail) {
      setError("No encontramos tu correo para reenviar el código.");
      return;
    }

    setError("");
    setSuccessMessage("");
    setIsResending(true);
    try {
      const response = await OnboardingService.requestAccountVerificationCode(verificationEmail);

      if (!response.accepted) {
        setError("No fue posible reenviar el código.");
        return;
      }

      setCountdown(60);
      setSuccessMessage("Te enviamos un nuevo código de verificación.");
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "No fue posible reenviar el código.",
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join("");

    if (fullCode.length !== CODE_LENGTH) {
      setError("Por favor ingresa el código completo");
      return;
    }

    if (!/^\d{6}$/.test(fullCode)) {
      setError("El código debe contener solo números");
      return;
    }

    if (!verificationEmail) {
      setError("No encontramos tu correo para validar el código.");
      return;
    }

    setIsVerifying(true);
    setError("");
    setSuccessMessage("");

    try {
      const verificationResponse = await OnboardingService.verifyAccountCode(
        verificationEmail,
        fullCode,
      );

      if (!verificationResponse.verified) {
        setError("Código inválido o expirado.");
        return;
      }

      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        user.accountVerified = true;
        localStorage.setItem("user", JSON.stringify(user));
      }

      nextStep({
        whatsappVerified: true,
      });
    } catch (verificationError) {
      setError(
        verificationError instanceof Error
          ? verificationError.message
          : "Código inválido o expirado.",
      );
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const isCodeComplete = code.every((digit) => digit !== "");
  const emailToVerify = verificationEmail || "tu correo";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2">
        <AuthHeading
          title="Verifica tu correo"
          subtitle={
            <>
              Enviamos un código de 6 dígitos a{" "}
              <span className="font-semibold text-white">{emailToVerify}</span>
            </>
          }
        />
        <button
          type="button"
          onClick={prevStep}
          className={`flex w-fit items-center gap-1.5 text-[12.5px] ${AUTH_LINK_CLASS}`}
        >
          <Pencil className="h-3 w-3" />
          Cambiar correo
        </button>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            size={1}
            value={digit}
            aria-label={`Dígito ${index + 1} de ${CODE_LENGTH}`}
            aria-invalid={Boolean(error)}
            onChange={(e) => handleInputChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={isVerifying}
            className={`h-[62px] w-full min-w-0 rounded-2xl border-0 text-center font-mono text-[24px] font-light text-white outline outline-1 transition-colors focus:outline-2 focus:ring-0 ${
              error
                ? "bg-black/[0.22] outline-[#FF8F92]/80 focus:outline-[#FF8F92]"
                : digit
                  ? "bg-[#FF5C00]/[0.12] outline-[#FF8A3D]/50 focus:outline-[#FF8A3D]"
                  : "bg-black/[0.22] outline-white/[0.16] focus:outline-[#FF8A3D]"
            }`}
          />
        ))}
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-[14px] bg-[#E5484D]/[0.16] px-3 py-2.5 text-[11.5px] leading-snug text-[#FFB3B5]"
        >
          <CircleAlert className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
        </p>
      )}

      {successMessage && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-[14px] bg-[#45D39A]/[0.14] px-3 py-2.5 text-[11.5px] leading-snug text-[#7BE3B9]"
        >
          <CircleCheck className="h-3.5 w-3.5 flex-shrink-0" />
          {successMessage}
        </p>
      )}

      <div className="flex items-center gap-2">
        <span className="text-[12.5px] text-white/65">¿No llegó el código?</span>
        {countdown > 0 ? (
          <span className="font-mono text-[12.5px] text-white/50">
            Puedes reenviarlo en {countdown} s
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResendCode}
            disabled={isResending}
            className={`text-[12.5px] disabled:text-white/40 ${AUTH_LINK_CLASS}`}
          >
            {isResending ? "Enviando…" : "Reenviar ahora"}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2.5 rounded-[18px] bg-white/[0.05] p-4">
        <span className="text-[12.5px] font-semibold text-white">
          Si no lo ves en unos segundos
        </span>
        {[
          "Revisa la carpeta de spam o promociones.",
          "El código caduca a los 10 minutos.",
          "Comprueba que el correo esté bien escrito.",
        ].map((tip) => (
          <span key={tip} className="flex items-start gap-2.5">
            <span className="mt-[6px] h-[5px] w-[5px] flex-shrink-0 rounded-full bg-white/40" />
            <span className="text-[12px] leading-snug text-white/65">{tip}</span>
          </span>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={prevStep} disabled={isVerifying} className={AUTH_SECONDARY_CLASS}>
          <ArrowLeft className="h-[15px] w-[15px]" />
          Atrás
        </button>
        <button
          onClick={handleVerify}
          disabled={!isCodeComplete || isVerifying}
          // Verificando, el botón conserva el naranja (está trabajando); sin el
          // código completo, se apaga.
          className={isCodeComplete || isVerifying ? AUTH_SUBMIT_CLASS : AUTH_SUBMIT_IDLE_CLASS}
        >
          {isVerifying ? "Verificando…" : "Verificar código"}
          {isVerifying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
};

export default VerificationStep;
