import cx from "classnames";
import type { LocationDescriptor } from "history";
import { assoc } from "icepick";
import { Component } from "react";
import { connect } from "react-redux";
import { push } from "react-router-redux";
import _ from "underscore";

import LoadingAndErrorWrapper from "metabase/components/LoadingAndErrorWrapper";
import ColorS from "metabase/css/core/colors.module.css";
import CS from "metabase/css/core/index.css";
import DashboardS from "metabase/css/dashboard.module.css";
import type {
  FetchDashboardAction,
  FetchDashboardCardDataAction,
  FetchDashboardCardMetadataAction,
  InitializeDashboardAction,
  MarkNewCardSeenAction,
  OnReplaceAllDashCardVisualizationSettingsAction,
  OnUpdateDashCardVisualizationSettingsAction,
  RemoveCardFromDashboardOpts,
  ReplaceCardOpts,
  SetDashCardAttributesOpts,
  SetMultipleDashCardAttributesOpts,
  SetParameterValueAction,
  SetParameterValueToDefaultAction,
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
import type { FetchCardDataAction } from "metabase/dashboard/actions/data-fetching/types";
import type { ShowClickBehaviorSidebarAction } from "metabase/dashboard/actions/ui/types";
import { getDashboardActions } from "metabase/dashboard/components/DashboardActions";
import { DashboardGridConnected } from "metabase/dashboard/components/DashboardGrid";
import { DashboardTabs } from "metabase/dashboard/components/DashboardTabs";
import {
  getDashboardComplete,
  getCardData,
  getSlowCards,
  getParameters,
  getParameterValues,
  getDraftParameterValues,
  getSelectedTabId,
} from "metabase/dashboard/selectors";
import { isActionDashCard } from "metabase/dashboard/utils";
import title from "metabase/hoc/Title";
import { isWithinIframe } from "metabase/lib/dom";
import ParametersS from "metabase/parameters/components/ParameterValueWidget.module.css";
import type { EmbeddingDisplayOptions } from "metabase/public/lib/types";
import { setErrorPage } from "metabase/redux/app";
import { getMetadata } from "metabase/selectors/metadata";
import type { Mode } from "metabase/visualizations/click-actions/Mode";
import { PublicMode } from "metabase/visualizations/click-actions/modes/PublicMode";
import type Metadata from "metabase-lib/v1/metadata/Metadata";
import type { UiParameter } from "metabase-lib/v1/parameters/types";
import type {
  ParameterId,
  DashCardId,
  DashboardCard,
  Parameter,
  Dashboard,
  DashCardDataMap,
  ParameterValueOrArray,
  DashboardId,
} from "metabase-types/api";
import type {
  State,
  SelectedTabId,
  AppErrorDescriptor,
} from "metabase-types/store";

import EmbedFrame from "../../components/EmbedFrame";

import { DashboardContainer } from "./PublicDashboard.styled";

type DispatchProps = {
  cancelFetchDashboardCardData: () => void;
  fetchCardData: FetchCardDataAction;
  fetchDashboard: FetchDashboardAction;
  fetchDashboardCardData: FetchDashboardCardDataAction;
  fetchDashboardCardMetadata: FetchDashboardCardMetadataAction;
  initialize: InitializeDashboardAction;
  markNewCardSeen: MarkNewCardSeenAction;
  onReplaceAllDashCardVisualizationSettings: OnReplaceAllDashCardVisualizationSettingsAction;
  onUpdateDashCardVisualizationSettings: OnUpdateDashCardVisualizationSettingsAction;
  removeCardFromDashboard: RemoveCardFromDashboardOpts;
  replaceCard: ReplaceCardOpts;
  setDashCardAttributes: SetDashCardAttributesOpts;
  setMultipleDashCardAttributes: SetMultipleDashCardAttributesOpts;
  setParameterValue: SetParameterValueAction;
  setParameterValueToDefault: SetParameterValueToDefaultAction;
  showClickBehaviorSidebar: ShowClickBehaviorSidebarAction;
  undoRemoveCardFromDashboard: UndoRemoveCardFromDashboardOpts;
  setErrorPage: (error: AppErrorDescriptor) => void;
  onChangeLocation: (location: LocationDescriptor) => void;
};

type StateProps = {
  metadata: Metadata;
  dashboard: Dashboard;
  dashcardData: DashCardDataMap;
  slowCards: Record<DashCardId, boolean>;
  parameters: UiParameter[];

  parameterValues: Record<ParameterId, ParameterValueOrArray>;
  draftParameterValues: Record<ParameterId, ParameterValueOrArray | null>;
  selectedTabId: SelectedTabId;
};

type OwnProps = {
  id: DashboardId;
  tabId?: string | null;
  queryParams: Record<ParameterId, any>;
  hasNightModeToggle: boolean;
  isFullscreen: boolean;
  isNightMode: boolean;
  onFullscreenChange: (isFullscreen: boolean) => void;
  onNightModeChange: (isNightMode: boolean) => void;
  onRefreshPeriodChange: (refreshPeriod: number | null) => void;
  refreshPeriod?: number | null;
  setRefreshElapsedHook?: (hook: () => void) => void;
  embedOptions: Partial<EmbeddingDisplayOptions>;
  hideParameters?: boolean;
};

type PublicDashboardProps = OwnProps & StateProps & DispatchProps;

const mapStateToProps = (state: State) => {
  return {
    metadata: getMetadata(state),
    dashboard: getDashboardComplete(state),
    dashcardData: getCardData(state),
    slowCards: getSlowCards(state),
    parameters: getParameters(state),
    parameterValues: getParameterValues(state),
    draftParameterValues: getDraftParameterValues(state),
    selectedTabId: getSelectedTabId(state),
  };
};

const mapDispatchToProps = {
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
  setErrorPage,
  onChangeLocation: push,
};

class PublicDashboardInner extends Component<PublicDashboardProps> {
  initializePublicDashboard = async () => {
    const {
      initialize,
      fetchDashboard,
      fetchDashboardCardData,
      setErrorPage,
      id,
      queryParams,
      dashboard,
    } = this.props;
    initialize();

    const result = fetchDashboard({
      dashId: id,
      queryParams,
    });

    if ("error" in result && result.error) {
      setErrorPage(result.payload);
      return;
    }

    // this boolean ensures that we only fetch data for a single tab.
    // might need more explanation for this in the future
    const shouldLoadCardsInTab = dashboard?.tabs?.length === 0;

    try {
      if (shouldLoadCardsInTab) {
        fetchDashboardCardData({ reload: false, clearCache: true });
      }
    } catch (error) {
      console.error(error);
      setErrorPage(error as AppErrorDescriptor);
    }
  };

  async componentDidMount() {
    await this.initializePublicDashboard();
  }

  componentWillUnmount() {
    this.props.cancelFetchDashboardCardData();
  }

  async componentDidUpdate(prevProps: PublicDashboardProps) {
    if (this.props.id !== prevProps.id) {
      return this.initializePublicDashboard();
    }

    if (!_.isEqual(prevProps.selectedTabId, this.props.selectedTabId)) {
      this.props.fetchDashboardCardData();
      this.props.fetchDashboardCardMetadata();
      return;
    }

    if (!_.isEqual(this.props.parameterValues, prevProps.parameterValues)) {
      this.props.fetchDashboardCardData({ reload: false, clearCache: true });
    }
  }

  getCurrentTabDashcards = () => {
    const { dashboard, selectedTabId } = this.props;
    if (!Array.isArray(dashboard?.dashcards)) {
      return [];
    }
    if (!selectedTabId) {
      return dashboard.dashcards;
    }
    return dashboard.dashcards.filter(
      (dashcard: DashboardCard) => dashcard.dashboard_tab_id === selectedTabId,
    );
  };

  getHiddenParameterSlugs = () => {
    const { parameters } = this.props;
    const currentTabParameterIds = this.getCurrentTabDashcards().flatMap(
      (dashcard: DashboardCard) =>
        dashcard.parameter_mappings?.map(mapping => mapping.parameter_id) ?? [],
    );
    const hiddenParameters = parameters.filter(
      (parameter: Parameter) => !currentTabParameterIds.includes(parameter.id),
    );
    return hiddenParameters
      .map((parameter: Parameter) => parameter.slug)
      .join(",");
  };

  render() {
    const {
      dashboard,
      parameters,
      parameterValues,
      draftParameterValues,
      isFullscreen,
      isNightMode,
      setParameterValueToDefault,
      id,
      dashcardData,
      slowCards,
      selectedTabId,
      metadata,
      onChangeLocation,
      embedOptions,
    } = this.props;

    const buttons = !isWithinIframe()
      ? getDashboardActions({ ...this.props, isPublic: true })
      : [];

    const visibleDashcards = (dashboard?.dashcards ?? []).filter(
      (dashcard: DashboardCard) => !isActionDashCard(dashcard),
    );

    return (
      <EmbedFrame
        name={dashboard && dashboard.name}
        description={dashboard && dashboard.description}
        dashboard={dashboard}
        parameters={parameters}
        parameterValues={parameterValues}
        draftParameterValues={draftParameterValues}
        hiddenParameterSlugs={this.getHiddenParameterSlugs()}
        setParameterValue={(parameterId: ParameterId, value: any) =>
          setParameterValue(parameterId, value)
        }
        setParameterValueToDefault={(parameterId: ParameterId) =>
          setParameterValueToDefault(parameterId)
        }
        enableParameterRequiredBehavior
        actionButtons={
          buttons.length > 0 && <div className={CS.flex}>{buttons}</div>
        }
        dashboardTabs={
          dashboard?.tabs &&
          dashboard?.tabs?.length > 1 && <DashboardTabs dashboardId={id} />
        }
        embedOptions={embedOptions}
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
                fetchCardData={fetchCardData}
                replaceCard={replaceCard}
                markNewCardSeen={markNewCardSeen}
                setDashCardAttributes={setDashCardAttributes}
                setMultipleDashCardAttributes={setMultipleDashCardAttributes}
                removeCardFromDashboard={removeCardFromDashboard}
                undoRemoveCardFromDashboard={undoRemoveCardFromDashboard}
                onReplaceAllDashCardVisualizationSettings={
                  onReplaceAllDashCardVisualizationSettings
                }
                onUpdateDashCardVisualizationSettings={
                  onUpdateDashCardVisualizationSettings
                }
                onChangeLocation={onChangeLocation}
                navigateToNewCardFromDashboard={() => {}}
                showClickBehaviorSidebar={showClickBehaviorSidebar}
              />
            </DashboardContainer>
          )}
        </LoadingAndErrorWrapper>
      </EmbedFrame>
    );
  }
}

export const PublicDashboard = _.compose(
  connect(mapStateToProps, mapDispatchToProps),
  title(
    ({ dashboard }: { dashboard: Dashboard }) => dashboard && dashboard.name,
  ),
)(PublicDashboardInner);
