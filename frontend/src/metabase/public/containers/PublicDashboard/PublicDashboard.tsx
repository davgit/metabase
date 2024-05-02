import cx from "classnames";
import type { Location, LocationDescriptor } from "history";
import { assoc } from "icepick";
import { useCallback, useEffect } from "react";
import { push } from "react-router-redux";
import { usePrevious } from "react-use";
import _ from "underscore";

import LoadingAndErrorWrapper from "metabase/components/LoadingAndErrorWrapper";
import ColorS from "metabase/css/core/colors.module.css";
import CS from "metabase/css/core/index.css";
import DashboardS from "metabase/css/dashboard.module.css";
import type {
  RemoveCardFromDashboardOpts,
  SetDashCardAttributesOpts,
  SetMultipleDashCardAttributesOpts,
  UndoRemoveCardFromDashboardOpts,
} from "metabase/dashboard/actions";
import {
  cancelFetchDashboardCardData,
  fetchCardData,
  fetchDashboard,
  fetchDashboardCardData,
  fetchDashboardCardMetadata,
  initialize,
  markNewCardSeen,
  onReplaceAllDashCardVisualizationSettings,
  onUpdateDashCardVisualizationSettings,
  removeCardFromDashboard,
  replaceCard,
  setDashCardAttributes,
  setMultipleDashCardAttributes,
  setParameterValue,
  setParameterValueToDefault,
  showClickBehaviorSidebar,
  undoRemoveCardFromDashboard,
} from "metabase/dashboard/actions";
import type { FetchCardDataOptions } from "metabase/dashboard/actions/data-fetching/types";
import { getDashboardActions } from "metabase/dashboard/components/DashboardActions";
import { DashboardGridConnected } from "metabase/dashboard/components/DashboardGrid";
import { DashboardTabs } from "metabase/dashboard/components/DashboardTabs";
import { DashboardControls } from "metabase/dashboard/hoc/DashboardControls";
import {
  getDashboardComplete,
  getParameters,
  getParameterValues,
  getDraftParameterValues,
  getSelectedTabId,
  getCardData,
  getSlowCards,
} from "metabase/dashboard/selectors";
import { isActionDashCard } from "metabase/dashboard/utils";
import { isWithinIframe } from "metabase/lib/dom";
import { useDispatch, useSelector } from "metabase/lib/redux";
import ParametersS from "metabase/parameters/components/ParameterValueWidget.module.css";
import EmbedFrame from "metabase/public/components/EmbedFrame/EmbedFrame";
import { DashboardContainer } from "metabase/public/containers/PublicDashboard/PublicDashboard.styled";
import { setErrorPage } from "metabase/redux/app";
import { getMetadata } from "metabase/selectors/metadata";
import {
  setEmbedDashboardEndpoints,
  setPublicDashboardEndpoints,
} from "metabase/services";
import type { Mode } from "metabase/visualizations/click-actions/Mode";
import { PublicMode } from "metabase/visualizations/click-actions/modes/PublicMode";
import type {
  DashCardVisualizationSettings,
  ParameterId,
  Card,
  CardId,
  DashCardId,
  QuestionDashboardCard,
} from "metabase-types/api";

