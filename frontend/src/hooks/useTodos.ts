/**
 * useTodos (list only, no mock)
 * - Always fetches ToDos using frappe-react-sdk useFrappeGetDocList
 * - Surfaces loading/empty/error states; never returns dummy data
 *
 * Implementation note:
 * - Direct ESM import ensures the hook is bundled and executed in production.
 */
import { useMemo } from "react";
import { useFrappeGetCall } from "frappe-react-sdk";

export interface FrappeToDo {
  name: string;
  description?: string;
  reference_name?: string | null;
  reference_type?: string | null;
  allocated_to?: string | null;
  priority?: string | null;
  status?: string | null;
  creation?: string | null;
  modified?: string | null;
  owner?: string | null;
  date?: string | null;
}

export interface Todo {
  id: string;
  subject: string;
  referenceType?: string | null;
  referenceName?: string | null;
  assignee?: string | null;
  priority?: string | null;
  status?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
  owner?: string | null;
  dueDate?: string | null;
}

function mapFrappeToTodo(row: FrappeToDo): Todo {
  return {
    id: row.name,
    subject: row.description || "",
    referenceType: row.reference_type ?? null,
    referenceName: row.reference_name ?? null,
    assignee: row.allocated_to ?? null,
    priority: row.priority ?? null,
    status: row.status ?? null,
    createdAt: row.creation ?? null,
    updatedAt: row.modified ?? null,
    owner: row.owner ?? null,
    dueDate: row.date ?? null
  };
}

export function useTodos() {
  // Use our custom API endpoint for server-side filtering
  const { data, error, isLoading, mutate } = useFrappeGetCall<FrappeToDo[]>("workz.api.get_user_todos");

  const todos = useMemo<Todo[]>(() => {
    // Handle the API response properly
    let todoData: FrappeToDo[] = [];

    if (Array.isArray(data)) {
      todoData = data;
    } else if (data && typeof data === 'object') {
      // Handle case where API returns {message: [...]} or similar structure
      const possibleArrays = [
        (data as any).message,
        (data as any).data,
        (data as any).result
      ];

      for (const arr of possibleArrays) {
        if (Array.isArray(arr)) {
          todoData = arr;
          break;
        }
      }
    }

    return todoData.map(mapFrappeToTodo);
  }, [data]);

  return {
    todos,
    isLoading: !!isLoading,
    error: (error ?? null) as Error | null,
    refetch: mutate
  };
}