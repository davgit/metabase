import { t } from "ttag";

import { Ellipsified } from "metabase/core/components/Ellipsified";
import Link from "metabase/core/components/Link";
import { color } from "metabase/lib/colors";
import * as Urls from "metabase/lib/urls";
import type { IconProps } from "metabase/ui";
import { FixedSizeIcon, Text } from "metabase/ui";
import type { Card, ModelResult } from "metabase-types/api";

import { trackModelClick } from "../analytics";
import { getIcon } from "../utils";

import { ModelCardBody } from "./BrowseModels.styled";
import { EllipsifiedWithMarkdown } from "./EllipsifiedWithMarkdown";
import { getModelDescription } from "./utils";

export interface ModelCardProps {
  model: Pick<ModelResult, "name" | "id" | "model"> & Partial<ModelResult>;
  icon?: IconProps;
}

export const ModelCard = ({ model, icon }: ModelCardProps) => {
  const headingId = `heading-for-model-${model.id}`;

  icon ??= getIcon(model);
  const description = getModelDescription(model);

  return (
    <Link
      key={model.id}
      to={Urls.model(model as unknown as Partial<Card>)}
      onClick={() => trackModelClick(model.id)}
    >
      <ModelCardBody>
        <FixedSizeIcon {...icon} size={16} color={color("brand")} />
        <Text fw="bold" lh="1rem" w="100%">
          <Ellipsified hideOverflowXOnly tooltipMaxWidth="20rem" id={headingId}>
            {model.name}
          </Ellipsified>
        </Text>
        {description ? (
          <EllipsifiedWithMarkdown
            hideOverflowXOnly
            multiline
            style={{
              height: "3rem",
              lineHeight: "1rem",
              fontSize: "11px",
              width: "100%",
            }}
          >
            {description.replace(/\s+/g, " ")}
          </EllipsifiedWithMarkdown>
        ) : (
          <Text
            lh="1rem"
            size="xs"
            color="text-light"
          >{t`No description.`}</Text>
        )}
      </ModelCardBody>
    </Link>
  );
};
