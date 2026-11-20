import { useState, useEffect } from "react";
import { Mic, SlidersHorizontal, Music, User, Check, ArrowRight, LucideIcon } from "lucide-react";
import { OnboardingData } from "../../../services/onboarding";
import { AuthHeading } from "@/components/auth/AuthShell";
import { AUTH_SUBMIT_CLASS, AUTH_SUBMIT_IDLE_CLASS, authChoiceClass } from "@/components/auth/authStyles";

interface ProfessionStepProps {
  nextStep: (data?: Partial<OnboardingData>) => void;
  initialData?: OnboardingData;
}

interface Profession {
  id: string;
  name: string;
  description: string;
  Icon: LucideIcon;
}

const PROFESSIONS: Profession[] = [
  { id: "artista", name: "Artista", description: "Cantante, músico o intérprete", Icon: Mic },
  {
    id: "productor",
    name: "Productor",
    description: "Productor musical o de audio",
    Icon: SlidersHorizontal,
  },
  {
    id: "compositor",
    name: "Compositor",
    description: "Compositor o escritor de canciones",
    Icon: Music,
  },
  { id: "otro", name: "Otro", description: "Otra profesión musical", Icon: User },
];

const OTHER_PROFESSIONS = [
  "Ingeniero de sonido",
  "Diseñador de sonido",
  "Diseñador de audio",
  "Ingeniero de mezcla",
  "Ingeniero de masterización",
  "Ingeniero de grabación",
  "Manager musical",
  "Promotor de eventos",
  "DJ",
  "Locutor",
  "Podcaster",
];

const parse = (val?: string): string[] =>
  val
    ? val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

const ProfessionStep = ({ nextStep, initialData }: ProfessionStepProps) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedOther, setSelectedOther] = useState<string[]>([]);

  useEffect(() => {
    const initProfs =
      initialData?.professions && initialData.professions.length > 0
        ? initialData.professions
        : parse(initialData?.profession);
    if (initProfs.length > 0) setSelected(initProfs);
    if (initialData?.otherProfession) setSelectedOther(parse(initialData.otherProfession));
  }, [initialData]);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const toggleOther = (prof: string) => {
    setSelectedOther((prev) =>
      prev.includes(prof) ? prev.filter((p) => p !== prof) : [...prev, prof],
    );
  };

  const showOther = selected.includes("otro");
  const canContinue = selected.length > 0 && (!showOther || selectedOther.length > 0);

  const handleSubmit = () => {
    if (!canContinue) return;
    // "otro" se reemplaza por las profesiones concretas elegidas dentro de él
    const finalProfs = [
      ...selected.filter((p) => p !== "otro"),
      ...(showOther ? selectedOther : []),
    ];
    nextStep({
      profession: finalProfs.join(","),
      otherProfession: showOther ? selectedOther.join(",") : undefined,
    });
  };

  return (
    <div className="flex flex-col gap-[22px]">
      <AuthHeading title="¿Cuál es tu profesión?" subtitle="Elige todas las que apliquen." />

      <div className="grid grid-cols-2 gap-3">
        {PROFESSIONS.map(({ id, name, description, Icon }) => {
          const isSelected = selected.includes(id);
          return (
            <button
              key={id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggle(id)}
              className={`flex flex-col gap-2.5 rounded-[18px] p-4 text-left ${authChoiceClass(isSelected)}`}
            >
              <span className="flex items-start justify-between">
                <Icon className={`h-6 w-6 ${isSelected ? "text-[#FF8A3D]" : "text-white/50"}`} />
                {isSelected && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF5C00]">
                    <Check className="h-3 w-3 text-white" />
                  </span>
                )}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-[14.5px] font-semibold text-white">{name}</span>
                <span className={`text-[11.5px] leading-snug ${isSelected ? "text-[#FFB48A]" : "text-white/55"}`}>
                  {description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] text-white/50">Elegidas:</span>
          {selected.map((id) => {
            const p = PROFESSIONS.find((pr) => pr.id === id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                aria-label={`Quitar ${p?.name}`}
                className="flex items-center gap-1.5 rounded-full bg-[#FF5C00]/[0.18] px-2.5 py-1.5 text-[11.5px] font-semibold text-[#FFB48A] transition-colors hover:bg-[#FF5C00]/[0.28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
              >
                {p?.name}
                <span aria-hidden="true">✕</span>
              </button>
            );
          })}
        </div>
      )}

      {showOther && (
        <div className="flex flex-col gap-2.5">
          <p className="text-[12.5px] font-medium text-white/70">¿Cuál en concreto? Elige las que apliquen.</p>
          <div className="grid max-h-56 grid-cols-2 gap-2.5 overflow-y-auto pr-1">
            {OTHER_PROFESSIONS.map((prof) => {
              const isSelected = selectedOther.includes(prof);
              return (
                <button
                  key={prof}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggleOther(prof)}
                  className={`flex items-center justify-between gap-2 rounded-[14px] px-3 py-2.5 text-left text-[12.5px] ${authChoiceClass(
                    isSelected,
                  )} ${isSelected ? "font-semibold text-[#FFB48A]" : "text-white/85"}`}
                >
                  <span>{prof}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canContinue}
        className={canContinue ? AUTH_SUBMIT_CLASS : AUTH_SUBMIT_IDLE_CLASS}
      >
        Continuar
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ProfessionStep;
