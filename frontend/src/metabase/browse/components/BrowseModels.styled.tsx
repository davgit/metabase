import styled from "@emotion/styled";

import Card from "metabase/components/Card";
import IconButtonWrapper from "metabase/components/IconButtonWrapper";
import { Ellipsified } from "metabase/core/components/Ellipsified";
import { color } from "metabase/lib/colors";
import { FixedSizeIcon } from "metabase/ui";

export const BannerCloseButton = styled(IconButtonWrapper)`
  color: ${color("text-light")};
  margin-inline-start: auto;
`;

export const BannerModelIcon = styled(FixedSizeIcon)`
  color: ${color("text-dark")};
  margin-inline-end: 0.5rem;
`;

export const MultilineEllipsified = styled(Ellipsified)`
  white-space: pre-line;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;

  // Without the following rule, the useIsTruncated hook,
  // which Ellipsified calls, might think that this element
  // is truncated when it is not
  padding-bottom: 1px;
`;

export const ModelCardBody = styled(Card)`
  padding: 1.5rem;
  padding-bottom: 1rem;

  height: 6.5rem;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 0.5rem;

  border: 1px solid ${color("border")};

  box-shadow: 0px 1px 4px 0px #0000000f;
  &:hover {
    h1 {
      color: ${color("brand")};
    }
  }
  h1 {
    transition: color 0.15s;
  }
`;
