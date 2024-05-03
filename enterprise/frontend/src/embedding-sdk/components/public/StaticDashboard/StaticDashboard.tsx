import { PublicDashboard } from "metabase/public/containers/PublicDashboard";
import type { DashboardId } from "metabase-types/api";

export const StaticDashboard = ({
  dashboardId,
}: {
  dashboardId: DashboardId;
}) => <PublicDashboard id={dashboardId} queryParams={{}} embedOptions={{}} />;
