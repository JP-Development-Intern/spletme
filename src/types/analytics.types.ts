export interface AnalyticsFilters {
  platform?: string;
  country?: string;
  startDate?: string;
  endDate?: string;
  artistName?: string;
  /** Id del sello artístico (`artistic_labels`); el filtro va por id, no por nombre. */
  labelId?: string;
}

export interface AnalyticsKpis {
  totalStreams: number;
  totalIncome: number;
  totalGrossIncome: number;
  totalExpenses: number;
}

export interface Transaction {
  songId: string;
  trackTitle: string;
  artistName: string;
  platform: string;
  country: string;
  reportMonth: string;
  salesMonth: string;
  quantity: number;
  grossIncome: number;
  netIncome: number;
  salesType: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface RevenueByPlatformData {
  months: string[];
  series: Array<{
    name: string;
    data: number[];
    streams: number[];
  }>;
}

export interface PieChartEntry {
  name: string;
  value: number;
  streams: number;
  percentage: number;
}

export interface TopSong {
  songId: string;
  trackTitle: string;
  artistName: string;
  isrc: string;
  netIncome: number;
  streams: number;
}

export interface TopArtist {
  artistName: string;
  netIncome: number;
  streams: number;
  songCount: number;
}

export interface TopLabel {
  labelId: string;
  labelName: string | null;
  netIncome: number;
  streams: number;
  songCount: number;
}

export interface HistoricalTotal {
  totalNetIncome: number;
  totalGrossIncome: number;
  totalStreams: number;
  firstDate: string | null;
  lastDate: string | null;
}

export interface PlatformCountryRow {
  platform: string;
  country: string;
  netIncome: number;
  streams: number;
}

export interface AnalyticsSong {
  songId: string;
  trackTitle: string;
  artistName: string;
  artisticLabel: string;
  isrc: string;
  upc: string;
  netIncome: number;
  streams: number;
  platformCount: number;
}

export interface SplitOwnerInfo {
  songCount: number;
  totalNetIncome: number;
  totalStreams: number;
  topSong: { trackTitle: string; isrc: string; netIncome: number } | null;
}

export interface FilterOptions {
  platforms: string[];
  countries: string[];
  artists: string[];
  /** Sellos con canciones: id para filtrar, nombre para mostrar. */
  labels: { id: string; name: string }[];
}
