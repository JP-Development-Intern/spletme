import "./home.css";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/PageHeader";
import { DashboardStatsStrip } from "@/components/home/DashboardStatsStrip";
import { PlatformsCard } from "@/components/home/PlatformsCard";
import { PerformanceChart } from "@/components/home/PerformanceChart";
import { WalletSection } from "@/components/home/WalletSection";
import { TopSongsShowcase } from "@/components/home/TopSongsShowcase";
import { useHomeDashboard } from "@/hooks/useHomeDashboard";
import { usePlatformBreakdown } from "@/hooks/usePlatformBreakdown";
import { useWalletAccountsStatus } from "@/hooks/useWalletAccountsStatus";
import LocalStorageService from "@/services/localstorage";
import { DashboardIntro, useReveal } from "@/components/home/dashboardIntro";

/** Periodos del selector, con cómo se leen dentro de una frase. */
const PERIODS = [
  { value: "7d", label: "7 días", phrase: "los últimos 7 días" },
  { value: "30d", label: "30 días", phrase: "los últimos 30 días" },
  { value: "90d", label: "90 días", phrase: "los últimos 90 días" },
  { value: "1y", label: "1 año", phrase: "el último año" },
];

export default function Home() {
  return (
    <DashboardIntro>
      <HomeContent />
    </DashboardIntro>
  );
}

/**
 * Orden de la entrada, en segundos desde el montaje: de arriba abajo y de lo
 * general a lo particular. La franja de cifras va primero porque es lo que se
 * viene a mirar; la columna derecha entra a la vez que la izquierda.
 */
const AT = {
  greeting: 0,
  periods: 0.06,
  stats: 0.12,
  chart: 0.22,
  wallet: 0.26,
  songs: 0.32,
  platforms: 0.36,
};

function HomeContent() {
  const {
    user,
    selectedTimeframe,
    setSelectedTimeframe,
    topSongs,
    summary,
    totalAmount,
    netBalance,
    points,
    loading,
  } = useHomeDashboard();
  const greetingReveal = useReveal(AT.greeting);
  const periodsReveal = useReveal(AT.periods);

  const { platforms, totalIncome: historicalIncome, loading: platformsLoading } = usePlatformBreakdown();
  const { loading: walletAccountsLoading, sendActive, receiveActive } = useWalletAccountsStatus();
  const navigate = useNavigate();

  const firstName = (LocalStorageService.getItem("user")?.name || user?.name || "").split(" ")[0];
  const periodPhrase = PERIODS.find((p) => p.value === selectedTimeframe)?.phrase ?? "el periodo seleccionado";

  return (
    <div className="flex flex-col gap-6 px-4 lg:pl-4 lg:pr-8">
      <PageHeader>
        <motion.div {...greetingReveal} className="flex flex-col gap-1">
          <h1 className="truncate font-display text-[32px] font-light leading-[38px] tracking-[-0.015em] text-white sm:text-[40px] sm:leading-[46px]">
            {firstName ? `Hola, ${firstName}` : "Hola"}
          </h1>
          <p className="text-sm text-white/65">Así va tu catálogo en {periodPhrase}</p>
        </motion.div>
      </PageHeader>

      {/* El periodo gobierna toda la página, no solo el gráfico */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Periodo">
        {PERIODS.map((period) => {
          const selected = selectedTimeframe === period.value;
          return (
            <motion.button
              {...periodsReveal}
              key={period.value}
              aria-pressed={selected}
              onClick={() => setSelectedTimeframe(period.value)}
              className={`rounded-full px-[18px] py-2.5 text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 ${
                selected
                  ? "bg-[#F7EDE6]/[0.92] font-semibold text-[#1C1D22]"
                  : "glass-control font-medium text-white hover:bg-white/[0.12]"
              }`}
            >
              {period.label}
            </motion.button>
          );
        })}
      </div>

      <DashboardStatsStrip
        totalNetIncome={summary.totalNetIncome}
        totalStreams={summary.totalStreams}
        songsCount={summary.songsWithMatches}
        netBalance={netBalance}
        totalAmount={totalAmount}
        at={AT.stats}
      />

      <div className="flex flex-col gap-5 xl:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <PerformanceChart points={points} timeframe={selectedTimeframe} loading={loading} at={AT.chart} />
          <TopSongsShowcase songs={topSongs} historicalIncome={historicalIncome} at={AT.songs} />
        </div>

        <div className="flex w-full flex-col gap-5 xl:w-[360px] xl:flex-shrink-0">
          <WalletSection
            loading={walletAccountsLoading}
            sendActive={sendActive}
            receiveActive={receiveActive}
            onGoToBank={() => navigate("/panel/wallet")}
            at={AT.wallet}
          />
          <PlatformsCard
            platforms={platforms}
            totalIncome={historicalIncome}
            loading={platformsLoading}
            at={AT.platforms}
          />
        </div>
      </div>
    </div>
  );
}
