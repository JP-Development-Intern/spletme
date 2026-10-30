import "./home.css";
import { useNavigate } from "react-router-dom";
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

/** Periodos del selector, con cómo se leen dentro de una frase. */
const PERIODS = [
  { value: "7d", label: "7 días", phrase: "los últimos 7 días" },
  { value: "30d", label: "30 días", phrase: "los últimos 30 días" },
  { value: "90d", label: "90 días", phrase: "los últimos 90 días" },
  { value: "1y", label: "1 año", phrase: "el último año" },
];

export default function Home() {
  const {
    user,
    selectedTimeframe,
    setSelectedTimeframe,
    topSongs,
    summary,
    totalAmount,
    netBalance,
    points,
  } = useHomeDashboard();

  const { platforms, totalIncome: historicalIncome, loading: platformsLoading } = usePlatformBreakdown();
  const { loading: walletAccountsLoading, sendActive, receiveActive } = useWalletAccountsStatus();
  const navigate = useNavigate();

  const firstName = (LocalStorageService.getItem("user")?.name || user?.name || "").split(" ")[0];
  const periodPhrase = PERIODS.find((p) => p.value === selectedTimeframe)?.phrase ?? "el periodo seleccionado";

  return (
    <div className="flex flex-col gap-6 px-4 lg:pl-4 lg:pr-8">
      <PageHeader>
        <div className="flex flex-col gap-1">
          <h1 className="truncate font-display text-[32px] font-light leading-[38px] tracking-[-0.015em] text-white sm:text-[40px] sm:leading-[46px]">
            {firstName ? `Hola, ${firstName}` : "Hola"}
          </h1>
          <p className="text-sm text-white/65">Así va tu catálogo en {periodPhrase}</p>
        </div>
      </PageHeader>

      {/* El periodo gobierna toda la página, no solo el gráfico */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Periodo">
        {PERIODS.map((period) => {
          const selected = selectedTimeframe === period.value;
          return (
            <button
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
            </button>
          );
        })}
      </div>

      <DashboardStatsStrip
        totalNetIncome={summary.totalNetIncome}
        totalStreams={summary.totalStreams}
        songsCount={summary.songsWithMatches}
        netBalance={netBalance}
        totalAmount={totalAmount}
      />

      <div className="flex flex-col gap-5 xl:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <PerformanceChart points={points} timeframe={selectedTimeframe} />
          <TopSongsShowcase songs={topSongs} historicalIncome={historicalIncome} />
        </div>

        <div className="flex w-full flex-col gap-5 xl:w-[360px] xl:flex-shrink-0">
          <WalletSection
            loading={walletAccountsLoading}
            sendActive={sendActive}
            receiveActive={receiveActive}
            onGoToBank={() => navigate("/panel/wallet")}
          />
          <PlatformsCard platforms={platforms} totalIncome={historicalIncome} loading={platformsLoading} />
        </div>
      </div>
    </div>
  );
}
