import { PointerSensor, useSensor } from "@dnd-kit/core";
import cx from "classnames";
import { useCallback, useMemo } from "react";

import type {
  DragEndEvent,
  RenderItemProps,
} from "metabase/core/components/Sortable";
import { SortableList } from "metabase/core/components/Sortable";
import CS from "metabase/css/core/index.css";
import { ParameterWidget } from "metabase/parameters/components/ParameterWidget";
import { getVisibleParameters } from "metabase/parameters/utils/ui";
import { Icon } from "metabase/ui";
import type Question from "metabase-lib/v1/Question";
import type { UiParameter } from "metabase-lib/v1/parameters/types";
import type { Dashboard, Parameter, ParameterId } from "metabase-types/api";

const getId = (valuePopulatedParameter: Parameter) =>
  valuePopulatedParameter.id;

export const ParametersList = ({
  className,

  parameters,
  question,
  dashboard,
  editingParameter,

  isFullscreen,
  isNightMode,
  hideParameters,
  isEditing,
  vertical = false,
  commitImmediately = false,

  setParameterValueToDefault,
  setParameterValue,
  setParameterIndex,
  setEditingParameter,
  enableParameterRequiredBehavior,
}: {
  className?: string;

  parameters: Parameter[];
  question?: Question;
  dashboard?: Dashboard;
  editingParameter?: Parameter;

  isFullscreen?: boolean;
  isNightMode?: boolean;
  hideParameters?: string;
  isEditing?: boolean;
  vertical?: boolean;
  commitImmediately?: boolean;

  setParameterValue?: (parameterId: ParameterId, value: any) => void;
  setParameterValueToDefault: (id: ParameterId) => void;
  setParameterIndex?: (id: number, newIndex: number) => void;
  setEditingParameter?: (param: Parameter) => void;
  enableParameterRequiredBehavior?: boolean;
}) => {
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 15 },
  });

  const visibleValuePopulatedParameters = useMemo(
    () => getVisibleParameters(parameters, hideParameters),
    [parameters, hideParameters],
  );

  const handleSortEnd = useCallback(
    ({ id, newIndex }: DragEndEvent) => {
      if (setParameterIndex) {
        setParameterIndex(id as number, newIndex);
      }
    },
    [setParameterIndex],
  );

  const renderItem = ({
    item: valuePopulatedParameter,
    id,
  }: RenderItemProps<UiParameter>) => (
    <ParameterWidget
      key={`sortable-${id}`}
      className={cx({ [CS.mb2]: vertical })}
      isEditing={isEditing}
      isFullscreen={isFullscreen}
      isNightMode={isNightMode}
      parameter={valuePopulatedParameter}
      parameters={parameters}
      question={question}
      dashboard={dashboard}
      editingParameter={editingParameter}
      setEditingParameter={setEditingParameter}
      setValue={
        setParameterValue &&
        ((value: any) => setParameterValue(valuePopulatedParameter.id, value))
      }
      setParameterValueToDefault={setParameterValueToDefault}
      enableParameterRequiredBehavior={enableParameterRequiredBehavior}
      commitImmediately={commitImmediately}
      dragHandle={
        isEditing && setParameterIndex ? (
          <div
            className={cx(
              CS.flex,
              CS.layoutCentered,
              CS.cursorGrab,
              "text-inherit",
            )}
          >
            <Icon name="grabber" />
          </div>
        ) : null
      }
      isSortable
    />
  );

  return visibleValuePopulatedParameters.length > 0 ? (
    <div
      className={cx(
        className,
        CS.flex,
        CS.alignEnd,
        CS.flexWrap,
        vertical ? CS.flexColumn : CS.flexRow,
      )}
    >
      <SortableList
        items={visibleValuePopulatedParameters}
        getId={getId}
        renderItem={renderItem}
        onSortEnd={handleSortEnd}
        sensors={[pointerSensor]}
      />
    </div>
  ) : null;
};
