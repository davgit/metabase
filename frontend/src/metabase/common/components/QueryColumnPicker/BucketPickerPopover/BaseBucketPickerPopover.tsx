import { useMemo } from "react";
import PopoverWithTrigger from "metabase/components/PopoverWithTrigger/TippyPopoverWithTrigger";
import * as Lib from "metabase-lib";
import {
  TriggerButton,
  TriggerIcon,
  SelectList,
  SelectListItem,
} from "./BaseBucketPickerPopover.styled";

type NoBucket = null;

export type BucketListItem = Lib.BucketDisplayInfo & {
  bucket: Lib.Bucket | NoBucket;
};

export interface BaseBucketPickerPopoverProps {
  query: Lib.Query;
  stageIndex: number;
  items: BucketListItem[];
  selectedBucket: Lib.Bucket | NoBucket;
  isEditing: boolean;
  triggerLabel?: string;
  hasArrowIcon?: boolean;
  checkBucketIsSelected: (item: BucketListItem) => boolean;
  renderTriggerContent: (bucket?: Lib.BucketDisplayInfo) => void;
  onSelect: (column: Lib.Bucket | NoBucket) => void;
}

function _BaseBucketPickerPopover({
  query,
  stageIndex,
  items,
  selectedBucket,
  isEditing,
  triggerLabel,
  hasArrowIcon = true,
  checkBucketIsSelected,
  renderTriggerContent,
  onSelect,
}: BaseBucketPickerPopoverProps) {
  const defaultBucket = useMemo(
    () => items.find(item => item.default)?.bucket,
    [items],
  );

  const triggerContentBucket = isEditing ? selectedBucket : defaultBucket;
  const triggerContentBucketDisplayInfo = triggerContentBucket
    ? Lib.displayInfo(query, stageIndex, triggerContentBucket)
    : undefined;

  return (
    <PopoverWithTrigger
      renderTrigger={({ onClick }) => (
        <TriggerButton
          aria-label={triggerLabel}
          onClick={event => {
            event.stopPropagation();
            onClick();
          }}
          // Compat with E2E tests around MLv1-based components
          // Prefer using a11y role selectors
          data-testid="dimension-list-item-binning"
        >
          {renderTriggerContent(triggerContentBucketDisplayInfo)}
          {hasArrowIcon && <TriggerIcon name="chevronright" />}
        </TriggerButton>
      )}
      popoverContent={({ closePopover }) => (
        <SelectList>
          {items.map(item => (
            <SelectListItem
              id={item.displayName}
              key={item.displayName}
              name={item.displayName}
              isSelected={checkBucketIsSelected(item)}
              onSelect={() => {
                onSelect(item.bucket);
                closePopover();
              }}
            />
          ))}
        </SelectList>
      )}
    />
  );
}

export function getBucketListItem(
  query: Lib.Query,
  stageIndex: number,
  bucket: Lib.Bucket,
): BucketListItem {
  return {
    ...Lib.displayInfo(query, stageIndex, bucket),
    bucket,
  };
}

export const BaseBucketPickerPopover = Object.assign(_BaseBucketPickerPopover, {
  displayName: "BucketPickerPopover",
  TriggerButton,
});
