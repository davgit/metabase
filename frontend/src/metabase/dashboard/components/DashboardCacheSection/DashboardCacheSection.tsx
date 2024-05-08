import type { Dispatch, SetStateAction } from "react";
import { useMemo } from "react";
import { t } from "ttag";
import _ from "underscore";

import { useCacheConfigs } from "metabase/admin/performance/hooks/useCacheConfigs";
import { getShortStrategyLabel } from "metabase/admin/performance/strategies";
import { DelayedLoadingAndErrorWrapper } from "metabase/components/LoadingAndErrorWrapper/DelayedLoadingAndErrorWrapper";
import { getDashboardIdForCacheConfig } from "metabase/dashboard/utils";
import { Button, Flex } from "metabase/ui";
import type { Dashboard, Model } from "metabase-types/api";

const configurableModels: Model[] = ["dashboard"];

type DashboardCacheSectionProps = {
  dashboard: Dashboard;
  setPage: Dispatch<SetStateAction<"default" | "caching">>;
};

export const DashboardCacheSection = ({
  dashboard,
  setPage,
}: DashboardCacheSectionProps) => {
  const dashboardId = getDashboardIdForCacheConfig(dashboard);

  const { configs, loading, error } = useCacheConfigs({
    configurableModels,
    id: dashboardId,
  });

  const targetConfig = useMemo(
    () => _.findWhere(configs, { model_id: dashboardId }),
    [configs, dashboardId],
  );
  const savedStrategy = targetConfig?.strategy;

  const shortStrategyLabel =
    getShortStrategyLabel(savedStrategy, "dashboard") || t`Use default`;

  return (
    <DelayedLoadingAndErrorWrapper loading={loading} error={error}>
      <Flex align="center" justify="space-between">
        {t`Caching policy`}
        <Button
          onClick={() => setPage("caching")}
          variant="subtle"
          radius={0}
          p={0}
          style={{ border: "none" }}
        >
          {shortStrategyLabel}
        </Button>
      </Flex>
    </DelayedLoadingAndErrorWrapper>
  );
};
