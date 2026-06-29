export interface FocusedCell {
  rowIndex: number;
  colIndex: number;
}

export type FocusTarget =
  | { kind: "cell"; rowIndex: number; colIndex: number }
  | { kind: "header"; colIndex: number }
  | {
      kind: "groupHeader";
      groupId: string;
      colStartIndex: number;
      colEndIndex: number;
    };

export interface KeyboardRowGroup {
  id: string;
  expanded: boolean;
}
