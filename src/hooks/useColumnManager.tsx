import React, {
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import type { GridEngine } from '../types';
import { ColumnListPanel } from '../components/ColumnListPanel';

interface BuiltInPanelProps<TData> {
  engine: GridEngine<TData>;
  onClose?: (() => void) | undefined;
}

function BuiltInPanel<TData>({ engine, onClose }: BuiltInPanelProps<TData>) {
  const {
    orderedColumns,
    toggleColumnVisibility,
    pinColumn,
    showAllColumns,
    resetColumns,
  } = engine;

  return (
    <ColumnListPanel
      columns={orderedColumns}
      toggleColumnVisibility={toggleColumnVisibility}
      pinColumn={pinColumn}
      showAllColumns={showAllColumns}
      resetColumns={resetColumns}
      searchable
      onClose={onClose}
      style={{ minWidth: 240 }}
    />
  );
}

export interface ColumnManagerPanelProps<TData = unknown> {
  render?: (props: {
    engine: GridEngine<TData>;
    close: () => void;
  }) => ReactNode;

  onClose?: () => void;

  style?: React.CSSProperties;

  className?: string;
}

export interface UseColumnManagerReturn<TData = unknown> {
  isOpen: boolean;
  open:   () => void;
  close:  () => void;
  toggle: () => void;

  captureEngine: (engine: GridEngine<TData>) => void;

  engine: GridEngine<TData> | null;

  ColumnManagerPanel: (props: ColumnManagerPanelProps<TData>) => ReactNode;
}

export function useColumnManager<TData = unknown>(): UseColumnManagerReturn<TData> {
  const [isOpen, setIsOpen] = useState(false);
  const engineRef = useRef<GridEngine<TData> | null>(null);
  const [captured, setCaptured] = useState(false);

  const open   = useCallback(() => setIsOpen(true),  []);
  const close  = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(v => !v), []);

  const captureEngine = useCallback((eng: GridEngine<TData>) => {
    engineRef.current = eng;
    if (!captured) setCaptured(true);
  }, [captured]);

  const ColumnManagerPanel = useCallback(
    ({ render, onClose, style, className }: ColumnManagerPanelProps<TData>) => {
      const eng = engineRef.current;
      if (!eng) return null;

      if (render) {
        return (
          <div style={style} className={className}>
            {render({ engine: eng, close })}
          </div>
        );
      }

      return (
        <div style={style} className={className}>
          <BuiltInPanel<TData> engine={eng} onClose={onClose} />
        </div>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [captured, close],
  );

  return {
    isOpen,
    open,
    close,
    toggle,
    captureEngine,
    engine: engineRef.current,
    ColumnManagerPanel,
  };
}
