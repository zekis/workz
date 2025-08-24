/**
 * useTodoActivity (mock)
 * - Provides mock activity data for a given todoId
 * - API mirrors the future real hook, so components don't change when wiring backend
 *
 * Note: TypeScript errors in editors without installed node modules are expected.
 * After running npm install in ./frontend, react types will be present.
 */
import { useMemo, useState, useCallback } from "react";

export type ActivityType = "comment" | "status_change" | "assignment";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  content?: string;
  author: { name: string; email?: string | null; avatarUrl?: string | null };
  createdAt: string; // ISO
  meta?: Record<string, unknown>;
}

export function useTodoActivity(todoId: string | null) {
  const [items, setItems] = useState<ActivityItem[]>(() => {
    if (!todoId) return [];
    const now = new Date().toISOString();
    const initial: ActivityItem[] = [
      {
        id: `${todoId}-a1`,
        type: "status_change",
        author: { name: "System" },
        createdAt: now,
        meta: { from: "open", to: "in_progress" }
      },
      {
        id: `${todoId}-a2`,
        type: "comment",
        content: "Kicked off work on this task.",
        author: { name: "You" },
        createdAt: now
      }
    ];
    return initial;
  });
  const [isLoading] = useState<boolean>(false);
  const [error] = useState<Error | null>(null);

  const refetch = useCallback(() => {
    // no-op in mock; future: re-read from backend
  }, []);

  const addComment = useCallback((content: string) => {
    if (!todoId) return;
    const now = new Date().toISOString();
    setItems((prev: ActivityItem[]) => [
      {
        id: `${todoId}-c${prev.length + 1}`,
        type: "comment",
        content,
        author: { name: "You" },
        createdAt: now
      },
      ...prev
    ]);
  }, [todoId]);

  return useMemo(() => ({
    activity: items,
    isLoading,
    error,
    refetch,
    addComment
  }), [items, isLoading, error, refetch, addComment]);
}