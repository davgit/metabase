import type { Dashboard } from "metabase-types/api";
import type { AppErrorDescriptor } from "metabase-types/store";

export type SuccessfulFetchDashboardResult = {
  payload: { dashboard: Dashboard };
};
type FailedFetchDashboardResult = {
  error: unknown;
  payload: AppErrorDescriptor;
};

export type FetchDashboardResult =
  | SuccessfulFetchDashboardResult
  | FailedFetchDashboardResult;
