import { useKBar, VisualState } from "kbar";
import { useCallback } from "react";
import { t } from "ttag";

import { METAKEY } from "metabase/lib/browser";
import { Button, Icon, Tooltip } from "metabase/ui";

export const SearchButton = () => {
  const kbar = useKBar();
  const { setVisualState } = kbar.query;

  const handleClick = useCallback(() => {
    setVisualState(VisualState.showing);
  }, [setVisualState]);

  return (
    <Tooltip label={`${t`Search...`} (${METAKEY}+k)`}>
      <Button leftIcon={<Icon name="search" />} onClick={handleClick}>
        Search
      </Button>
    </Tooltip>
  );
};
