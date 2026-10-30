import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, LogOut, ShieldCheck, CircleAlert, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch } from "react-redux";
import ProfessionStep from "./steps/ProfessionStep";
import AccountDetailsStep from "./steps/AccountDetailsStep";
import VerificationStep from "./steps/VerificationStep";
import CompletionStep from "./steps/CompletionStep";
import { OnboardingService, OnboardingData } from "../../services/onboarding";
import { setAuth } from "@/store/states/authSlice";
import { AuthService } from "@/services/auth";
import { SplitmeLogo } from "@/components/brand/SplitmeLogo";

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

/** Titular y explicación del panel lateral en cada paso. */
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
    <div className="flex min-h-screen bg-white">
      {/* Paso actual */}
      <div className="flex w-full flex-col justify-between gap-8 px-6 py-8 sm:px-12 lg:w-[560px] lg:flex-shrink-0 lg:px-16 lg:py-10">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4">
            <SplitmeLogo className="h-[34px] text-[#1C1D22]" />
            <button
              onClick={() => AuthService.logout()}
              className="flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-[12.5px] font-medium text-[#A6AAB2] transition-colors hover:bg-[#F4F5F7] hover:text-[#1C1D22] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
            >
              <LogOut className="h-[15px] w-[15px]" />
              Cerrar sesión
            </button>
          </div>

          {/* Progreso compacto: sustituye al mapa lateral en pantallas pequeñas */}
          <div className="flex flex-col gap-2 lg:hidden">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-medium tracking-[1.3px] text-[#A6AAB2]">
                PASO {roadmapPosition} DE {ROADMAP.length}
              </span>
              <span className="text-[12px] font-semibold text-[#1C1D22]">
                {ROADMAP[roadmapPosition - 1].name}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F4F5F7]">
              <div
                className="h-full rounded-full bg-[#FF5C00] transition-all"
                style={{ width: `${(roadmapPosition / ROADMAP.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {onboardingError && (
            <p
              role="alert"
              className="flex items-center gap-2 rounded-[14px] bg-[#FDECEC] px-3.5 py-2.5 text-[12px] leading-snug text-[#E5484D]"
            >
              <CircleAlert className="h-4 w-4 flex-shrink-0" />
              {onboardingError}
            </p>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {stepComponents[currentStep]}
            </motion.div>
          </AnimatePresence>
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
            PASO {roadmapPosition} DE {ROADMAP.length}
          </span>
          <h2 className="max-w-[620px] font-display text-[34px] font-semibold leading-[1.18] text-white">
            {copy.headline}
          </h2>
        </div>

        <ol className="flex flex-col">
          {ROADMAP.map((step, index) => {
            const position = index + 1;
            const done = position < roadmapPosition;
            const current = position === roadmapPosition;
            return (
              <li key={step.name} className="flex flex-col">
                {index > 0 && <span className="ml-[15px] h-[18px] w-0.5 bg-white/10" />}
                <div className="flex items-center gap-3.5">
                  <span
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-mono text-[12px] font-semibold ${
                      done
                        ? "bg-[#2FB37E] text-white"
                        : current
                          ? "bg-[#FF5C00] text-white"
                          : "border-[1.5px] border-white/15 text-white/40"
                    }`}
                  >
                    {done ? <Check className="h-[15px] w-[15px]" /> : position}
                  </span>
                  <span className="flex flex-col">
                    <span
                      className={`text-[14px] font-semibold ${current ? "text-white" : done ? "text-white/80" : "text-white/50"}`}
                    >
                      {step.name}
                    </span>
                    <span className={`text-[12px] ${current ? "text-white/60" : "text-white/30"}`}>
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
            <span className="text-[13px] font-semibold text-white">{copy.noteTitle}</span>
            <span className="text-[12px] leading-relaxed text-white/60">{copy.noteText}</span>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default OnboardingContainer;
