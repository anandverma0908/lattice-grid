import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGridExport } from '../hooks/useGridExport';
import type { ResolvedColumn } from '../types';

function makeCol(id: string, field: string, label: string): ResolvedColumn {
  return {
    id, label, field: field as never,
    width: 100, minWidth: 40, maxWidth: Infinity,
    pinned: null, hidden: false, groupId: null,
    defIndex: 0, sortable: true, resizable: true,
    draggable: true, hideable: true,
    rowGroup: false, rowGroupIndex: null, align: 'left',
  };
}

const columns = [
  makeCol('name',  'name',  'Name'),
  makeCol('city',  'city',  'City'),
  makeCol('value', 'value', 'Value'),
];

const data = [
  { name: 'Alpha', city: 'Mumbai',    value: 10 },
  { name: 'Beta',  city: 'Bangalore', value: 25 },
  { name: 'With, comma', city: 'Delhi', value: 0 },
];

describe('useGridExport — CSV', () => {
  it('generates header row from column labels', () => {
    const { result } = renderHook(() => useGridExport({ data, columns }));
    const csv = result.current.getCSVString();
    expect(csv.split('\n')[0]).toBe('Name,City,Value');
  });

  it('generates correct data rows', () => {
    const { result } = renderHook(() => useGridExport({ data, columns }));
    const lines = result.current.getCSVString().split('\n');
    expect(lines[1]).toBe('Alpha,Mumbai,10');
    expect(lines[2]).toBe('Beta,Bangalore,25');
  });

  it('escapes cells with commas in double-quotes', () => {
    const { result } = renderHook(() => useGridExport({ data, columns }));
    const csv = result.current.getCSVString();
    expect(csv).toContain('"With, comma"');
  });

  it('handles null/undefined values as empty string', () => {
    const sparseData = [{ name: null, city: undefined, value: 5 }];
    const { result } = renderHook(() =>
      useGridExport({ data: sparseData as never, columns }),
    );
    const lines = result.current.getCSVString().split('\n');
    expect(lines[1]).toBe(',,5');
  });
});

describe('useGridExport — JSON', () => {
  it('generates a valid JSON array', () => {
    const { result } = renderHook(() => useGridExport({ data, columns }));
    const parsed = JSON.parse(result.current.getJSONString());
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(3);
  });

  it('uses column id as object key', () => {
    const { result } = renderHook(() => useGridExport({ data, columns }));
    const parsed = JSON.parse(result.current.getJSONString());
    expect(parsed[0]).toEqual({ name: 'Alpha', city: 'Mumbai', value: 10 });
  });
});
