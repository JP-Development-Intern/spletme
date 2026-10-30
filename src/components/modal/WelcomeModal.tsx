import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart2, SplitSquareHorizontal, Wallet,
  Users, Globe, ShieldCheck, ArrowRight,
} from "lucide-react";
import { SplitmeLogo } from "@/components/brand/SplitmeLogo";

interface WelcomeModalProps {
  isOpen: boolean;
  userName?: string;
  onContinue: () => void;
}

const BENEFITS = [
  {
    icon: <BarChart2 className="w-5 h-5 text-orange-500" />,
    bg: "bg-orange-50",
    title: "Seguimiento de streams",
    desc: "Monitorea tus reproducciones en Spotify, Apple Music, YouTube y más plataformas desde un solo lugar.",
  },
  {
    icon: <SplitSquareHorizontal className="w-5 h-5 text-indigo-500" />,
    bg: "bg-indigo-50",
    title: "División de regalías",
    desc: "Divide automáticamente los pagos entre artistas, productores y colaboradores con porcentajes exactos.",
  },
  {
    icon: <Wallet className="w-5 h-5 text-green-500" />,
    bg: "bg-green-50",
    title: "Billetera digital",
    desc: "Gestiona tus ingresos, solicita retiros y mantén un historial claro de todos tus pagos.",
  },
  {
    icon: <Users className="w-5 h-5 text-blue-500" />,
    bg: "bg-blue-50",
    title: "Gestión de colaboradores",
    desc: "Agrega productores, compositores y labels a tus proyectos y controla quién tiene acceso a qué.",
  },
  {
    icon: <Globe className="w-5 h-5 text-purple-500" />,
    bg: "bg-purple-50",
    title: "Análisis por país y plataforma",
    desc: "Visualiza de dónde vienen tus reproducciones e ingresos con gráficas detalladas.",
  },
  {
    icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
    bg: "bg-emerald-50",
    title: "Historial y trazabilidad",
    desc: "Cada cambio en los splits queda registrado. Transparencia total para ti y tus colaboradores.",
  },
];

export function WelcomeModal({ isOpen, userName, onContinue }: WelcomeModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 16 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl my-auto"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] px-7 pt-8 pb-7 text-white">
              <div className="flex items-center gap-3 mb-5">
                <SplitmeLogo variant="wordmark" className="h-6 text-white" />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <h2 className="text-2xl font-bold leading-tight mb-1">
                  ¡Bienvenido{userName ? `, ${userName}` : ""}! 🎉
                </h2>
                <p className="text-[#94A3B8] text-sm">
                  Tu cuenta fue creada exitosamente. Esto es lo que puedes hacer en SplitMe:
                </p>
              </motion.div>
            </div>

            {/* Benefits grid */}
            <div className="px-7 py-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BENEFITS.map((b, i) => (
                <motion.div
                  key={b.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.06 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <div className={`w-9 h-9 ${b.bg} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    {b.icon}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-900 leading-snug">{b.title}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{b.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-7 pb-7 pt-2">
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                onClick={onContinue}
                className="w-full flex items-center justify-center gap-2 text-white font-semibold text-[15px] transition-opacity hover:opacity-90"
                style={{ height: 46, borderRadius: 10, backgroundColor: "#F97316" }}
              >
                Ir a iniciar sesión
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
