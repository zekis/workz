/**
 * useSelectionModel
 * - Unified selection state for table (md+) and cards (xs/sm)
 * - API matches the plan spec to keep components decoupled from selection logic
 * - Keep file size modest; extract helpers if this grows too large
 */
import { useCallback, useMemo, useRef, useState } from "react";

export type SelectedIds = Set<string>;
export type SelectionMode = "none" | "selecting";

export interface SelectionState {
  selected: SelectedIds;
  lastSelectedId: string | null;
  mode: SelectionMode;
}

export interface ItemClickOptions {
  metaKey?: boolean;
  shiftKey?: boolean;
  orderedIds?: string[];
}

export function useSelectionModel(initial?: string[]) {
  const [selected, setSelected] = useState<SelectedIds>(() => new Set(initial ?? []));
  const [lastSelectedId, setLastSelected] = useState<string | null>(null);
  const [mode, setMode] = useState<SelectionMode>(initial && initial.length ? "selecting" : "none");

  // Keep ordered ids reference for range operations when provided ad hoc
  const lastOrderedIdsRef = useRef<string[] | undefined>(undefined);

  const isSelected = useCallback((id: string) => selected.has(id), [selected]);
  const getSelected = useCallback(() => Array.from(selected), [selected]);
  const getCount = useCallback(() => selected.size, [selected]);
  const isSelectionMode = useCallback(() => mode === "selecting" || selected.size > 0, [mode, selected.size]);

  const selectOne = useCallback((id: string) => {
    setSelected(new Set([id]));
    setLastSelected(id);
    setMode("selecting");
  }, []);

  const toggle = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setLastSelected(id);
    setMode("selecting");
  }, []);

  const add = useCallback((id: string) => {
    setSelected(prev => new Set(prev).add(id));
    setLastSelected(id);
    setMode("selecting");
  }, []);

  const remove = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setMode(prev => (selected.size - 1 > 0 ? "selecting" : "none"));
  }, [selected.size]);

  const clear = useCallback(() => {
    setSelected(new Set());
    setLastSelected(null);
    setMode("none");
  }, []);

  const setMany = useCallback((ids: string[]) => {
    setSelected(new Set(ids));
    setLastSelected(ids.length ? ids[ids.length - 1] : null);
    setMode(ids.length ? "selecting" : "none");
  }, []);

  const enterSelectionMode = useCallback(() => setMode("selecting"), []);
  const exitSelectionMode = useCallback(() => setMode("none"), []);

  const selectRange = useCallback((fromId: string, toId: string, orderedIds: string[]) => {
    if (!orderedIds?.length) return;
    lastOrderedIdsRef.current = orderedIds;
    const fromIdx = orderedIds.indexOf(fromId);
    const toIdx = orderedIds.indexOf(toId);
    if (fromIdx === -1 || toIdx === -1) {
      // Fallback: just select target if range cannot be inferred
      selectOne(toId);
      return;
    }
    const [start, end] = fromIdx < toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
    const rangeIds = orderedIds.slice(start, end + 1);
    setSelected(prev => {
      const next = new Set(prev);
      rangeIds.forEach(id => next.add(id));
      return next;
    });
    setLastSelected(toId);
    setMode("selecting");
  }, [selectOne]);

  const onItemClick = useCallback((id: string, opts?: ItemClickOptions) => {
    const meta = !!opts?.metaKey;
    const shift = !!opts?.shiftKey;
    const ordered = opts?.orderedIds ?? lastOrderedIdsRef.current;

    if (shift && lastSelectedId && ordered) {
      selectRange(lastSelectedId, id, ordered);
      return;
    }
    if (meta) {
      toggle(id);
      return;
    }
    // Default behavior: single select
    selectOne(id);
  }, [lastSelectedId, selectRange, selectOne, toggle]);

  const onItemLongPress = useCallback((id: string) => {
    enterSelectionMode();
    add(id);
  }, [add, enterSelectionMode]);

  return useMemo(() => {
    const api = {
      state: { selected, lastSelectedId, mode } as SelectionState,
      isSelected,
      getSelected,
      getCount,
      isSelectionMode,
      selectOne,
      toggle,
      add,
      remove,
      clear,
      setMany,
      enterSelectionMode,
      exitSelectionMode,
      setLastSelected,
      selectRange,
      onItemClick,
      onItemLongPress
    };
    return api;
  }, [
    selected, lastSelectedId, mode,
    isSelected, getSelected, getCount, isSelectionMode,
    selectOne, toggle, add, remove, clear, setMany,
    enterSelectionMode, exitSelectionMode, selectRange, onItemClick, onItemLongPress
  ]);
}