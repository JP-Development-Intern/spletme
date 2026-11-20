import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowRight,
  Coins,
  Plus,
  Trash2,
  AlertCircle,
} from "lucide-react";
import {
  ModalShell,
  ModalMark,
  FieldLabel,
  FooterNote,
  PrimaryButton,
  SecondaryButton,
} from "@/components/ui/ModalShell";
import { accountingApi } from "@/services/accounting";
import type {
  Accounting,
  AccountingStatus,
  CreateAccountingDto,
} from "../../../../../types/accounting.types";

interface ExtraordinaryCostsProps {
  songId: string;
  /** Repartible actual, para enseñar cómo lo mueve un costo antes de guardarlo. */
  distributable?: number;
  songTitle?: string;
}

type FormState = {
  concept: string;
  amount: string;
  date: string;
  description: string;
  status: AccountingStatus;
};

const STATUS_LABELS: Record<AccountingStatus, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  cancelled: "Cancelado",
};

const STATUS_CLASSES: Record<AccountingStatus, string> = {
  pending: "bg-[#FF5C00]/[0.16] text-[#FF9A5C]",
  paid: "bg-[#45D39A]/[0.12] text-[#45D39A]",
  cancelled: "bg-white/[0.08] text-white/65",
};

const CONCEPT_LABELS: Record<string, string> = {
  INCOME: "Ingreso",
  EXPENSE: "Egreso",
};

const conceptLabel = (concept: string): string => CONCEPT_LABELS[concept.toUpperCase()] ?? concept;

const isIncome = (concept: string): boolean =>
  concept.toUpperCase() === "INCOME" || concept === "Ingreso";

const toNum = (v: unknown): number => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return isFinite(v) ? v : 0;
  const cleaned = String(v).replace(/,/g, "");
  const parsed = parseFloat(cleaned);
  return isFinite(parsed) ? parsed : 0;
};

