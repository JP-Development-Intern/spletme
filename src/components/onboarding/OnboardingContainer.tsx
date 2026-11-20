import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, ShieldCheck, CircleAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch } from "react-redux";
import ProfessionStep from "./steps/ProfessionStep";
import AccountDetailsStep from "./steps/AccountDetailsStep";
import VerificationStep from "./steps/VerificationStep";
import CompletionStep from "./steps/CompletionStep";
import { OnboardingService, OnboardingData } from "../../services/onboarding";
import { setAuth } from "@/store/states/authSlice";
import { AuthService } from "@/services/auth";
import { AuthShell } from "@/components/auth/AuthShell";

const TOTAL_STEPS = 4;

/**
 * Mapa completo del alta. Incluye la creación de la cuenta, que ya ocurrió antes
 * de llegar aquí, para que se vea el recorrido entero y no solo lo que falta.
 */
const ROADMAP = [
  { name: "Crea tu cuenta", detail: "Usuario, correo y contraseña" },
  { name: "Tu profesión", detail: "Para qué usas Splitme" },
  { name: "Tus datos", detail: "País, contacto e identificación" },
  { name: "Verifica tu correo", detail: "Código de 6 dígitos" },
  { name: "Listo", detail: "Entra al panel" },
];

/**
 * Por qué se pide lo de cada paso. El titular viejo del panel lateral ya no se
 * usa: cada paso trae su propio título dentro de la tarjeta.
 */
const STEP_COPY: Record<number, { headline: string; noteTitle: string; noteText: string }> = {
  1: {
    headline: "Cuéntanos a qué te dedicas.",
    noteTitle: "Para qué sirve",
    noteText:
      "Con tu profesión ajustamos el panel: un compositor ve sus splits de obra, un productor sus adelantos.",
  },
  2: {
    headline: "Dónde estás y cómo te pagamos.",
    noteTitle: "Para qué sirve",
    noteText:
      "El país define la moneda y los impuestos; la identificación es lo que Stripe y Wise piden para transferirte.",
  },
  3: {
    headline: "Confirmemos que el correo es tuyo.",
    noteTitle: "Por qué verificamos",
    noteText:
      "A ese correo llegan los avisos de pago y los enlaces para recuperar la cuenta. Si no es correcto, cámbialo ahora.",
  },
  4: {
    headline: "Tu cuenta ya está lista.",
    noteTitle: "Lo que sigue",
    noteText:
      "Conecta un distribuidor y sube tu primer reporte: en cuanto lo hagas verás el reparto por canción.",
  },
};

