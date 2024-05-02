import { useCallback, useMemo } from "react";
import type { InjectedRouter, Route } from "react-router";
import { withRouter } from "react-router";
import _ from "underscore";

// TODO: Make each sidebar page a route so we can have onBeforeLeave hooks.
// The alternative is to use the Redux store to track if the form is dirty and show a confirmation modal when navigating away.

import { StrategyForm } from "metabase/admin/performance/components/StrategyForm";
import { useCacheConfigs } from "metabase/admin/performance/hooks/useCacheConfigs";
import { useConfirmIfFormIsDirty } from "metabase/admin/performance/hooks/useConfirmIfFormIsDirty";
import { useSaveStrategy } from "metabase/admin/performance/hooks/useSaveStrategy";
import { DelayedLoadingAndErrorWrapper } from "metabase/components/LoadingAndErrorWrapper/DelayedLoadingAndErrorWrapper";
import type { DashboardSidebarPageProps } from "metabase/dashboard/components/DashboardInfoSidebar";
import { color } from "metabase/lib/colors";
import { Button, Flex, Icon, Title } from "metabase/ui";
import type { Model, Strategy } from "metabase-types/api";

import { DashboardStrategySidebarBody } from "./DashboardStrategySidebar.styled";

const configurableModels: Model[] = ["dashboard"];

const DashboardStrategySidebar_Base = ({
  dashboard,
  setPage,
  router,
  route,
}: DashboardSidebarPageProps & {
  router: InjectedRouter;
  route: Route;
}) => {
  if (typeof dashboard.id === "string") {
    throw new Error("This dashboard has an invalid id");
  }
  const dashboardId: number = dashboard.id;
  const { configs, setConfigs, loading, error } = useCacheConfigs({
    configurableModels,
    id: dashboardId,
  });
  const targetConfig = useMemo(
    () => _.findWhere(configs, { model_id: dashboardId }),
    [configs, dashboardId],
  );
  const savedStrategy = targetConfig?.strategy;
  const filteredConfigs = _.compact([targetConfig]);

  const saveStrategy = useSaveStrategy(
    dashboardId,
    filteredConfigs,
    setConfigs,
    "dashboard",
  );
  const saveAndCloseSidebar = useCallback(
    async (values: Strategy) => {
      await saveStrategy(values);
      setPage("default");
    },
    [saveStrategy, setPage],
  );

  const {
    askBeforeDiscardingChanges,
    confirmationModal,
    isStrategyFormDirty,
    setIsStrategyFormDirty,
  } = useConfirmIfFormIsDirty(router, route);

  const goBack = () => setPage("default");

  return (
    <DashboardStrategySidebarBody align="flex-start" spacing="md">
      <Flex align="center">
        <BackButton
          onClick={() => {
            isStrategyFormDirty ? askBeforeDiscardingChanges(goBack) : goBack();
          }}
        />
        <Title order={2}>Caching settings</Title>
      </Flex>
      <DelayedLoadingAndErrorWrapper loading={loading} error={error}>
        <StrategyForm
          targetId={dashboardId}
          targetModel="dashboard"
          targetName={dashboard.name}
          setIsDirty={setIsStrategyFormDirty}
          saveStrategy={saveAndCloseSidebar}
          savedStrategy={savedStrategy}
          shouldAllowInvalidation
          shouldShowName={false}
        />
      </DelayedLoadingAndErrorWrapper>
      {confirmationModal}
    </DashboardStrategySidebarBody>
  );
};

export const DashboardStrategySidebar = withRouter(
  DashboardStrategySidebar_Base,
);

const BackButton = ({ onClick }: { onClick: () => void }) => (
  <Button
    lh={0}
    style={{ marginInlineStart: ".5rem" }}
    variant="subtle"
    onClick={onClick}
  >
    <Icon name="chevronleft" color={color("text-dark")} />
  </Button>
);
