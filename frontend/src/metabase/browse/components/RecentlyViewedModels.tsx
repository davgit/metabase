import { skipToken, useListRecentItemsQuery } from "metabase/api";
import { DelayedLoadingAndErrorWrapper } from "metabase/components/LoadingAndErrorWrapper/DelayedLoadingAndErrorWrapper";
import { Box, Text } from "metabase/ui";
import type { RecentItem } from "metabase-types/api";

import { getIcon } from "../utils";

import { ModelCard, type ModelCardProps } from "./ModelCard";
import { RecentlyViewedModelsGrid } from "./RecentlyViewedModels.styled";
import { getCountOfRecentlyViewedModelsToShow } from "./utils";

export const RecentlyViewedModels = ({
  modelCount,
}: {
  /** The number of recently viewed models shown
   * depends on the number of models shown in the table below. */
  modelCount: number;
}) => {

  // TODO: the filter from the popover should apply here
  // Ensure that 'A model' appears

  const cap = getCountOfRecentlyViewedModelsToShow(modelCount);

  const {
    data: recentItems = [],
    error,
    isLoading,
  } = useListRecentItemsQuery(cap ? undefined : skipToken, {
    refetchOnMountOrArgChange: true,
  });

  if (!cap) {
    return null;
  }

  const recentlyViewedModels = recentItems
    .filter(data => data.model === "dataset")
    .slice(0, cap);

  return (
    <>
      <RecentlyViewedModelsHeader />
      <DelayedLoadingAndErrorWrapper
        error={error}
        loading={isLoading}
        blankComponent={<Box mih="129px" />}
      >
        <RecentlyViewedModelsGrid>
          {recentlyViewedModels.map((modelItem: RecentItem) => {
            const { model_object, model_id } = modelItem;
            const model: ModelCardProps["model"] = {
              ...model_object,
              model: "dataset",
              id: model_id,
            };
            return (
              <ModelCard
                model={model}
                icon={getIcon(model)}
                key={`${modelItem.model}-${modelItem.model_id}`}
              />
            );
          })}
        </RecentlyViewedModelsGrid>
      </DelayedLoadingAndErrorWrapper>
    </>
  );
};

export const RecentlyViewedModelsHeader = () => (
  <Text fw="bold" size={16} color="text-dark">
    Recents
  </Text>
);