const _PublicDashboard = (props: {
  location: Location;
  params: {
    uuid: string;
    token: string;
    dashboardId: string;
  };
  isFullscreen: boolean;
  isNightMode: boolean;
}) => {
  const {
    location,
    params: { uuid, token, dashboardId: dashboardIdParam },
    isFullscreen,
    isNightMode,
  } = props;

  const metadata = useSelector(getMetadata);
  const dashboardId = dashboardIdParam || uuid || token;
  const dashboard = useSelector(getDashboardComplete);
  const parameters = useSelector(getParameters);
  const parameterValues = useSelector(getParameterValues);
  const draftParameterValues = useSelector(getDraftParameterValues);
  const selectedTabId = useSelector(getSelectedTabId);
  const dashcardData = useSelector(getCardData);
  const slowCards = useSelector(getSlowCards);

  const dispatch = useDispatch();

  const hasNoTabs = dashboard?.tabs?.length === 0;

  const _initialize = useCallback(async () => {
    if (uuid) {
      setPublicDashboardEndpoints();
    } else if (token) {
      setEmbedDashboardEndpoints();
    }

    initialize();

    const result = await dispatch(
      fetchDashboard({
        dashId: uuid || token,
        queryParams: location.query,
      }),
    );

    if ("error" in result && result.error) {
      dispatch(setErrorPage(result.payload));
      return;
    }

    try {
      if (hasNoTabs) {
        dispatch(fetchDashboardCardData({ reload: false, clearCache: true }));
      }
    } catch (error) {
      console.error(error);
      dispatch(setErrorPage(error));
    }
  }, [hasNoTabs, dispatch, location.query, token, uuid]);

  useEffect(() => {
    return () => {
      dispatch(cancelFetchDashboardCardData());
    };
  }, [dispatch]);

  const prevProps = usePrevious({
    dashboardId,
    selectedTabId,
    parameterValues,
  });

  useEffect(() => {
    if (dashboardId !== prevProps?.dashboardId) {
      _initialize();
    } else if (!_.isEqual(prevProps?.selectedTabId, selectedTabId)) {
      dispatch(fetchDashboardCardData());
      dispatch(fetchDashboardCardMetadata());
      return;
    } else if (!_.isEqual(parameterValues, prevProps?.parameterValues)) {
      dispatch(fetchDashboardCardData({ reload: false, clearCache: true }));
    }
  });

  const getCurrentTabDashcards = () => {
    if (!Array.isArray(dashboard?.dashcards)) {
      return [];
    }
    if (!selectedTabId) {
      return dashboard?.dashcards;
    }
    return dashboard?.dashcards.filter(
      dashcard => dashcard.dashboard_tab_id === selectedTabId,
    );
  };

  const getHiddenParameterSlugs = () => {
    const currentTabParameterIds = getCurrentTabDashcards()?.flatMap(
      dashcard =>
        dashcard.parameter_mappings?.map(mapping => mapping.parameter_id) ?? [],
    );
    const hiddenParameters = parameters.filter(
      parameter => !currentTabParameterIds?.includes(parameter.id),
    );
    return hiddenParameters.map(parameter => parameter.slug).join(",");
  };

  const buttons = !isWithinIframe()
    ? getDashboardActions({
        ...props,
        dashboard,
        isPublic: true,
        isFullscreen,
        isNightMode,
      })
    : [];

  const visibleDashcards = (dashboard?.dashcards ?? []).filter(
    dashcard => !isActionDashCard(dashcard),
  );

  return (
    <EmbedFrame
      name={dashboard && dashboard.name}
      description={dashboard && dashboard.description}
      dashboard={dashboard}
      parameters={parameters}
      parameterValues={parameterValues}
      draftParameterValues={draftParameterValues}
      hiddenParameterSlugs={getHiddenParameterSlugs()}
      setParameterValue={(parameterId: ParameterId, value: any) =>
        dispatch(setParameterValue(parameterId, value))
      }
      setParameterValueToDefault={(parameterId: ParameterId) =>
        dispatch(setParameterValueToDefault(parameterId))
      }
      enableParameterRequiredBehavior
      actionButtons={
        buttons.length > 0 && <div className={CS.flex}>{buttons}</div>
      }
      dashboardTabs={
        dashboard?.tabs &&
        dashboard?.tabs?.length > 1 && (
          <DashboardTabs dashboardId={dashboardId} location={location} />
        )
      }
    >
      <LoadingAndErrorWrapper
        className={cx({
          [DashboardS.DashboardFullscreen]: isFullscreen,
          [DashboardS.DashboardNight]: isNightMode,
          [ParametersS.DashboardNight]: isNightMode,
          [ColorS.DashboardNight]: isNightMode,
        })}
        loading={!dashboard}
      >
        {() => (
          <DashboardContainer>
            <DashboardGridConnected
              dashboard={assoc(dashboard, "dashcards", visibleDashcards)}
              dashcardData={dashcardData}
              selectedTabId={selectedTabId}
              parameterValues={parameterValues}
              slowCards={slowCards}
              isEditing={false}
              isEditingParameter={false}
              isPublic
              isXray={false}
              isFullscreen={isFullscreen}
              isNightMode={isNightMode}
              clickBehaviorSidebarDashcard={null}
              mode={PublicMode as unknown as Mode}
              metadata={metadata}
              fetchCardData={(
                card: Card,
                dashcard: QuestionDashboardCard,
                options: FetchCardDataOptions,
              ) => dispatch(fetchCardData(card, dashcard, options))}
              replaceCard={({
                dashcardId,
                nextCardId,
              }: {
                dashcardId: DashCardId;
                nextCardId: CardId;
              }) =>
                dispatch(
                  replaceCard({
                    dashcardId,
                    nextCardId,
                  }),
                )
              }
              markNewCardSeen={(dashcardId: DashCardId) =>
                dispatch(markNewCardSeen(dashcardId))
              }
              setDashCardAttributes={(options: SetDashCardAttributesOpts) =>
                dispatch(setDashCardAttributes(options))
              }
              setMultipleDashCardAttributes={(changes: {
                dashcards: SetMultipleDashCardAttributesOpts;
              }) => dispatch(setMultipleDashCardAttributes(changes))}
              removeCardFromDashboard={(options: RemoveCardFromDashboardOpts) =>
                dispatch(removeCardFromDashboard(options))
              }
              undoRemoveCardFromDashboard={(
                options: UndoRemoveCardFromDashboardOpts,
              ) => dispatch(undoRemoveCardFromDashboard(options))}
              onReplaceAllDashCardVisualizationSettings={(
                id: DashCardId,
                settings: DashCardVisualizationSettings,
              ) =>
                dispatch(
                  onReplaceAllDashCardVisualizationSettings(id, settings),
                )
              }
              onUpdateDashCardVisualizationSettings={(
                id: DashCardId,
                settings: DashCardVisualizationSettings,
              ) =>
                dispatch(onUpdateDashCardVisualizationSettings(id, settings))
              }
              onChangeLocation={(location: LocationDescriptor) =>
                dispatch(push(location))
              }
              navigateToNewCardFromDashboard={() => {}}
              showClickBehaviorSidebar={(dashcardId: DashCardId | null) =>
                dispatch(showClickBehaviorSidebar(dashcardId))
              }
            />
          </DashboardContainer>
        )}
      </LoadingAndErrorWrapper>
    </EmbedFrame>
  );
};

export const PublicDashboard = DashboardControls(_PublicDashboard);
