import { memo, useEffect, useRef } from 'react';
import { useGridContext } from '../core/GridContext';
import { ColumnListPanel } from './ColumnListPanel';

interface ColumnManagerProps {
  onClose: () => void;
}

export const ColumnManager = memo(function ColumnManager({ onClose }: ColumnManagerProps) {
  const { engine, features, texts, classNames } = useGridContext();
  const { orderedColumns, toggleColumnVisibility, pinColumn, showAllColumns } = engine;
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const id = setTimeout(() => document.addEventListener('mousedown', handler), 50);
    return () => {
      clearTimeout(id);
      document.removeEventListener('mousedown', handler);
    };
  }, [onClose]);

  return (
    <ColumnListPanel
      panelRef={panelRef}
      role="dialog"
      ariaLabel={texts.columnManager}
      className={classNames.columnPanel || undefined}
      style={{
        position: 'absolute',
        top: 'calc(100% + 4px)',
        right: 0,
        zIndex: 'var(--vg-z-panel)' as unknown as number,
      }}
      columns={orderedColumns}
      toggleColumnVisibility={toggleColumnVisibility}
      pinColumn={pinColumn}
      showAllColumns={showAllColumns}
      columnPinEnabled={features.columnPin}
      onClose={onClose}
      texts={{
        columns: texts.columns,
        hidden: texts.hidden,
        showAll: texts.showAll,
        noPin: texts.noPin,
        pinLeft: texts.pinLeft,
        pinRight: texts.pinRight,
        done: texts.done,
      }}
    />
  );
});
