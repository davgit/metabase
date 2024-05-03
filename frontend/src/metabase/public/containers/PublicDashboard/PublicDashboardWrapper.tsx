import type { Location } from "history";
import { useEffect } from "react";

import { parseSlug } from "metabase/dashboard/components/DashboardTabs/use-sync-url-slug";
import { DashboardControls } from "metabase/dashboard/hoc/DashboardControls";
import { parseHashOptions } from "metabase/lib/browser";
import { useDispatch } from "metabase/lib/redux";
import { PublicDashboard } from "metabase/public/containers/PublicDashboard/PublicDashboard";
import { setOptions } from "metabase/redux/embed";
import {
  setEmbedDashboardEndpoints,
  setPublicDashboardEndpoints,
} from "metabase/services";

type PublicDashboardProps = {
  location: Location;
  params: {
    uuid: string;
    tabSlug?: string;
    token?: string;
    dashboardId?: string;
  };
  hasNightModeToggle: boolean;
  isFullscreen: boolean;
  isNightMode: boolean;
  onFullscreenChange: (isFullscreen: boolean) => void;
  onNightModeChange: (isNightMode: boolean) => void;
  onRefreshPeriodChange: (refreshPeriod: number | null) => void;
  refreshPeriod?: number | null;
  setRefreshElapsedHook?: (hook: () => void) => void;
};

export const PublicDashboardWrapper = DashboardControls(
  ({
    location,
    params: { uuid, token, dashboardId: dashboardIdParam },
    hasNightModeToggle,
    isFullscreen,
    isNightMode,
    onFullscreenChange,
    onNightModeChange,
    onRefreshPeriodChange,
    refreshPeriod,
    setRefreshElapsedHook,
  }: PublicDashboardProps) => {
    const dispatch = useDispatch();

    const dashboardId = String(dashboardIdParam || uuid || token);

    useEffect(() => {
      if (uuid) {
        setPublicDashboardEndpoints();
      } else if (token) {
        setEmbedDashboardEndpoints();
      }
    }, [token, uuid]);

    useEffect(() => {
      dispatch(setOptions(location));
    }, [dispatch, location]);

    const embedOptions = parseHashOptions(location.hash);
    const initTabId = location ? parseSlug({ location }) : null;

    // useSyncURLSlug({ location });
    //   useMount(() => dispatch(initTabs({ slug: parseSlug({ location }) })));

    return (
      <PublicDashboard
        id={dashboardId}
        tabId={initTabId}
        queryParams={location.query}
        embedOptions={embedOptions}
        hasNightModeToggle={hasNightModeToggle}
        isFullscreen={isFullscreen}
        isNightMode={isNightMode}
        onFullscreenChange={onFullscreenChange}
        onNightModeChange={onNightModeChange}
        onRefreshPeriodChange={onRefreshPeriodChange}
        refreshPeriod={refreshPeriod}
        setRefreshElapsedHook={setRefreshElapsedHook}
      />
    );
  },
);
