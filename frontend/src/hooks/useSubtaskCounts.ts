/**
 * useSubtaskCounts
 * - Fetches subtask counts for multiple parent todos
 * - Returns completed/total counts for each todo
 * - Optimized to fetch all subtasks in a single query
 */
import { useFrappeGetDocList } from "frappe-react-sdk";
import { useMemo } from "react";

export interface SubtaskCount {
  parentId: string;
  total: number;
  completed: number;
  percentage: number;
}

export function useSubtaskCounts(parentTodoIds: string[]) {
  // Only fetch if we have parent todo IDs
  const shouldFetch = parentTodoIds.length > 0;

  // Fetch all subtasks for the given parent todos in one query
  const { data, error, isLoading, mutate } = useFrappeGetDocList("ToDo", {
    fields: [
      "name",
      "status",
      "reference_type",
      "reference_name"
    ],
    filters: shouldFetch ? [
      ["reference_type", "=", "ToDo"],
      ["reference_name", "in", parentTodoIds]
    ] : [],
    orderBy: {
      field: "creation",
      order: "asc"
    },
    limit: 1000 // Should be enough for subtasks
  });

  // Process the data to get counts per parent todo
  const subtaskCounts = useMemo(() => {
    if (!shouldFetch || !data) return [];

    const countsMap = new Map<string, SubtaskCount>();

    // Initialize counts for all parent todos
    parentTodoIds.forEach(parentId => {
      countsMap.set(parentId, {
        parentId,
        total: 0,
        completed: 0,
        percentage: 0
      });
    });

    // Count subtasks for each parent
    data.forEach((subtask: any) => {
      const parentId = subtask.reference_name;
      if (parentId && countsMap.has(parentId)) {
        const count = countsMap.get(parentId)!;
        count.total++;
        
        if (subtask.status === "Closed") {
          count.completed++;
        }
        
        // Calculate percentage
        count.percentage = count.total > 0 ? Math.round((count.completed / count.total) * 100) : 0;
      }
    });

    return Array.from(countsMap.values());
  }, [data, parentTodoIds, shouldFetch]);

  // Helper function to get count for a specific parent todo
  const getSubtaskCount = (parentId: string): SubtaskCount | null => {
    return subtaskCounts.find(count => count.parentId === parentId) || null;
  };

  return {
    subtaskCounts,
    getSubtaskCount,
    isLoading: shouldFetch ? isLoading : false,
    error: shouldFetch ? error : null,
    refresh: mutate
  };
}
