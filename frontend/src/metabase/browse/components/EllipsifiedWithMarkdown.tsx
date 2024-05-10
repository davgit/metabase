import { Ellipsified } from "metabase/core/components/Ellipsified";
import type { EllipsifiedProps } from "metabase/core/components/Ellipsified/Ellipsified";
import Markdown from "metabase/core/components/Markdown";

import { MultilineEllipsified } from "./BrowseModels.styled";

export const EllipsifiedWithMarkdown = ({
  children,
  multiline,
  ...props
}: {
  children: string;
  multiline?: boolean;
} & EllipsifiedProps) => {
  const tooltip = (
    <Markdown disallowHeading unstyleLinks lineClamp={12}>
      {children}
    </Markdown>
  );
  return multiline ? (
    <MultilineEllipsified {...props}>{children}</MultilineEllipsified>
  ) : (
    <Ellipsified tooltip={tooltip} {...props}>
      {children}
    </Ellipsified>
  );
};
