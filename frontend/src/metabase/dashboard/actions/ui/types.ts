import type { DashCardId } from "metabase-types/api";

export type ShowClickBehaviorSidebarAction = (
  dashCardId: DashCardId | null,
) => void;
