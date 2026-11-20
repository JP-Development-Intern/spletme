import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Handshake, Users, Wallet, ArrowRight, Check, ChevronRight } from "lucide-react";
import { setAuth } from "@/store/states/authSlice";
import { AuthHeading } from "@/components/auth/AuthShell";
import { AUTH_SUBMIT_CLASS } from "@/components/auth/authStyles";

/** Siguientes pasos reales dentro del panel, en el orden en que conviene hacerlos. */
const NEXT_STEPS = [
  {
    Icon: Handshake,
    title: "Conecta un distribuidor",
    description: "Sube el reporte y calculamos el reparto",
    to: "/panel/dealers",
  },
  {
    Icon: Users,
    title: "Invita a tus colaboradores",
    description: "Cada uno ve lo que le toca",
    to: "/panel/collaborators",
  },
  {
    Icon: Wallet,
    title: "Configura tu banco",
    description: "Para recibir los pagos por Stripe o Wise",
    to: "/panel/wallet",
  },
];

const CompletionStep = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  /** Marca el onboarding como completado antes de salir, pase lo que pase en el backend. */
  const completeAndGo = (to: string) => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      user.onboardingCompleted = true;
      localStorage.setItem("user", JSON.stringify(user));
      dispatch(setAuth({ isAuth: "true", user }));
    }
    navigate(to);
  };

  const firstName = (() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") ?? "{}");
      const name = typeof user.name === "string" ? user.name.trim().split(" ")[0] : "";
      return name || "";
    } catch {
      return "";
    }
  })();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3.5">
        <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#45D39A]/[0.16] ring-1 ring-[#45D39A]/30">
          <Check className="h-8 w-8 text-[#45D39A]" />
        </span>
        <AuthHeading
          title={firstName ? `¡Todo listo, ${firstName}!` : "¡Todo listo!"}
          subtitle="Tu cuenta quedó verificada y tu perfil configurado. Ya puedes gestionar tus regalías."
        />
      </div>

      <div className="flex flex-col gap-2.5">
        {NEXT_STEPS.map(({ Icon, title, description, to }) => (
          <button
            key={title}
            onClick={() => completeAndGo(to)}
            className="group flex items-center gap-3.5 rounded-[18px] border border-white/[0.14] bg-white/[0.05] px-4 py-3.5 text-left transition-colors hover:border-white/[0.24] hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
          >
            <span className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[13px] bg-[#FF5C00]/[0.16]">
              <Icon className="h-[17px] w-[17px] text-[#FF8A3D]" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-[13.5px] font-semibold text-white">{title}</span>
              <span className="text-[11.5px] text-white/55">{description}</span>
            </span>
            <ChevronRight className="h-4 w-4 flex-shrink-0 text-white/40 transition-colors group-hover:text-white/80" />
          </button>
        ))}
      </div>

      <button
        onClick={() => completeAndGo("/panel/home")}
        className={AUTH_SUBMIT_CLASS}
      >
        Entrar al panel
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export default CompletionStep;
