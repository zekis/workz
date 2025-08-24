/**
 * useTodoActivity (real endpoints)
 * - Integrates with custom backend under workz.api
 *   GET  /api/method/workz.api.list_history?todo_id=NAME
 *       -> [{ id, author, content, created_at, type }]
 *   POST /api/method/workz.api.add_comment
 *       body { todo_id, content } -> returns created item
 */
import { useState, useCallback, useEffect, useMemo } from "react";
import { getJSON, postJSON } from "../lib/api";

export type ActivityType = "comment" | "status_change" | "assignment";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  content?: string;
  author: { name: string; email?: string | null; avatarUrl?: string | null } | null;
  createdAt: string; // ISO
  meta?: Record<string, unknown>;
}

interface RawActivity {
  id: string;
  type: string;
  author?: { name: string; email?: string | null; avatarUrl?: string | null } | null;
  content?: string | null;
  created_at: string;
  meta?: Record<string, unknown> | null;
}

function mapRaw(a: RawActivity): ActivityItem {
  return {
    id: a.id,
    type: (a.type as ActivityType) || "comment",
    author: a.author ?? null,
    content: a.content ?? undefined,
    createdAt: a.created_at,
    meta: a.meta ?? undefined
  };
}

export function useTodoActivity(todoId: string | null) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!todoId) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getJSON<RawActivity[]>("/api/method/workz.api.list_history", { todo_id: todoId });
      setItems((data || []).map(mapRaw));
    } catch (e: any) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, [todoId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const addComment = useCallback(async (content: string) => {
    if (!todoId) return;
    const trimmed = content.trim();
    if (!trimmed) return;

    // optimistic insert
    const tempId = "temp-" + Math.random().toString(36).slice(2);
    const optimistic: ActivityItem = {
      id: tempId,
      type: "comment",
      author: { name: "You" },
      content: trimmed,
      createdAt: new Date().toISOString()
    };
    setItems(prev => [optimistic, ...prev]);
    try {
      const created = await postJSON<RawActivity>("/api/method/workz.api.add_comment", {
        todo_id: todoId,
        content: trimmed
      });
      setItems(prev => {
        const copy = [...prev];
        const idx = copy.findIndex(i => i.id === tempId);
        if (idx >= 0) copy[idx] = mapRaw(created);
        return copy;
      });
    } catch (e) {
      // rollback
      setItems(prev => prev.filter(i => i.id !== tempId));
      throw e;
    }
  }, [todoId]);

  return useMemo(() => ({
    activity: items,
    isLoading,
    error,
    refetch,
    addComment
  }), [items, isLoading, error, refetch, addComment]);
}