const money = (v: unknown): string =>
  toNum(v).toLocaleString("es-CO", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtInput = (v: string) => {
  const s = v.replace(/,/g, "").replace(/[^\d.]/g, "");
  if (!s) return "";
  const [intRaw, decRaw = ""] = s.split(".");
  const intVal = intRaw.replace(/^0+(?=\d)/, "");
  const intFmt = intVal ? Number(intVal).toLocaleString("en-US") : "0";
  const dec = decRaw.slice(0, 2);
  return s.includes(".") ? `${intFmt}.${dec}` : intFmt;
};

const parseAmt = (v: string) => parseFloat(v.replace(/,/g, "")) || 0;

const formatDate = (v?: string) => {
  if (!v) return "—";
  const p = new Date(v);
  if (Number.isNaN(p.getTime())) return "—";
  return p.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
};

const initialForm = (): FormState => ({
  concept: "EXPENSE",
  amount: "",
  date: new Date().toISOString().split("T")[0],
  description: "",
  status: "pending",
});

const INPUT_CLASS =
  "w-full rounded-[16px] border border-[#E8E8EC] bg-white px-3.5 py-3 text-[13px] text-[#1C1D22] outline-none transition-colors focus:border-[#FF5C00] focus:ring-2 focus:ring-[#FF5C00]/25";

const ExtraordinaryCosts = ({ songId, distributable = 0, songTitle }: ExtraordinaryCostsProps) => {
  const [costs, setCosts] = useState<Accounting[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm());

  useEffect(() => {
    if (!songId) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await accountingApi.getBySongId(songId);
        if (active) setCosts(Array.isArray(data) ? data : []);
      } catch {
        if (active) setError("No se pudieron traer los costos.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [songId]);

  const ingresos = useMemo(
    () => costs.filter((c) => isIncome(c.concept)).reduce((s, c) => s + toNum(c.amount), 0),
    [costs],
  );
  const egresos = useMemo(
    () => costs.filter((c) => !isIncome(c.concept)).reduce((s, c) => s + toNum(c.amount), 0),
    [costs],
  );
  const balance = ingresos - egresos;

  const resetForm = () => setForm(initialForm());

  const handleCreate = async () => {
    if (!songId) {
      setError("No se encontró la canción.");
      return;
    }
    const concept = form.concept.trim().toUpperCase();
    const amountValue = parseAmt(form.amount);
    if (!concept) {
      setError("Elige si es un ingreso o un egreso.");
      return;
    }
    if (!isFinite(amountValue) || amountValue <= 0) {
      setError("El monto tiene que ser mayor que cero.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: CreateAccountingDto = {
        concept,
        amount: amountValue,
        songId,
        date: form.date ? new Date(form.date).toISOString() : undefined,
        description: form.description.trim() || undefined,
        status: form.status,
      };
      const created = await accountingApi.create(payload);
      setCosts((prev) => [created, ...prev]);
      resetForm();
      setShowForm(false);
    } catch {
      setError("No se pudo guardar el costo.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await accountingApi.delete(id);
      setCosts((prev) => prev.filter((i) => i._id !== id));
    } catch {
      setError("No se pudo eliminar el costo.");
    }
  };

  // Lo que el costo del formulario le haría al repartible si se guardara.
  const draftAmount = parseAmt(form.amount);
  const draftEffect = isIncome(form.concept) ? draftAmount : -draftAmount;
  const nextDistributable = Math.max(0, distributable + draftEffect);

  return (
    <>
      <section className="glass overflow-hidden rounded-[28px]">
        <header className="flex flex-wrap items-center justify-between gap-3.5 px-5 py-[18px]">
          <div className="flex flex-col gap-0.5">
            <h3 className="font-display text-[19px] font-medium tracking-[-0.005em] text-white">
              Lo que entra y sale por fuera
            </h3>
            <p className="text-[12.5px] text-white/65">
              Mezcla, máster, promoción: se restan antes de repartir
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-[7px] rounded-full bg-[#FF5C00] px-4 py-2.5 text-[12px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(255,92,0,0.35)] transition-colors hover:bg-[#EA580C] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <Plus className="h-3.5 w-3.5" />
            Apuntar un costo
          </button>
        </header>

        <div className="h-px bg-white/[0.09]" />

        <div className="flex flex-wrap items-stretch">
          <Figure label="INGRESOS EXTRA" value={money(ingresos)} tone="text-[#45D39A]" />
          <div className="w-px self-stretch bg-white/[0.09]" />
          <Figure label="COSTOS" value={money(egresos)} tone="text-[#FF8F92]" />
          <div className="w-px self-stretch bg-white/[0.09]" />
          <Figure
            label="EFECTO EN EL REPARTIBLE"
            value={`${balance < 0 ? "−" : "+"}${money(Math.abs(balance))}`}
            tone={balance < 0 ? "text-[#FF8F92]" : "text-white"}
          />
        </div>

        <div className="h-px bg-white/[0.09]" />

        {error && !showForm && (
          <div className="flex items-center gap-2.5 bg-[#E5484D]/[0.14] px-5 py-3">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-[#FF8F92]" />
            <span className="flex-1 text-[12px] font-medium text-[#FF8F92]">{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-[11px] font-semibold text-[#FF8F92] underline hover:text-white"
            >
              Descartar
            </button>
          </div>
        )}

        {loading ? (
          <p className="py-14 text-center text-sm text-white/65">Trayendo los costos…</p>
        ) : costs.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 py-14 text-center">
            <span className="grid h-[58px] w-[58px] place-items-center rounded-[20px] bg-[#FF5C00]/15">
              <Coins className="h-6 w-6 text-[#FF8A3D]" />
            </span>
            <p className="text-[15px] font-semibold text-white">
              No hay costos apuntados en esta canción
            </p>
            <p className="max-w-[400px] text-[13px] text-white/65">
              Todo lo que entra se reparte tal cual. Apunta un costo si hubo gastos que descontar
              antes.
            </p>
          </div>
        ) : (
          <ul>
            {costs.map((item, index) => {
              const income = isIncome(item.concept);
              return (
                <li key={item._id}>
                  {index > 0 && <div className="h-px bg-white/[0.09]" />}
                  <div className="flex flex-wrap items-center gap-3.5 px-5 py-3">
                    <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[12px] bg-white/[0.06]">
                      {income ? (
                        <ArrowUpCircle className="h-[18px] w-[18px] text-[#45D39A]" />
                      ) : (
                        <ArrowDownCircle className="h-[18px] w-[18px] text-[#FF8F92]" />
                      )}
                    </span>
                    <div className="min-w-[180px] flex-1">
                      <p className="truncate text-[13px] font-semibold text-white">
                        {item.description || conceptLabel(item.concept)}
                      </p>
                      <p className="truncate text-[11px] text-white/50">
                        {conceptLabel(item.concept)} · {formatDate(item.date || item.createdAt)}
                      </p>
                    </div>
                    <p
                      className={`w-[130px] shrink-0 whitespace-nowrap font-mono text-[13px] font-semibold ${
                        income ? "text-[#45D39A]" : "text-[#FF8F92]"
                      }`}
                    >
                      {income ? "+" : "−"}
                      {money(item.amount)}
                    </p>
                    <span
                      className={`w-[104px] shrink-0 ${STATUS_CLASSES[item.status]} inline-flex justify-center rounded-[14px] px-2.5 py-[5px] text-[10.5px] font-semibold`}
                    >
                      {STATUS_LABELS[item.status]}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(item._id)}
                      aria-label="Eliminar este costo"
                      title="Eliminar este costo"
                      className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full bg-white/[0.06] text-[#FF8F92] transition-colors hover:bg-white/[0.12] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {costs.length > 0 && (
          <>
            <div className="h-px bg-white/[0.09]" />
            <footer className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
              <span className="flex items-center gap-2.5 text-[12px] text-white/65">
                <Coins className="h-3.5 w-3.5" />
                {costs.length} {costs.length === 1 ? "apunte" : "apuntes"}
              </span>
              <span className="text-[11px] text-white/50">
                Estos importes ya están descontados en la cascada del resumen
              </span>
            </footer>
          </>
        )}
      </section>

      {showForm && (
        <ModalShell
          title="Nuevo costo extraordinario"
          subtitle={songTitle || "Esta canción"}
          logo={
            <ModalMark>
              <Coins className="h-[18px] w-[18px]" />
            </ModalMark>
          }
          locked={saving}
          onClose={() => setShowForm(false)}
          footer={
            <>
              <FooterNote>Un costo cambia lo que se reparte, no lo que ya se pagó.</FooterNote>
              <SecondaryButton
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                disabled={saving}
              >
                Cancelar
              </SecondaryButton>
              <PrimaryButton onClick={handleCreate} disabled={saving}>
                {saving ? "Guardando…" : "Guardar costo"}
              </PrimaryButton>
            </>
          }
        >
          {error && (
            <div className="flex items-center gap-2.5 rounded-[14px] bg-[#FDECEC] px-3 py-2.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-[#E5484D]" />
              <span className="text-[11.5px] font-medium text-[#E5484D]">{error}</span>
            </div>
          )}

          <Field label="TIPO" required>
            <div className="flex flex-wrap items-center gap-[7px]">
              {[
                { value: "EXPENSE", label: "Egreso" },
                { value: "INCOME", label: "Ingreso" },
              ].map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  active={form.concept === option.value}
                  onClick={() => setForm((p) => ({ ...p, concept: option.value }))}
                />
              ))}
            </div>
          </Field>

          <Field label="CONCEPTO" required>
            <input
              type="text"
              placeholder="Mezcla y máster, promoción, diseño de portada…"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className={INPUT_CLASS}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="MONTO" required>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-[13px] text-[#A6AAB2]">
                  $
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm((p) => ({ ...p, amount: fmtInput(e.target.value) }))}
                  className={`${INPUT_CLASS} pl-7 font-mono`}
                />
              </div>
            </Field>
            <Field label="FECHA">
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                className={INPUT_CLASS}
              />
            </Field>
          </div>

          <Field label="ESTADO">
            <div className="flex flex-wrap items-center gap-[7px]">
              {(["pending", "paid"] as AccountingStatus[]).map((status) => (
                <Chip
                  key={status}
                  label={STATUS_LABELS[status]}
                  active={form.status === status}
                  onClick={() => setForm((p) => ({ ...p, status }))}
                />
              ))}
            </div>
          </Field>

          {distributable > 0 && draftAmount > 0 && (
            <div className="flex flex-col gap-2.5 rounded-[18px] bg-[#F4F5F7] px-5 py-[18px]">
              <span className="font-mono text-[9.5px] font-medium tracking-[1.2px] text-[#A6AAB2]">
                LO QUE CAMBIA AL GUARDARLO
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-[20px] font-medium text-[#A6AAB2]">
                  {money(distributable)}
                </span>
                <ArrowRight className="h-4 w-4 text-[#A6AAB2]" />
                <span className="font-mono text-[20px] font-semibold text-[#1C1D22]">
                  {money(nextDistributable)}
                </span>
              </div>
              <p className="text-[11.5px] text-[#71757E]">
                Es lo que quedaría por repartir entre quienes cobran de la canción.
              </p>
            </div>
          )}
        </ModalShell>
      )}
    </>
  );
};

const Figure = ({ label, value, tone }: { label: string; value: string; tone: string }) => (
  <div className="flex min-w-[180px] flex-1 flex-col gap-1.5 px-5 py-4">
    <span className="font-mono text-[9.5px] font-medium tracking-[1.2px] text-white/50">
      {label}
    </span>
    <span className={`font-mono text-[22px] font-light tracking-[-0.015em] ${tone}`}>{value}</span>
  </div>
);

const Field = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-2">
    <FieldLabel required={required}>{label}</FieldLabel>
    {children}
  </div>
);

const Chip = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`rounded-[14px] border px-3 py-[7px] text-[11.5px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00] ${
      active
        ? "border-[#FF5C00] bg-[#FFEADD] font-semibold text-[#FF5C00]"
        : "border-[#E8E8EC] bg-white font-medium text-[#71757E]"
    }`}
  >
    {label}
  </button>
);

export default ExtraordinaryCosts;
