/**
 * useTodos (list only, no mock)
 * - Always fetches ToDos using frappe-react-sdk useFrappeGetDocList
 * - Surfaces loading/empty/error states; never returns dummy data
 *
 * Implementation note:
 * - Direct ESM import ensures the hook is bundled and executed in production.
 */
import { useMemo } from "react";
import { useFrappeGetDocList } from "frappe-react-sdk";

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
    updatedAt: row.modified ?? null
  };
}

export function useTodos() {
  const fields = [
    "name",
    "description",
    "reference_name",
    "reference_type",
    "allocated_to",
    "priority",
    "status",
    "creation",
    "modified"
  ];

  // Cast fields to the SDK's expected Field list type to satisfy TS
  const { data, error, isLoading, mutate } = useFrappeGetDocList<FrappeToDo>("ToDo", {
    fields: fields as unknown as (
      ("*" | keyof FrappeToDo | "owner" | "modified_by" | "idx" | "docstatus" | "parent" | "parentfield" | "parenttype")[]
    ),
    filters: [
      // Exclude subtasks (todos that reference other todos)
      ["reference_type", "!=", "ToDo"]
    ],
    limit: 100,
    orderBy: { field: "modified", order: "desc" }
  });

  const todos = useMemo<Todo[]>(
    () => (data || []).map(mapFrappeToTodo),
    [data]
  );

  return {
    todos,
    isLoading: !!isLoading,
    error: (error ?? null) as Error | null,
    refetch: mutate
  };
}