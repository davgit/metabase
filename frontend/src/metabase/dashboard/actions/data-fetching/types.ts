import type { FetchDashboardResult } from "metabase/dashboard/types";
import type {
  Card,
  DashboardCard,
  DashboardId,
  QuestionDashboardCard,
  DashCardId,
  VisualizationSettings,
} from "metabase-types/api";

export type FetchCardDataOptions = {
  reload?: boolean;
  clearCache?: boolean;
  ignoreCache?: boolean;
};
export type FetchCardDataAction = (
  card: Card,
  dashcard: QuestionDashboardCard | DashboardCard,
  options: FetchCardDataOptions,
) => Promise<DashboardCard>;

export type FetchDashboardCardDataOptions = FetchCardDataOptions & {
  isRefreshing?: boolean;
};
export type FetchDashboardAction = ({
  dashId,
  queryParams,
  options,
}: {
  dashId: DashboardId;
  queryParams: Record<string, unknown>;
  options?: {
    preserveParameters?: boolean;
    ignoreCache?: boolean;
  };
}) => FetchDashboardResult;

export type FetchDashboardCardDataAction = (
  args?: FetchDashboardCardDataOptions,
) => void;

export type FetchDashboardCardMetadataAction = () => void;

export type InitializeDashboardAction = (opts?: {
  clearCache?: boolean;
}) => void;

export type MarkNewCardSeenAction = (dashcardId: DashCardId) => void;

export type OnReplaceAllDashCardVisualizationSettingsAction = (
  id: DashCardId,
  settings: Partial<VisualizationSettings>,
) => void;

export type OnUpdateDashCardVisualizationSettingsAction = (
  id: DashCardId,
  settings: Partial<VisualizationSettings>,
) => void;
