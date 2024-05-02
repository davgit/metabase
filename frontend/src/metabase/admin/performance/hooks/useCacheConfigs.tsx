import { useEffect, useState } from "react";
import { useAsync } from "react-use";
import _ from "underscore";

import { CacheConfigApi } from "metabase/services";
import type { CacheConfigAPIResponse, Config, Model } from "metabase-types/api";

import { rootId, translateConfigFromAPI } from "../strategies";

import { useRecentlyTrue } from "./useRecentlyTrue";

export const useCacheConfigs = ({
  configurableModels,
  id,
}: {
  configurableModels: Model[];
  id?: number;
}) => {
  const configsResult = useAsync(async () => {
    const configsForEachModel = await Promise.all(
      configurableModels.map(model =>
        CacheConfigApi.list({ model, id }).then(
          (response: CacheConfigAPIResponse) => response.data,
        ),
      ),
    );
    const configs = _.flatten(configsForEachModel);
    const translatedConfigs = configs.map(translateConfigFromAPI);
    return translatedConfigs;
  }, [configurableModels, id]);

  const configsFromAPI = configsResult.value;

  const [configs, setConfigs] = useState<Config[]>([]);

  useEffect(() => {
    if (configsFromAPI) {
      setConfigs(configsFromAPI);
    }
  }, [configsFromAPI]);

  const rootStrategyOverriddenOnce = configs.some(
    config => config.model_id !== rootId,
  );

  const [rootStrategyRecentlyOverridden] = useRecentlyTrue(
    rootStrategyOverriddenOnce,
    3000,
  );

  const error = configsResult.error;
  const loading = configsResult.loading;

  return {
    error,
    loading,
    configs,
    setConfigs,
    configsFromAPI,
    rootStrategyOverriddenOnce,
    rootStrategyRecentlyOverridden,
  };
};