const OnboardingContainer = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [currentStep, setCurrentStep] = useState(1);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [onboardingError, setOnboardingError] = useState("");
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    currentStep: 1,
  });

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      const email = typeof user.email === "string" ? user.email.trim().toLowerCase() : "";
      const storedStep = Number(user.onboardingData?.currentStep || 1);

      if (email) {
        setVerificationEmail(email);
      }

      if (user.onboardingCompleted || storedStep >= TOTAL_STEPS) {
        const completedUser = {
          ...user,
          onboardingCompleted: true,
        };
        localStorage.setItem("user", JSON.stringify(completedUser));
        dispatch(setAuth({ isAuth: "true", user: completedUser }));
        navigate("/panel/home", { replace: true });
        return;
      }

      setCurrentStep(storedStep);
      setOnboardingData((prev) => ({
        ...prev,
        ...(user.onboardingData || {}),
        currentStep: storedStep,
      }));
    }
  }, [navigate, dispatch]);

  const updateOnboardingStep = async (
    stepData: Partial<OnboardingData>,
    nextStepNumber?: number,
  ) => {
    try {
      const updatedData: OnboardingData = {
        ...onboardingData,
        ...stepData,
        currentStep: nextStepNumber || currentStep,
      };
      const response = await OnboardingService.updateOnboarding(updatedData);
      if (response.data && response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
        setOnboardingData(updatedData);
      }
      return true;
    } catch (error) {
      console.error("Error updating onboarding:", error);
      return false;
    }
  };

  const nextStep = async (stepData?: Partial<OnboardingData>) => {
    if (currentStep < TOTAL_STEPS) {
      setOnboardingError("");
      const nextStepNumber = currentStep + 1;
      if (stepData) {
        if (nextStepNumber === 3) {
          if (!verificationEmail) {
            setOnboardingError("No encontramos un correo para enviar el código de verificación.");
            return;
          }

          try {
            const requestResponse =
              await OnboardingService.requestAccountVerificationCode(verificationEmail);

            if (!requestResponse.accepted) {
              setOnboardingError("No fue posible enviar el código de verificación.");
              return;
            }
          } catch (error) {
            setOnboardingError(
              error instanceof Error
                ? error.message
                : "No fue posible enviar el código de verificación.",
            );
            return;
          }
        }

        const success = await updateOnboardingStep(stepData, nextStepNumber);
        if (success) {
          setCurrentStep(nextStepNumber);
          if (nextStepNumber === TOTAL_STEPS) {
            const userStr = localStorage.getItem("user");
            if (userStr) {
              const user = JSON.parse(userStr);
              user.onboardingCompleted = true;
              localStorage.setItem("user", JSON.stringify(user));
            }
          }
        } else {
          setOnboardingError("No pudimos guardar tu progreso. Intenta nuevamente.");
        }
      } else {
        setCurrentStep(nextStepNumber);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const stepComponents: Record<number, React.ReactNode> = {
    1: <ProfessionStep nextStep={nextStep} initialData={onboardingData} />,
    2: <AccountDetailsStep nextStep={nextStep} prevStep={prevStep} initialData={onboardingData} />,
    3: (
      <VerificationStep
        nextStep={nextStep}
        prevStep={prevStep}
        initialData={onboardingData}
        verificationEmail={verificationEmail}
      />
    ),
    4: <CompletionStep />,
  };

  // El primer punto del mapa es la cuenta, que ya existe: el paso 1 del wizard
  // es el segundo del recorrido.
  const roadmapPosition = currentStep + 1;
  const copy = STEP_COPY[currentStep];

  return (
    <AuthShell
      // Los datos van a dos columnas: la tarjeta se ensancha solo en ese paso.
      wide={currentStep === 2}
      belowCard={
        <button
          onClick={() => AuthService.logout()}
          className="glass-control flex min-h-[40px] items-center gap-1.5 rounded-full px-4 text-[12.5px] font-medium text-white/75 transition-colors hover:bg-white/[0.12] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
        >
          <LogOut className="h-[15px] w-[15px]" />
          Cerrar sesión
        </button>
      }
    >
      {/*
        Progreso: sustituye al mapa lateral. Un tramo por punto del recorrido,
        incluido «Crea tu cuenta», que ya está hecho, para que se vea el camino
        entero y no solo lo que falta.
      */}
      <div className="flex w-full flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-mono text-[10.5px] font-medium tracking-[1.3px] text-[#FFB48A]">
            PASO {roadmapPosition} DE {ROADMAP.length}
          </span>
          <span className="truncate text-[12px] text-white/60">
            {roadmapPosition < ROADMAP.length ? `Después: ${ROADMAP[roadmapPosition].name}` : "Último paso"}
          </span>
        </div>
        <ol className="grid grid-cols-5 gap-1.5" aria-label="Recorrido del alta">
          {ROADMAP.map((step, index) => {
            const position = index + 1;
            const state = position < roadmapPosition ? "hecho" : position === roadmapPosition ? "actual" : "pendiente";
            return (
              <li
                key={step.name}
                title={step.name}
                aria-current={state === "actual" ? "step" : undefined}
                className={`h-1.5 rounded-full ${
                  state === "pendiente" ? "bg-white/[0.12]" : state === "actual" ? "bg-[#FF5C00]" : "bg-[#FF8A3D]/60"
                }`}
              >
                <span className="sr-only">
                  {step.name}: {state}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {onboardingError && (
        <p
          role="alert"
          className="flex w-full items-center gap-2 rounded-[14px] bg-[#E5484D]/[0.16] px-3.5 py-2.5 text-[12px] leading-snug text-[#FFB3B5]"
        >
          <CircleAlert className="h-4 w-4 flex-shrink-0" />
          {onboardingError}
        </p>
      )}

      {/* La transición anima un envoltorio DENTRO del vidrio, nunca uno que lo contenga. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          className="w-full"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
        >
          {stepComponents[currentStep]}
        </motion.div>
      </AnimatePresence>

      <div className="flex w-full items-start gap-3 rounded-[18px] bg-white/[0.05] px-4 py-3.5">
        <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#FF8A3D]" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[12.5px] font-semibold text-white">{copy.noteTitle}</span>
          <span className="text-[12px] leading-relaxed text-white/60">{copy.noteText}</span>
        </div>
      </div>
    </AuthShell>
  );
};

export default OnboardingContainer;
