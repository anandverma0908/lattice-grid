import { useMemo } from "react";
import type {
  GridClassNames,
  GridFeatures,
  GridIcons,
  GridStyles,
  GridTexts,
} from "../types";

const DEFAULT_FEATURES: Required<GridFeatures> = {
  sort: true,
  resize: true,
  reorder: true,
  columnHide: true,
  columnPin: true,
  alternateRows: true,
  toolbar: true,
  footer: true,
  rowSelection: true,
};

const EMPTY_ICONS: GridIcons = {};
const EMPTY_STYLES: GridStyles = {};
const EMPTY_CLASSNAMES: GridClassNames = {};

const DEFAULT_TEXTS: GridTexts = {
  hideColumn: "Hide column",
  manageColumns: "Manage columns",
  columnManager: "Column manager",
  columns: "columns",
  rows: "rows",
  selected: "selected",
  hidden: "hidden",
  showAll: "Show all",
  noPin: "No pin",
  pinLeft: "Pin left",
  pinRight: "Pin right",
  done: "Done",
  loading: "Loading...",
  of: "of",
};

export interface ResolvedGridConfigProps {
  features?: GridFeatures | undefined;
  icons?: GridIcons | undefined;
  texts?: Partial<GridTexts> | undefined;
  classNames?: GridClassNames | undefined;
  styles?: GridStyles | undefined;
}

export interface ResolvedGridConfig {
  features: Required<GridFeatures>;
  icons: GridIcons;
  texts: GridTexts;
  styles: GridStyles;
  classNames: GridClassNames;
}

export function useResolvedGridConfig({
  features: featuresProp,
  icons: iconsProp,
  texts: textsProp,
  classNames: classNamesProp,
  styles: stylesProp,
}: ResolvedGridConfigProps): ResolvedGridConfig {
  const features: Required<GridFeatures> = useMemo(
    () => ({ ...DEFAULT_FEATURES, ...featuresProp }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(featuresProp)],
  );
  const icons = iconsProp ?? EMPTY_ICONS;
  const texts = useMemo(
    () => ({ ...DEFAULT_TEXTS, ...textsProp }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(textsProp)],
  );
  const styles = stylesProp ?? EMPTY_STYLES;
  const classNames = classNamesProp ?? EMPTY_CLASSNAMES;

  return { features, icons, texts, styles, classNames };
}
