import { css } from "@emotion/react";
import styled from "@emotion/styled";

const ellipsifyCss = css`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const clampCss = (props: EllipsifiedRootProps) => css`
  display: -webkit-box;
  -webkit-line-clamp: ${props.lines};
  -webkit-box-orient: vertical;
  ${props.hideOverflowXOnly ? "overflow-x: hidden;" : "overflow: hidden;"}
  overflow-wrap: break-word;
`;

interface EllipsifiedRootProps {
  lines?: number;
  "data-testid"?: string;
  hideOverflowXOnly?: boolean;
}

export const EllipsifiedRoot = styled.div<EllipsifiedRootProps>`
  ${props => ((props.lines ?? 1) > 1 ? clampCss(props) : ellipsifyCss)};
`;
