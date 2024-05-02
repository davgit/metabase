export type FetchCardDataOptions = {
  reload?: boolean;
  clearCache?: boolean;
  ignoreCache?: boolean;
};

export type FetchDashboardCardDataOptions = FetchCardDataOptions & {
  isRefreshing?: boolean;
};
