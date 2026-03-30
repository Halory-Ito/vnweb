import { api } from "@/lib/request-utils";

export type RecordTimelineRange = "week" | "month" | "year";

export type RecordTimelinePoint = {
  key: string;
  label: string;
  seconds: number;
  hours: number;
};

export type RecordTimelineResponse = {
  range: RecordTimelineRange;
  offset: number;
  periodLabel: string;
  points: RecordTimelinePoint[];
  totalSeconds: number;
  totalHours: number;
  activeCount: number;
  peakLabel: string;
  peakSeconds: number;
};

export type YearlyMonthStatPoint = {
  month: number;
  label: string;
  hours: number;
  activeDays: number;
};

export type YearlyDistributionPoint = {
  key: string;
  label: string;
  seconds: number;
  hours: number;
};

export type YearlyRankPoint = {
  id: string;
  cover: string;
  title: string;
  stat: number;
};

export type RecordYearReportResponse = {
  offset: number;
  yearLabel: string;
  monthlyStats: YearlyMonthStatPoint[];
  distributionByType: YearlyDistributionPoint[];
  distributionByPublisher: YearlyDistributionPoint[];
  gameRank: YearlyRankPoint[];
};

export type MonthDailyStatPoint = {
  day: number;
  label: string;
  seconds: number;
  hours: number;
};

export type MonthGameFrequencyPoint = {
  key: string;
  label: string;
  count: number;
};

export type RecordMonthReportResponse = {
  offset: number;
  monthLabel: string;
  dailyStats: MonthDailyStatPoint[];
  gameFrequency: MonthGameFrequencyPoint[];
  playTimeRank: YearlyRankPoint[];
};

export type RecordExportEntry = {
  id: string;
  title: string;
  cover: string;
  tags: string[];
  totalPlaySeconds: number;
  totalPlayHours: number;
  ratio: number;
  firstPlayAt?: string;
  lastPlayAt?: string;
  maxDailySeconds: number;
  avgDailySeconds: number;
  rating: number | null;
  releaseDate?: string;
  platforms: string[];
  developer?: string;
  publisher?: string;
  gameType?: string;
};

export type RecordExportResponse = {
  totalPlaySeconds: number;
  totalPlayHours: number;
  entries: RecordExportEntry[];
};

export const fetchRecordTimelineApi = async (payload: {
  range: RecordTimelineRange;
  offset: number;
}) => {
  const res = await api.get("/record/timeline", {
    params: payload,
  });

  if (!res.status || res.status >= 400) {
    throw new Error(`Failed to fetch timeline: ${res.status}`);
  }

  return (res.data as { data: RecordTimelineResponse }).data;
};

export const fetchRecordYearReportApi = async (payload: { offset: number }) => {
  const res = await api.get("/record/year-report", {
    params: payload,
  });

  if (!res.status || res.status >= 400) {
    throw new Error(`Failed to fetch year report: ${res.status}`);
  }

  return (res.data as { data: RecordYearReportResponse }).data;
};

export const fetchRecordMonthReportApi = async (payload: {
  offset: number;
}) => {
  const res = await api.get("/record/month-report", {
    params: payload,
  });

  if (!res.status || res.status >= 400) {
    throw new Error(`Failed to fetch month report: ${res.status}`);
  }

  return (res.data as { data: RecordMonthReportResponse }).data;
};

export const fetchRecordExportApi = async () => {
  const res = await api.get("/record/export");

  if (!res.status || res.status >= 400) {
    throw new Error(`Failed to fetch export report: ${res.status}`);
  }

  return (res.data as { data: RecordExportResponse }).data;
};
